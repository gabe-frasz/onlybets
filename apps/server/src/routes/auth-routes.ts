import { prisma } from "@/libs";
import { authenticate } from "@/plugins";
import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function authRoutes(fastify: FastifyInstance) {
  // * Get user data
  fastify.get("/me", { onRequest: [authenticate] }, async (req, res) => {
    return { user: req.user };
  });

  // * Log/Sign user in
  fastify.post("/users", async (req, res) => {
    const createUserSchema = z.object({
      access_token: z.string(),
    });

    const parsedBody = createUserSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).send({
        error: "Invalid request body",
      });
    }

    const { access_token } = parsedBody.data;

    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    const userData = await userResponse.json();

    const userInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().url(),
    });

    const parsedUserData = userInfoSchema.safeParse(userData);

    if (!parsedUserData.success) {
      return res.status(400).send({ error: "Invalid user data" });
    }

    const userInfo = parsedUserData.data;

    let user = await prisma.user.findUnique({
      where: { googleId: userInfo.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          avatarUrl: userInfo.picture,
        },
      });
    }

    const token = fastify.jwt.sign(
      { name: user.name, avatarUrl: user.avatarUrl },
      { sub: user.id, expiresIn: "7 days" }
    );

    return { token };
  });
}
