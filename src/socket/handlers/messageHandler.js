import * as messageService from "../../services/messageService.js";
import prisma from "../../prisma/prismaClient.js";
import { getUserBySupabaseId } from "../../utils/socketUtils.js";

// Обработчик события отправки сообщения через WebSocket
export function handleSendMessage(socket, chatNamespace) {
  return async (roomId, content) => {
    try {
      // Проверяем, что сообщение не пустое
      if (!content || content.trim() === "") {
        return socket.emit("error", { message: "Сообщение не может быть пустым" });
      }

      // Получаем пользователя по данным из JWT-токена
      const user = await getUserBySupabaseId(socket.data.user.sub);

      // Проверяем, что пользователь является участником этой комнаты
      const member = await prisma.roomMember.findUnique({
        where: { userId_roomId: { userId: user.id, roomId } },
      });

      if (!member) {
        return socket.emit("error", { message: "Вы не являетесь участником этой комнаты" });
      }

      // Создаём сообщение в базе данных
      const message = await messageService.createMessage(
        roomId,
        socket.data.user.sub,
        content
      );

      // Рассылаем сообщение всем участникам комнаты через namespace
      chatNamespace.to(roomId).emit("message:receive", {
        id: message.id,
        content: message.content,
        senderId: message.sender.id,
        senderName: message.sender.name || message.sender.email,
        createdAt: message.createdAt,
        roomId,
      });
    } catch (error) {
      socket.emit("error", { message: error.message });
    }
  };
}

// Обработчик разрыва соединения — уведомляем всех о выходе пользователя
export function handleDisconnect(socket, chatNamespace) {
  return async () => {
    try {
      const user = socket.data.user;
      if (user) {
        const dbUser = await getUserBySupabaseId(user.sub);
        // Находим все комнаты, в которых состоит пользователь
        const memberRooms = await prisma.roomMember.findMany({
          where: { userId: dbUser.id },
          select: { roomId: true },
        });

        // Отправляем событие user:offline во все эти комнаты
        for (const member of memberRooms) {
          chatNamespace.to(member.roomId).emit("user:offline", {
            userId: dbUser.id,
            username: user.name || user.email,
          });
        }
      }
    } catch (error) {
      // Ошибки при дисконнекте не критичны — просто игнорируем
      return;
    }
  };
}
