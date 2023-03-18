import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const userList = [
  {
    email: "johndoe@email.com",
    name: "John Doe",
    googleId: "tomaseugoogleid",
  },
  {
    email: "your.email@mailing.com",
    name: "Your Name",
    googleId: "recebaissoaqui",
  },
  {
    email: "another.email@email.com",
    name: "Another Name",
    googleId: "ahammmgoogleid",
  },
  {
    email: "last.email@example.com",
    name: "Last Name",
    googleId: "tomadnvgoogleid",
  },
];

async function main() {
  const myself = await prisma.user.create({
    data: {
      email: "my.email@example.com",
      name: "My Name",
      avatarUrl: "https://github.com/gabe-frasz.png",
      googleId: "mygoogleid",
    },
  });

  let users = [];

  for (const user of userList) {
    const newUser = await prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        googleId: user.googleId,
      },
    });

    users.push(newUser);
  }

  const raffle1 = await prisma.raffle.create({
    data: {
      title: "First Raffle",
      code: "RFFL1",
      ownerId: myself.id,

      participants: {
        createMany: {
          data: [
            {
              userId: myself.id,
            },
            {
              userId: users[0].id,
            },
            {
              userId: users[1].id,
            },
          ],
        },
      },
    },
  });

  const raffle2 = await prisma.raffle.create({
    data: {
      title: "Second Raffle",
      code: "RFFL2",
      ownerId: users[2].id,

      participants: {
        createMany: {
          data: [
            {
              userId: myself.id,
            },
            {
              userId: users[2].id,
            },
          ],
        },
      },
    },
  });

  const match1 = await prisma.match.create({
    data: {
      date: "2026-06-25T18:00:00.647Z",
      firstTeamCountryCode: "BR",
      secondTeamCountryCode: "IT",
    },
  });

  await prisma.bet.create({
    data: {
      firstTeamGoals: 2,
      secondTeamGoals: 0,
      participant: {
        connect: {
          userId_raffleId: {
            userId: myself.id,
            raffleId: raffle1.id,
          },
        },
      },
      match: {
        create: {
          date: "2026-06-13T12:00:00.647Z",
          firstTeamCountryCode: "BR",
          secondTeamCountryCode: "US",
        },
      },
    },
  });

  await prisma.bet.create({
    data: {
      firstTeamGoals: 1,
      secondTeamGoals: 0,
      participant: {
        connect: {
          userId_raffleId: {
            userId: users[0].id,
            raffleId: raffle1.id,
          },
        },
      },
      match: {
        create: {
          date: "2026-06-17T14:00:00.647Z",
          firstTeamCountryCode: "BR",
          secondTeamCountryCode: "AR",
        },
      },
    },
  });

  await prisma.bet.create({
    data: {
      firstTeamGoals: 4,
      secondTeamGoals: 2,
      participant: {
        connect: {
          userId_raffleId: {
            userId: myself.id,
            raffleId: raffle1.id,
          },
        },
      },
      match: {
        create: {
          date: "2026-06-21T10:00:00.647Z",
          firstTeamCountryCode: "BR",
          secondTeamCountryCode: "DE",
        },
      },
    },
  });

  await prisma.bet.create({
    data: {
      firstTeamGoals: 2,
      secondTeamGoals: 1,
      participant: {
        connect: {
          userId_raffleId: {
            userId: myself.id,
            raffleId: raffle2.id,
          },
        },
      },
      match: {
        connect: {
          id: match1.id,
        },
      },
    },
  });
}

main();
