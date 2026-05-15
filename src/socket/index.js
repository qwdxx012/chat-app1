import socketAuthenticate from "./authenticate.js";
import { handleJoinRoom, handleLeaveRoom } from "./handlers/roomHandler.js";
import { handleSendMessage, handleDisconnect } from "./handlers/messageHandler.js";

// Точка входа для всей WebSocket-логики сервера
export default function initializeSocket(io) {
  // Создаём изолированное пространство имён /chat
  const chatNamespace = io.of("/chat");

  // Подключаем middleware аутентификации — проверяет JWT при каждом подключении
  chatNamespace.use((socket, next) => {
    socketAuthenticate(socket, next);
  });

  // Обработчик нового подключения
  chatNamespace.on("connection", (socket) => {
    // Регистрируем обработчики событий от клиента
    socket.on("room:join", handleJoinRoom(socket, chatNamespace));
    socket.on("room:leave", handleLeaveRoom(socket, chatNamespace));
    socket.on("message:send", handleSendMessage(socket, chatNamespace));
    socket.on("disconnect", handleDisconnect(socket, chatNamespace));

    // Ошибки на уровне сокета — просто игнорируем
    socket.on("error", (error) => {
      return;
    });
  });
}
