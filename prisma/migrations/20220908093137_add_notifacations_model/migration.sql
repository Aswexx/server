-- CreateEnum
CREATE TYPE "NotifType" AS ENUM ('follow', 'likePost', 'replyPost', 'likeComment', 'replyComment', 'inviteChat');

-- CreateTable
CREATE TABLE "Notification" (
    "id" CHAR(36) NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "notifType" "NotifType" NOT NULL,
    "informer_id" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_informer_id_fkey" FOREIGN KEY ("informer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
