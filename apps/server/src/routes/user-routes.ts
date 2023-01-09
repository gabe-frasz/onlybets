import { prisma } from "@/libs";
import { FastifyInstance } from "fastify";

export async function userRoutes(fastify: FastifyInstance) {
  // * Get users count
  fastify.get("/users/count", async (req, res) => {
    const count = await prisma.user.count();
    return { count };
  });
}
