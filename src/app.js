import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import config from "./config.js";
import errorHandler from "./middleware/errorHandler.js";
import authRouter from "./routes/auth.js";
import roomsRouter from "./routes/rooms.js";
import messagesRouter from "./routes/messages.js";
import { swaggerUi, spec } from "../docs/swagger.js";

const app = express();

// Ограничение количества запросов (защита от DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Helmet с настройкой CSP для поддержки Tailwind CDN и Socket.IO
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        scriptSrc: ["'self'", "https://cdn.tailwindcss.com", "http://localhost:3000"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

app.use(cors(config.cors));
app.use(express.json());

// Раздача статических файлов фронтенда из папки public
app.use(express.static("public"));

app.use("/api/auth", limiter, authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/rooms", messagesRouter);

// Swagger UI — документация API доступна по /api/docs
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));

// Глобальный обработчик ошибок
app.use(errorHandler);

export default app;
