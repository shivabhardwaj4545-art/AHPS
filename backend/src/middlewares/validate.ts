import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign parsed data back
      req.body = parsed.body || req.body;
      req.query = (parsed.query as any) || req.query;
      req.params = parsed.params || req.params;

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => ({
          field: err.path.slice(1).join('.'),
          message: err.message,
        }));
        return sendError(res, 'Validation error occurred.', errorMessages, 422);
      }
      return sendError(res, 'Invalid request input data.', undefined, 400);
    }
  };
};

