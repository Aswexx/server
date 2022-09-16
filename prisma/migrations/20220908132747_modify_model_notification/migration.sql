-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "target_comment_id" DROP NOT NULL,
ALTER COLUMN "target_post_id" DROP NOT NULL;
