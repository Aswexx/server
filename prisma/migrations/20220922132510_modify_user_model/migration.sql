/*
  Warnings:

  - You are about to drop the column `avatar_url` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `bg_image_url` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `profile_images` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[comment_id,user_id]` on the table `like_comments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[post_id,user_id]` on the table `like_posts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatarUrl]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bgImageUrl]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `avatarUrl` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bgImageUrl` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_post_id_fkey";

-- DropForeignKey
ALTER TABLE "like_comments" DROP CONSTRAINT "like_comments_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_avatar_url_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_bg_image_url_fkey";

-- DropIndex
DROP INDEX "users_avatar_url_key";

-- DropIndex
DROP INDEX "users_bg_image_url_key";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "on_comment_id" TEXT,
ALTER COLUMN "post_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar_url",
DROP COLUMN "bg_image_url",
ADD COLUMN     "avatarUrl" TEXT NOT NULL,
ADD COLUMN     "bgImageUrl" TEXT NOT NULL;

-- DropTable
DROP TABLE "profile_images";

-- CreateIndex
CREATE UNIQUE INDEX "like_comments_comment_id_user_id_key" ON "like_comments"("comment_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "like_posts_post_id_user_id_key" ON "like_posts"("post_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_avatarUrl_key" ON "users"("avatarUrl");

-- CreateIndex
CREATE UNIQUE INDEX "users_bgImageUrl_key" ON "users"("bgImageUrl");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_on_comment_id_fkey" FOREIGN KEY ("on_comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like_comments" ADD CONSTRAINT "like_comments_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
