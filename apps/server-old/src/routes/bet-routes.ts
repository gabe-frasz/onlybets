import { prisma } from "@/libs";
import { authenticate } from "@/plugins";
import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function betRoutes(fastify: FastifyInstance) {
  // * Get bets count
  fastify.get("/bets/count", async (req, res) => {
    const count = await prisma.bet.count();
    return { count };
  });

  // * Create a bet for a specific match and raffle
  fastify.post(
    "/raffles/:raffleId/matches/:matchId/bets",
    { onRequest: [authenticate] },
    async (req, res) => {
      const createBetParamsSchema = z.object({
        raffleId: z.string(),
        matchId: z.string(),
      });

      const createBetBodySchema = z.object({
        firstTeamGoals: z.number().min(0),
        secondTeamGoals: z.number().min(0),
      });

      const { raffleId, matchId } = createBetParamsSchema.parse(req.params);
      const { firstTeamGoals, secondTeamGoals } = createBetBodySchema.parse(
        req.body
      );

      const participant = await prisma.participant.findUnique({
        where: {
          userId_raffleId: {
            userId: req.user.sub,
            raffleId,
          },
        },
      });

      if (!participant) {
        return res
          .status(403)
          .send({ message: "You are not a participant of this raffle" });
      }

      const bet = await prisma.bet.findUnique({
        where: {
          participantId_matchId: {
            participantId: participant.id,
            matchId,
          },
        },
      });

      if (bet)
        return res
          .status(409)
          .send({ message: "You already placed a bet on this game" });

      const match = await prisma.match.findUnique({
        where: {
          id: matchId,
        },
      });

      if (!match) return res.status(404).send({ message: "Match not found" });

      if (match.date < new Date())
        return res
          .status(403)
          .send({ message: "You can not place a bet after the match date" });

      await prisma.bet.create({
        data: {
          matchId,
          participantId: participant.id,
          firstTeamGoals,
          secondTeamGoals,
        },
      });

      return res.status(201).send({ message: "Bet created" });
    }
  );
}
