/*
  Warnings:

  - You are about to drop the `MediaFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_media_url_fkey";

-- DropForeignKey
ALTER TABLE "posts" DROP CONSTRAINT "posts_media_url_fkey";

-- DropTable
DROP TABLE "MediaFile";

-- DropEnum
DROP TYPE "Media";

-- CreateTable
CREATE TABLE "media_file" (
    "id" CHAR(36) NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,

    CONSTRAINT "media_file_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_media_url_fkey" FOREIGN KEY ("media_url") REFERENCES "media_file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_media_url_fkey" FOREIGN KEY ("media_url") REFERENCES "media_file"("id") ON DELETE SET NULL ON UPDATE CASCADE;
