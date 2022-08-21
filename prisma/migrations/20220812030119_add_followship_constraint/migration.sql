/*
  Warnings:

  - A unique constraint covering the columns `[follower_id,followed_id]` on the table `following_ships` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "following_ships_follower_id_followed_id_key" ON "following_ships"("follower_id", "followed_id");
