import { Request, Response } from 'express';
import * as cardsService from './cards.service';
import { sendSuccess, sendError } from '../../utils/response';
import {
  CreateCardDtoType,
  BulkCreateCardsDtoType,
  UpdateCardDtoType,
  ReorderCardsDtoType,
  StudyCardDtoType,
  MoveCardDtoType,
} from './cards.dto';

export async function createCard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as CreateCardDtoType;
    const card = await cardsService.createCard(userId, dto);
    sendSuccess(res, card, 'Card created successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create card';
    sendError(res, message, 400, 'CREATE_ERROR');
  }
}

export async function bulkCreateCards(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as BulkCreateCardsDtoType;
    const cards = await cardsService.bulkCreateCards(userId, dto);
    sendSuccess(res, cards, `${cards.length} cards created successfully`, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create cards';
    sendError(res, message, 400, 'CREATE_ERROR');
  }
}

export async function listCardsBySet(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { setId } = req.params;
    const cards = await cardsService.listCardsBySet(userId, setId);
    sendSuccess(res, cards, 'Cards retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list cards';
    const statusCode = message === 'Set not found' ? 404 : 400;
    sendError(res, message, statusCode, 'LIST_ERROR');
  }
}

export async function getCardById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const card = await cardsService.getCardById(userId, id);
    sendSuccess(res, card, 'Card retrieved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get card';
    const statusCode = message === 'Card not found' ? 404 : 400;
    sendError(res, message, statusCode, 'NOT_FOUND');
  }
}

export async function updateCard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as UpdateCardDtoType;
    const card = await cardsService.updateCard(userId, id, dto);
    sendSuccess(res, card, 'Card updated successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update card';
    const statusCode = message === 'Card not found' ? 404 : 400;
    sendError(res, message, statusCode, 'UPDATE_ERROR');
  }
}

export async function deleteCard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await cardsService.deleteCard(userId, id);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete card';
    const statusCode = message === 'Card not found' ? 404 : 400;
    sendError(res, message, statusCode, 'DELETE_ERROR');
  }
}

export async function copyCard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const card = await cardsService.copyCard(userId, id);
    sendSuccess(res, card, 'Card copied successfully', 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to copy card';
    const statusCode = message === 'Card not found' ? 404 : 400;
    sendError(res, message, statusCode, 'COPY_ERROR');
  }
}

export async function moveCard(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as MoveCardDtoType;
    const card = await cardsService.moveCard(userId, id, dto.targetSetId);
    sendSuccess(res, card, 'Card moved successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to move card';
    const statusCode = message === 'Card not found' ? 404 : 400;
    sendError(res, message, statusCode, 'MOVE_ERROR');
  }
}

export async function reorderCards(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const dto = req.body as ReorderCardsDtoType;
    const result = await cardsService.reorderCards(userId, dto);
    sendSuccess(res, result, result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to reorder cards';
    sendError(res, message, 400, 'REORDER_ERROR');
  }
}

export async function recordStudyResult(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as StudyCardDtoType;
    const card = await cardsService.recordStudyResult(userId, id, dto);
    sendSuccess(res, card, 'Study result recorded');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record study result';
    const statusCode = message === 'Card not found' ? 404 : 400;
    sendError(res, message, statusCode, 'STUDY_ERROR');
  }
}
