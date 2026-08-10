import { prisma } from '../../config/db';
import { CreateNoteDtoType, UpdateNoteDtoType } from './notes.dto';
import { NotFoundError } from '../../utils/errors';
import { logActivity } from '../../utils/activity';

export async function listNotes(userId: string) {
  return prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createNote(userId: string, dto: CreateNoteDtoType) {
  const note = await prisma.note.create({
    data: {
      title: dto.title,
      body:  dto.body,
      tags:  dto.tags ?? [],
      userId,
    },
  });
  logActivity(userId, 'CREATED_NOTE', note.id);
  return note;
}

export async function getNoteById(userId: string, noteId: string) {
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
  if (!note) throw new NotFoundError('Note not found');
  return note;
}

export async function updateNote(userId: string, noteId: string, dto: UpdateNoteDtoType) {
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
  if (!note) throw new NotFoundError('Note not found');

  return prisma.note.update({
    where: { id: noteId },
    data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.body  !== undefined && { body:  dto.body  }),
      ...(dto.tags  !== undefined && { tags:  dto.tags  }),
    },
  });
}

export async function deleteNote(userId: string, noteId: string) {
  const note = await prisma.note.findFirst({ where: { id: noteId, userId } });
  if (!note) throw new NotFoundError('Note not found');

  await prisma.note.delete({ where: { id: noteId } });
  return { message: 'Note deleted successfully' };
}
