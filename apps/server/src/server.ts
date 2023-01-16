import {
  authRoutes,
  betRoutes,
  matchRoutes,
  raffleRoutes,
  userRoutes,
} from "@/routes";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import oauth2 from "@fastify/oauth2";
import Fastify from "fastify";

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  });

  const PORT = (process.env.PORT || 5000) as number;

  await fastify.register(cors, { origin: process.env.APP_ORIGIN_URL });
  await fastify.register(jwt, { secret: process.env.JWT_SECRET! });
  await fastify.register(oauth2, {
    name: "google",
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID!,
        secret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      auth: oauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/auth/login/google",
    callbackUri: "http://localhost:5000/auth/callback/google",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  await fastify.register(oauth2, {
    name: "github",
    credentials: {
      client: {
        id: process.env.GITHUB_CLIENT_ID!,
        secret: process.env.GITHUB_SECRET!,
      },
      auth: oauth2.GITHUB_CONFIGURATION,
    },
    startRedirectPath: "/auth/login/github",
    callbackUri: "http://localhost:5000/auth/callback/github",
    scope: ["read:user", "user:email"],
  });

  await fastify.register(authRoutes);
  await fastify.register(raffleRoutes);
  await fastify.register(matchRoutes);
  await fastify.register(betRoutes);
  await fastify.register(userRoutes);

  await fastify.listen({ port: PORT });
}

bootstrap();
