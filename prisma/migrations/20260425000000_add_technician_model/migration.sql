-- CreateTable
CREATE TABLE "Technician" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "initiales" TEXT NOT NULL,
    "couleur" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- DropForeignKey
ALTER TABLE "Ticket" DROP CONSTRAINT "Ticket_technicienId_fkey";

-- Clear existing technicienId values (they referenced User, which is now invalid)
UPDATE "Ticket" SET "technicienId" = NULL;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;
