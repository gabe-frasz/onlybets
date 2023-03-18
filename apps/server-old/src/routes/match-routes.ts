import { prisma } from "@/libs";
import { authenticate } from "@/plugins";
import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function matchRoutes(fastify: FastifyInstance) {
  // * Get all matches from a specific raffle
  fastify.get(
    "/raffles/:id/matches",
    { onRequest: [authenticate] },
    async (req, res) => {
      const getRaffleParamsSchema = z.object({
        id: z.string(),
      });

      const { id } = getRaffleParamsSchema.parse(req.params);

      const matches = await prisma.match.findMany({
        include: {
          bets: {
            where: {
              participant: {
                userId: req.user.sub,
                raffleId: id,
              },
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      return {
        matches: matches.map((match) => ({
          ...match,
          bet: match.bets.length > 0 ? match.bets[0] : null,
          bets: undefined,
        })),
      };
    }
  );
}
