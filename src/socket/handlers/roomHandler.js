import * as roomService from "../../services/roomService.js";
import prisma from "../../prisma/prismaClient.js";
import { getUserBySupabaseId } from "../../utils/socketUtils.js";

// Обработчик события входа пользователя в комнату
export function handleJoinRoom(socket, chatNamespace) {
  return async (roomId) => {
    try {
      // Определяем пользователя из токена
      const user = await getUserBySupabaseId(socket.data.user.sub);

      // Добавляем пользователя в комнату на уровне БД (если ещё не там)
      await roomService.joinRoom(roomId, socket.data.user.sub);

      // Подписываем сокет на события этой комнаты
      socket.join(roomId);

      // Получаем список всех участников комнаты с данными пользователей
      const members = await prisma.roomMember.findMany({
        where: { roomId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      // Отправляем текущему пользователю список участников
      socket.emit("room:users", members.map((m) => m.user));

      // Уведомляем всех в комнате о появлении нового пользователя онлайн
      socket.to(roomId).emit("user:online", {
        userId: user.id,
        username: user.name || user.email,
      });

      // Подтверждаем пользователю успешный вход
      socket.emit("room:joined", { roomId });
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  };
}

// Обработчик события выхода пользователя из комнаты
export function handleLeaveRoom(socket, chatNamespace) {
  return async (roomId) => {
    try {
      // Определяем пользователя
      const user = await getUserBySupabaseId(socket.data.user.sub);

      // Проверяем, что пользователь действительно в этой комнате
      const member = await prisma.roomMember.findUnique({
        where: { userId_roomId: { userId: user.id, roomId } },
      });

      if (!member) {
        return socket.emit("error", { message: "Вы не в этой комнате" });
      }

      // Удаляем пользователя из комнаты в БД
      await roomService.leaveRoom(roomId, socket.data.user.sub);

      // Отписываем сокет от событий комнаты
      socket.leave(roomId);

      // Уведомляем оставшихся участников о выходе
      socket.to(roomId).emit("user:offline", {
        userId: user.id,
        username: user.name || user.email,
      });

      // Подтверждаем пользователю успешный выход
      socket.emit("room:left", { roomId });
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  };
}
