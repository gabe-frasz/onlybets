import { prisma } from "@/libs";
import { authenticate } from "@/plugins";
import axios from "axios";
import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function authRoutes(fastify: FastifyInstance) {
  // * Get user data
  fastify.get("/me", { onRequest: [authenticate] }, async (req, res) => {
    return { user: req.user };
  });

  // * Login or Create user
  fastify.post("/users", async (req, res) => {
    const createUserSchema = z.object({
      provider: z.enum(["github", "google"]),
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      avatarUrl: z.string().nullable(),
    });

    const parsedBody = createUserSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).send({
        error: "Invalid request body",
      });
    }
    const { provider, id, email, name, avatarUrl } = parsedBody.data;

    let user = await prisma.user.findUnique({
      where: { githubId: id },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { googleId: id },
      });
    }

    if (!user) {
      switch (provider) {
        case "github":
          user = await prisma.user.create({
            data: {
              githubId: id,
              email,
              name,
              avatarUrl,
            },
          });

          break;

        case "google":
          user = await prisma.user.create({
            data: {
              googleId: id,
              email,
              name,
              avatarUrl,
            },
          });

          break;
      }
    }

    const token = fastify.jwt.sign(
      { name: user.name, avatarUrl: user.avatarUrl },
      { sub: user.id, expiresIn: "7 days" }
    );

    return { token };
  });

  // * Handle user authentication
  fastify.get("/auth/callback/:provider", async (req, res) => {
    const { provider } = req.params as { provider: "google" | "github" };

    const { access_token } = (
      await fastify[provider].getAccessTokenFromAuthorizationCodeFlow(req)
    ).token;

    let providerOAuthUrl: string;
    switch (provider) {
      case "github":
        providerOAuthUrl = "https://api.github.com/user";
        break;

      case "google":
        providerOAuthUrl = "https://www.googleapis.com/oauth2/v2/userinfo";
        break;

      default:
        return res.status(400).send({ error: "Invalid provider" });
    }

    const { data: userInfo } = await axios.get(providerOAuthUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const githubUserInfoSchema = z.object({
      id: z.number(),
      email: z.string().email(),
      name: z.string(),
      avatar_url: z.string().url().nullish(),
    });
    const googleUserInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().url().nullish(),
    });
    const userLoginResponseSchema = z.object({
      token: z.string(),
    });

    let response;

    if (provider === "github") {
      const parsedUserInfo = githubUserInfoSchema.safeParse(userInfo);
      if (!parsedUserInfo.success) {
        return res.send(500).send({ error: "Error fetching user data" });
      }
      const { id, email, name, avatar_url } = parsedUserInfo.data;

      response = (
        await axios.post("http://localhost:5000/users", {
          provider,
          id: String(id),
          email,
          name,
          avatarUrl: avatar_url ?? null,
        })
      ).data;
    }

    if (provider === "google") {
      const parsedUserInfo = googleUserInfoSchema.safeParse(userInfo);
      if (!parsedUserInfo.success)
        return res.send(500).send({ error: "Error fetching user data" });
      const { id, email, name, picture } = parsedUserInfo.data;

      response = (
        await axios.post("http://localhost:5000/users", {
          provider,
          id,
          email,
          name,
          avatarUrl: picture ?? null,
        })
      ).data;
    }

    const parsedData = userLoginResponseSchema.safeParse(response);
    if (!parsedData.success) {
      return res.status(500).send({ error: "Internal server error" });
    }
    const { token } = parsedData.data;

    return { token };
  });
}
