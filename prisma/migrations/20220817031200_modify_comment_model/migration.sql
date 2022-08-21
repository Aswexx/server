-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_image_url_fkey";

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "image_url" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_image_url_fkey" FOREIGN KEY ("image_url") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
