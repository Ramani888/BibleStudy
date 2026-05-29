import { Request, Response } from 'express';
import * as notesService from './notes.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function listNotes(req: Request, res: Response): Promise<void> {
  try {
    const notes = await notesService.listNotes(req.user!.id);
    sendSuccess(res, notes, 'Notes retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to list notes'); }
}

export async function createNote(req: Request, res: Response): Promise<void> {
  try {
    const note = await notesService.createNote(req.user!.id, req.body);
    sendSuccess(res, note, 'Note created successfully', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to create note'); }
}

export async function getNoteById(req: Request, res: Response): Promise<void> {
  try {
    const note = await notesService.getNoteById(req.user!.id, req.params.id);
    sendSuccess(res, note, 'Note retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to get note'); }
}

export async function updateNote(req: Request, res: Response): Promise<void> {
  try {
    const note = await notesService.updateNote(req.user!.id, req.params.id, req.body);
    sendSuccess(res, note, 'Note updated successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to update note'); }
}

export async function deleteNote(req: Request, res: Response): Promise<void> {
  try {
    const result = await notesService.deleteNote(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to delete note'); }
}
