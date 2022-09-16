/*
  Warnings:

  - A unique constraint covering the columns `[notif_id]` on the table `comments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[target_post_id]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[target_comment_id]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[notif_id]` on the table `posts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `target_comment_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_post_id` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "NotifType" ADD VALUE 'mention';

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "notif_id" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "target_comment_id" TEXT NOT NULL,
ADD COLUMN     "target_post_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "notif_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "comments_notif_id_key" ON "comments"("notif_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_target_post_id_key" ON "notifications"("target_post_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_target_comment_id_key" ON "notifications"("target_comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "posts_notif_id_key" ON "posts"("notif_id");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_notif_id_fkey" FOREIGN KEY ("notif_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_notif_id_fkey" FOREIGN KEY ("notif_id") REFERENCES "notifications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
