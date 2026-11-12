import { Response } from "express";
import { hasMessage, messageFor, resolveLang } from "./errorMessages";

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

// Функция для ошибок с поддержкой динамических параметров.
// Добавляет человекочитаемый `message` на языке запроса (X-Lang / Accept-Language),
// а ошибкам полей в meta.errors — свой `message` (например, что именно не так с паролем).
export const sendError = (
  res: Response,
  code: string,
  status: number = 400,
  meta?: Record<string, any>, // Для динамических параметров
) => {
  const lang = resolveLang(res.req);
  const response: any = {
    success: false,
    code,
  };

  if (meta) {
    response.meta = { ...meta };
    if (Array.isArray(meta.errors)) {
      response.meta.errors = meta.errors.map((e: any) =>
        typeof e === "string"
          ? // сырые сообщения ORM пользователю не показываем
            { code: "VALIDATION_ERROR", message: messageFor("VALIDATION_ERROR", lang, status) }
          : {
              ...e,
              // reason уточняет общий код (например, INVALID_PASSWORD_FORMAT -> PASSWORD_TOO_SHORT)
              message: e.message ?? messageFor(e.reason && hasMessage(e.reason) ? e.reason : e.code, lang, status, e),
            },
      );
    }
  }

  // Общий текст: для ошибок валидации — первая конкретная проблема, иначе текст кода
  const firstFieldError = response.meta?.errors?.find((e: any) => e.field)?.message;
  response.message = firstFieldError ?? messageFor(code, lang, status, meta ?? {});

  res.status(status).json(response);
};

// Утилита для создания meta с параметрами (для единообразия)
export const createErrorMeta = (
  params: Record<string, any>,
): Record<string, any> => {
  return params;
};
