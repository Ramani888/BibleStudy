import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { CreateFolderDtoType, UpdateFolderDtoType } from './folders.dto';
import { NotFoundError, ValidationError } from '../../utils/errors';

// Serialize ALL hierarchy mutations (create/reparent/delete) for a single user inside one
// transaction guarded by a per-user Postgres advisory lock. Without this, concurrent requests can
// race the cycle check (two roots reparented into each other) or move an existing subtree under a
// folder that a paused delete already saw as empty, then cascade-delete it. The xact lock is auto-
// released on commit/rollback, so mutations for the same user run strictly one at a time.
async function withHierarchyLock<T>(userId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    return fn(tx);
  });
}

export async function createFolder(userId: string, dto: CreateFolderDtoType) {
  return withHierarchyLock(userId, async (tx) => {
    if (dto.parentId) {
      const parent = await tx.folder.findFirst({ where: { id: dto.parentId, userId } });
      if (!parent) {
        throw new NotFoundError('Parent folder not found');
      }
    }

    return tx.folder.create({
      data: {
        name: dto.name,
        userId,
        parentId: dto.parentId ?? null,
        color: dto.color ?? null,
      },
    });
  });
}

export async function listFolders(userId: string) {
  const folders = await prisma.folder.findMany({
    where: { userId },
    include: {
      sets: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return folders;
}

export async function getFolderById(userId: string, folderId: string) {
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, userId },
    include: {
      sets: {
        include: { _count: { select: { cards: true } } },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!folder) {
    throw new NotFoundError('Folder not found');
  }

  return folder;
}

// Walks ancestors of newParentId within the caller's tree, under the same tx/lock as the reparent.
async function wouldCreateCycle(
  tx: Prisma.TransactionClient,
  folderId: string,
  newParentId: string,
  userId: string,
): Promise<boolean> {
  let currentId: string | null = newParentId;
  const visited = new Set<string>();
  while (currentId !== null) {
    if (currentId === folderId) return true;
    // A revisit means the EXISTING tree already contains a cycle — reject rather than report "safe".
    if (visited.has(currentId)) return true;
    // Chain deeper than the cap: we can't verify it's acyclic, so REJECT rather than give up and
    // report "no cycle" (returning false here previously let a >50-deep reparent create a real cycle).
    if (visited.size >= 50) return true;
    visited.add(currentId);
    const row: { parentId: string | null } | null = await tx.folder.findFirst({
      where: { id: currentId, userId },
      select: { parentId: true },
    });
    currentId = row?.parentId ?? null;
  }
  return false;
}

export async function updateFolder(userId: string, folderId: string, dto: UpdateFolderDtoType) {
  return withHierarchyLock(userId, async (tx) => {
    const folder = await tx.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === folderId) {
        throw new ValidationError('A folder cannot be its own parent');
      }
      const parent = await tx.folder.findFirst({ where: { id: dto.parentId, userId } });
      if (!parent) {
        throw new NotFoundError('Parent folder not found');
      }
      if (await wouldCreateCycle(tx, folderId, dto.parentId, userId)) {
        throw new ValidationError('Cannot create a circular folder hierarchy');
      }
    }

    // Ownership-scoped write (atomic — no check-then-act on the mutation itself).
    await tx.folder.updateMany({
      where: { id: folderId, userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId }),
        ...(dto.color !== undefined && { color: dto.color }),
      },
    });

    return tx.folder.findFirstOrThrow({ where: { id: folderId, userId } });
  });
}

export async function deleteFolder(userId: string, folderId: string) {
  return withHierarchyLock(userId, async (tx) => {
    const folder = await tx.folder.findFirst({ where: { id: folderId, userId } });
    if (!folder) {
      throw new NotFoundError('Folder not found');
    }

    const childCount = await tx.folder.count({ where: { parentId: folderId, userId } });
    if (childCount > 0) {
      throw new ValidationError('Cannot delete a folder that contains sub-folders. Delete or move them first.');
    }

    const affectedSets = await tx.set.count({ where: { folderId, userId } });

    await tx.folder.deleteMany({ where: { id: folderId, userId } });

    return { message: 'Folder deleted successfully', affectedSets };
  });
}
