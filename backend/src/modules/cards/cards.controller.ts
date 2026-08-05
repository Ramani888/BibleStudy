import { Request, Response } from 'express';
import * as cardsService from './cards.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function getDueSummary(req: Request, res: Response): Promise<void> {
  try {
    const summary = await cardsService.getDueSummary(req.user!.id);
    sendSuccess(res, summary, 'Due summary retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get due summary'); }
}

export async function createCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.createCard(req.user!.id, req.body);
    sendSuccess(res, card, 'Card created successfully', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to create card'); }
}

export async function bulkCreateCards(req: Request, res: Response): Promise<void> {
  try {
    const cards = await cardsService.bulkCreateCards(req.user!.id, req.body);
    sendSuccess(res, cards, `${cards.length} cards created successfully`, 201);
  } catch (error) { handleControllerError(res, error, 'Failed to create cards'); }
}

export async function listCardsBySet(req: Request, res: Response): Promise<void> {
  try {
    const cards = await cardsService.listCardsBySet(req.user!.id, req.params.setId);
    sendSuccess(res, cards, 'Cards retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to list cards'); }
}

export async function getCardById(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.getCardById(req.user!.id, req.params.id);
    sendSuccess(res, card, 'Card retrieved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to get card'); }
}

export async function updateCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.updateCard(req.user!.id, req.params.id, req.body);
    sendSuccess(res, card, 'Card updated successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to update card'); }
}

export async function deleteCard(req: Request, res: Response): Promise<void> {
  try {
    const result = await cardsService.deleteCard(req.user!.id, req.params.id);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to delete card'); }
}

export async function copyCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.copyCard(req.user!.id, req.params.id);
    sendSuccess(res, card, 'Card copied successfully', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to copy card'); }
}

export async function moveCard(req: Request, res: Response): Promise<void> {
  try {
    const card = await cardsService.moveCard(req.user!.id, req.params.id, req.body.targetSetId);
    sendSuccess(res, card, 'Card moved successfully');
  } catch (error) { handleControllerError(res, error, 'Failed to move card'); }
}

export async function reorderCards(req: Request, res: Response): Promise<void> {
  try {
    const result = await cardsService.reorderCards(req.user!.id, req.body);
    sendSuccess(res, result, result.message);
  } catch (error) { handleControllerError(res, error, 'Failed to reorder cards'); }
}
