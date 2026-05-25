import { prisma } from '../../config/db';
import { CreateFolderDtoType, UpdateFolderDtoType } from './folders.dto';
import { NotFoundError, ValidationError } from '../../utils/errors';

export async function createFolder(userId: string, dto: CreateFolderDtoType) {
  if (dto.parentId) {
    const parent = await prisma.folder.findFirst({
      where: { id: dto.parentId, userId },
    });
    if (!parent) {
      throw new NotFoundError('Parent folder not found');
    }
  }

  const folder = await prisma.folder.create({
    data: {
      name: dto.name,
      userId,
      parentId: dto.parentId ?? null,
      color: dto.color ?? null,
    },
  });

  return folder;
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

async function wouldCreateCycle(folderId: string, newParentId: string, userId: string): Promise<boolean> {
  let currentId: string | null = newParentId;
  const visited = new Set<string>();
  while (currentId !== null) {
    if (currentId === folderId) return true;
    if (visited.has(currentId)) break;
    if (visited.size > 50) break;
    visited.add(currentId);
    const row: { parentId: string | null } | null = await prisma.folder.findFirst({
      where: { id: currentId, userId },
      select: { parentId: true },
    });
    currentId = row?.parentId ?? null;
  }
  return false;
}

export async function updateFolder(userId: string, folderId: string, dto: UpdateFolderDtoType) {
  const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
  if (!folder) {
    throw new NotFoundError('Folder not found');
  }

  if (dto.parentId !== undefined && dto.parentId !== null) {
    if (dto.parentId === folderId) {
      throw new ValidationError('A folder cannot be its own parent');
    }
    const parent = await prisma.folder.findFirst({ where: { id: dto.parentId, userId } });
    if (!parent) {
      throw new NotFoundError('Parent folder not found');
    }
    if (await wouldCreateCycle(folderId, dto.parentId, userId)) {
      throw new ValidationError('Cannot create a circular folder hierarchy');
    }
  }

  const updated = await prisma.folder.update({
    where: { id: folderId },
    data: {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.parentId !== undefined && { parentId: dto.parentId }),
      ...(dto.color !== undefined && { color: dto.color }),
    },
  });

  return updated;
}

export async function deleteFolder(userId: string, folderId: string) {
  const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
  if (!folder) {
    throw new NotFoundError('Folder not found');
  }

  const childCount = await prisma.folder.count({ where: { parentId: folderId, userId } });
  if (childCount > 0) {
    throw new ValidationError('Cannot delete a folder that contains sub-folders. Delete or move them first.');
  }

  const affectedSets = await prisma.set.count({ where: { folderId, userId } });

  await prisma.folder.deleteMany({ where: { id: folderId, userId } });

  return { message: 'Folder deleted successfully', affectedSets };
}
