import { prisma } from '../../config/db';
import { CreateFolderDtoType, UpdateFolderDtoType } from './folders.dto';

export async function createFolder(userId: string, dto: CreateFolderDtoType) {
  if (dto.parentId) {
    const parent = await prisma.folder.findFirst({
      where: { id: dto.parentId, userId },
    });
    if (!parent) {
      throw new Error('Parent folder not found');
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
      sets: { orderBy: { updatedAt: 'desc' } },
    },
  });

  if (!folder) {
    throw new Error('Folder not found');
  }

  return folder;
}

export async function updateFolder(userId: string, folderId: string, dto: UpdateFolderDtoType) {
  const folder = await prisma.folder.findFirst({ where: { id: folderId, userId } });
  if (!folder) {
    throw new Error('Folder not found');
  }

  if (dto.parentId !== undefined && dto.parentId !== null) {
    // Prevent setting folder as its own parent
    if (dto.parentId === folderId) {
      throw new Error('A folder cannot be its own parent');
    }
    const parent = await prisma.folder.findFirst({ where: { id: dto.parentId, userId } });
    if (!parent) {
      throw new Error('Parent folder not found');
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
    throw new Error('Folder not found');
  }

  await prisma.folder.delete({ where: { id: folderId } });

  return { message: 'Folder deleted successfully' };
}
