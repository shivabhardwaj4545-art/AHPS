import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T,
  errors?: any,
  meta?: ApiResponse['meta']
): Response => {
  const payload: ApiResponse<T> = {
    success,
    message,
  };

  if (data !== undefined) payload.data = data;
  if (errors !== undefined) payload.errors = errors;
  if (meta !== undefined) payload.meta = meta;

  return res.status(statusCode).json(payload);
};

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: ApiResponse['meta']
): Response => {
  return sendResponse(res, statusCode, true, message, data, undefined, meta);
};

export const sendError = (
  res: Response,
  message: string,
  errors?: any,
  statusCode = 400
): Response => {
  return sendResponse(res, statusCode, false, message, undefined, errors);
};

