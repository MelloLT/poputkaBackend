import { Response } from "express";

// Обновленная функция sendSuccess с поддержкой кодов
export const sendSuccess = <T>(
  res: Response,
  data: T,
  code?: string, // Теперь code опциональный, но рекомендуется передавать
  status: number = 200,
  meta?: Record<string, any>, // Добавляем meta для дополнительных данных
) => {
  const response: any = {
    success: true,
    data,
  };

  if (code) response.code = code;
  if (meta) response.meta = meta;

  res.status(status).json(response);
};

// Функция для ошибок с поддержкой динамических параметров
export const sendError = (
  res: Response,
  code: string,
  status: number = 400,
  meta?: Record<string, any>, // Для динамических параметров
) => {
  const response: any = {
    success: false,
    code,
  };

  if (meta) response.meta = meta;

  res.status(status).json(response);
};

// Утилита для создания meta с параметрами (для единообразия)
export const createErrorMeta = (
  params: Record<string, any>,
): Record<string, any> => {
  return params;
};
