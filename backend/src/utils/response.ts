import { Response } from 'express';

export const sendSuccess = (res: Response, statusCode: number, message: string, data?: any) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, statusCode: number, message: string) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};
