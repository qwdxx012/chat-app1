// Глобальный обработчик ошибок Express
export default function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Внутренняя ошибка сервера";
  res.status(statusCode).json({ message });
}
