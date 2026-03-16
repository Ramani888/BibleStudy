import { Response } from 'express';

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    message,
    error: null,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  code = 'ERROR',
  details: unknown = null
): void => {
  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    error: { code, details },
  });
};
