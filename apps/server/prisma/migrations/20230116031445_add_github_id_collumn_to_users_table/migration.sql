/*
  Warnings:

  - A unique constraint covering the columns `[githubId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "githubId" STRING;
ALTER TABLE "users" ALTER COLUMN "googleId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");
