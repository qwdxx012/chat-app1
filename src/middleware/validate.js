import AppError from "../utils/appError.js";

// Middleware для валидации тела запроса через Zod-схему
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // Используем optional chaining для безопасного извлечения сообщения
      const errorMessage =
        result.error?.errors?.[0]?.message || "Invalid request data";
      return next(new AppError(errorMessage, 400));
    }
    req.body = result.data;
    next();
  };
}
