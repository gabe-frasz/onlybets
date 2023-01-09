import { generateShortId, prisma } from "@/libs";
import { authenticate } from "@/plugins";
import { FastifyInstance } from "fastify";
import { z } from "zod";

export async function raffleRoutes(fastify: FastifyInstance) {
  // * Get raffles count
  fastify.get("/raffles/count", async (req, res) => {
    const count = await prisma.raffle.count();

    return { count };
  });

  // * Get all raffles the user is participating in
  fastify.get("/raffles", { onRequest: [authenticate] }, async (req, res) => {
    const raffles = await prisma.raffle.findMany({
      where: {
        participants: {
          some: {
            userId: req.user.sub,
          },
        },
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
        participants: {
          select: {
            id: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { raffles };
  });

  // * Get raffle by ID
  fastify.get(
    "/raffles/:id",
    { onRequest: [authenticate] },
    async (req, res) => {
      const getRaffleParamsSchema = z.object({
        id: z.string(),
      });

      const { id } = getRaffleParamsSchema.parse(req.params);

      const raffle = await prisma.raffle.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              participants: true,
            },
          },
          participants: {
            select: {
              id: true,
              user: {
                select: {
                  avatarUrl: true,
                },
              },
            },
            take: 4,
          },
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return { raffle };
    }
  );

  // * Create a raffle
  fastify.post("/raffles", { onRequest: [authenticate] }, async (req, res) => {
    const createRaffleSchema = z.object({
      title: z.string({ required_error: "Title is required" }),
    });

    const parsedBody = createRaffleSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).send({
        cause: "Invalid Body",
        message: parsedBody.error.format(),
      });
    }

    const { title } = parsedBody.data;
    const code = String(generateShortId()).toUpperCase();
    const ownerId = req.user.sub;

    await prisma.raffle.create({
      data: {
        title,
        code,
        ownerId,

        participants: {
          create: {
            userId: ownerId,
          },
        },
      },
    });

    res.status(201).send();
  });

  // * Join the user into a raffle
  fastify.post(
    "/raffles/join",
    {
      onRequest: [authenticate],
    },
    async (req, res) => {
      const joinRaffleSchema = z.object({
        code: z.string(),
      });

      const parsedBody = joinRaffleSchema.safeParse(req.body);

      if (!parsedBody.success) {
        return res.status(400).send({
          message: "Invalid Body",
        });
      }

      const { code } = parsedBody.data;

      const raffle = await prisma.raffle.findUnique({
        where: { code },
        include: {
          participants: {
            where: {
              userId: req.user.sub,
            },
          },
        },
      });

      if (!raffle) {
        return res.status(404).send({
          message: "Raffle not found",
        });
      }

      if (raffle.participants.length > 0) {
        return res.status(400).send({
          message: "You are already a participant",
        });
      }

      await prisma.participant.create({
        data: {
          userId: req.user.sub,
          raffleId: raffle.id,
        },
      });

      res.status(201).send();
    }
  );
}
