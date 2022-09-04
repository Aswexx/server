/*
  Warnings:

  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "password";

-- CreateTable
CREATE TABLE "login_info" (
    "id" CHAR(36) NOT NULL,
    "login_email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "login_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_info_login_email_key" ON "login_info"("login_email");

-- CreateIndex
CREATE UNIQUE INDEX "login_info_password_key" ON "login_info"("password");
