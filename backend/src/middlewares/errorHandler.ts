import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
import { sendError } from '../utils/response.js';

export class AppError extends Error {
  public statusCode: number;
  public errors?: any;

  constructor(message: string, statusCode = 400, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.errors, err.statusCode);
  }

  // Handle Prisma errors safely without leaking DB internals
  if (err.code === 'P2002') {
    const target = (err.meta?.target as string[])?.join(', ') || 'field';
    return sendError(res, `A duplicate record already exists with that ${target}.`, undefined, 409);
  }

  if (err.code === 'P2025') {
    return sendError(res, 'The requested record could not be found.', undefined, 404);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token provided.', undefined, 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Session token has expired. Please log in again.', undefined, 401);
  }

  const isDev = process.env.NODE_ENV === 'development';
  return sendError(
    res,
    isDev ? err.message : 'An internal server error occurred. Please contact support.',
    isDev ? err.stack : undefined,
    500
  );
};

