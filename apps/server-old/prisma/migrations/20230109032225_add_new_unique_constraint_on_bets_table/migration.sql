/*
  Warnings:

  - A unique constraint covering the columns `[participantId,matchId]` on the table `bets` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "bets_participantId_matchId_key" ON "bets"("participantId", "matchId");
