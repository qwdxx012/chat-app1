import { createRemoteJWKSet, jwtVerify } from "jose";
import config from "../config.js";

// Публичные ключи Supabase для верификации JWT
const JWKS = createRemoteJWKSet(
  new URL(`${config.supabase.url}/auth/v1/.well-known/jwks.json`)
);
const ISSUER = `${config.supabase.url}/auth/v1`;

// Middleware аутентификации для REST API — проверяет Bearer-токен в заголовке
export default async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Токен не предоставлен" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: "authenticated",
    });
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Недействительный или истёкший токен" });
  }
}
