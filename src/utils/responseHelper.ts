// src/utils/responseHelper.ts
import { Response } from "express";
import { ErrorCodes, ErrorResponse, SuccessResponse } from "./errorCodes";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  code?: string,
  meta?: Record<string, any>,
) => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (code) response.code = code;
  if (meta) response.meta = meta;

  res.json(response);
};

export const sendError = (
  res: Response,
  code: string,
  status: number = 400,
  meta?: Record<string, any>,
) => {
  const response: ErrorResponse = {
    success: false,
    code,
  };

  if (meta) response.meta = meta;

  res.status(status).json(response);
};

// Для динамических ошибок типа "Требуется роль: ADMIN"
export const sendRoleError = (res: Response, role: string) => {
  sendError(res, ErrorCodes.ADMIN_RIGHTS_REQUIRED, 403, { role });
};
