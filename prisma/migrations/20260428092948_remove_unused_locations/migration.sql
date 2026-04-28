/*
  Warnings:

  - You are about to drop the column `end_location` on the `activities` table. All the data in the column will be lost.
  - You are about to drop the column `start_location` on the `activities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "activities" DROP COLUMN "end_location",
DROP COLUMN "start_location";
