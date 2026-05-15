import { createRemoteJWKSet, jwtVerify } from "jose";
import config from "../config.js";

// Загружаем публичные ключи Supabase для проверки подписи JWT
const JWKS = createRemoteJWKSet(
  new URL(`${config.supabase.url}/auth/v1/.well-known/jwks.json`)
);

// Издатель токена (кто его выпустил)
const ISSUER = `${config.supabase.url}/auth/v1`;

// Middleware аутентификации для WebSocket-соединений
export default async function socketAuthenticate(socket, next) {
  // Токен передаётся клиентом в поле auth при подключении
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("Токен не предоставлен"));
  }

  try {
    // Верифицируем токен: проверяем подпись, issuer и audience
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: "authenticated",
    });

    // Сохраняем данные пользователя в сокете для дальнейшего использования
    socket.data.user = payload;
    next();
  } catch (err) {
    return next(new Error("Недействительный или истёкший токен"));
  }
}
