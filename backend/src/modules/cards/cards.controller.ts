import { Request, Response } from 'express';
import * as cardsService from './cards.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AppError } from '../../utils/errors';

function handleError(res: Response, error: unknown, fallback = 'Operation failed'): void {
  if (error instanceof AppError) { sendError(res, error.message, error.statusCode, error.code); return; }
  const message = error instanceof Error ? error.message : fallback;
  sendError(res, message, 500, 'INTERNAL_ERROR');
}

export async function createCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.createCard(req.user!.id, req.body);
    sendSuccess(res, card, 'Card created successfully', 201);
  } catch (error) { handleError(res, error, 'Failed to create card'); }
}

export async function bulkCreateCards(req: Request, res: Response): Promise<void> {
  try {
    const cards = await cardsService.bulkCreateCards(req.user!.id, req.body);
    sendSuccess(res, cards, `${cards.length} cards created successfully`, 201);
  } catch (error) { handleError(res, error, 'Failed to create cards'); }
}

export async function listCardsBySet(req: Request, res: Response): Promise<void> {
  try {
    const cards = await cardsService.listCardsBySet(req.user!.id, req.params.setId);
    sendSuccess(res, cards, 'Cards retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to list cards'); }
}

export async function getCardById(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.getCardById(req.user!.id, req.params.id);
    sendSuccess(res, card, 'Card retrieved successfully');
  } catch (error) { handleError(res, error, 'Failed to get card'); }
}

export async function updateCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.updateCard(req.user!.id, req.params.id, req.body);
    sendSuccess(res, card, 'Card updated successfully');
  } catch (error) { handleError(res, error, 'Failed to update card'); }
}

export async function deleteCard(req: Request, res: Response): Promise<void> {
  try {
    const result = await cardsService.deleteCard(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to delete card'); }
}

export async function copyCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.copyCard(req.user!.id, req.params.id);
    sendSuccess(res, card, 'Card copied successfully', 201);
  } catch (error) { handleError(res, error, 'Failed to copy card'); }
}

export async function moveCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.moveCard(req.user!.id, req.params.id, req.body.targetSetId);
    sendSuccess(res, card, 'Card moved successfully');
  } catch (error) { handleError(res, error, 'Failed to move card'); }
}

export async function reorderCards(req: Request, res: Response): Promise<void> {
  try {
    const result = await cardsService.reorderCards(req.user!.id, req.body);
    sendSuccess(res, result, result.message);
  } catch (error) { handleError(res, error, 'Failed to reorder cards'); }
}

export async function recordStudyResult(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.recordStudyResult(req.user!.id, req.params.id, req.body);
    sendSuccess(res, card, 'Study result recorded');
  } catch (error) { handleError(res, error, 'Failed to record study result'); }
}
