import {
  authRoutes,
  betRoutes,
  matchRoutes,
  raffleRoutes,
  userRoutes,
} from "@/routes";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import Fastify from "fastify";

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, { origin: process.env.APP_ORIGIN_URL });
  await fastify.register(jwt, { secret: process.env.JWT_SECRET! });

  await fastify.register(authRoutes);
  await fastify.register(raffleRoutes);
  await fastify.register(matchRoutes);
  await fastify.register(betRoutes);
  await fastify.register(userRoutes);

  await fastify.listen({ port: 5000 });
}

bootstrap();
