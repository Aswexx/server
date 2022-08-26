/*
  Warnings:

  - You are about to drop the column `image_url` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `video_url` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the `images` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `videos` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[media_url]` on the table `comments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[media_url]` on the table `posts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "Media" AS ENUM ('mp4', 'jpeg', 'png', 'gif');

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_image_url_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_image_url_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_video_url_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_avatar_url_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_bg_image_url_fkey";

-- DropIndex
DROP INDEX "comments_image_url_key";

-- DropIndex
DROP INDEX "posts_image_url_key";

-- DropIndex
DROP INDEX "posts_video_url_key";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "image_url",
ADD COLUMN     "media_url" TEXT;

-- AlterTable
ALTER TABLE "posts" DROP COLUMN "image_url",
DROP COLUMN "video_url",
ADD COLUMN     "media_url" TEXT;

-- DropTable
DROP TABLE "images";

-- DropTable
DROP TABLE "videos";

-- CreateTable
CREATE TABLE "profile_images" (
    "id" CHAR(36) NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaFile" (
    "id" CHAR(36) NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "Media" NOT NULL,

    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comments_media_url_key" ON "comments"("media_url");

-- CreateIndex
CREATE UNIQUE INDEX "posts_media_url_key" ON "posts"("media_url");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_url_fkey" FOREIGN KEY ("avatar_url") REFERENCES "profile_images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_bg_image_url_fkey" FOREIGN KEY ("bg_image_url") REFERENCES "profile_images"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_media_url_fkey" FOREIGN KEY ("media_url") REFERENCES "MediaFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_media_url_fkey" FOREIGN KEY ("media_url") REFERENCES "MediaFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
