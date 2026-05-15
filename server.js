import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import config from "./src/config.js";
import initializeSocket from "./src/socket/index.js";

const startServer = async () => {
  try {
    // Создаём HTTP-сервер поверх Express (нужно для WebSocket)
    const httpServer = createServer(app);

    // Инициализируем Socket.IO с настройками CORS
    const io = new Server(httpServer, {
      cors: { origin: config.cors.origin },
    });

    // Сохраняем экземпляр io в Express — доступно из любого контроллера
    app.set("io", io);

    // Подключаем всю WebSocket-логику (аутентификация, обработчики событий)
    initializeSocket(io);

    // Запуск сервера через httpServer, а не app.listen
    httpServer.listen(config.port, () => {
      console.log(`Сервер запущен на порту http://localhost:${config.port}`);
    });
  } catch (err) {
    console.error("Не удалось запустить сервер:", err);
  }
};

startServer();
