-- Fix Jean-Louis technician name: Boutrin → Boutant
UPDATE "Technician" SET "nom" = 'Boutant' WHERE "nom" = 'Boutrin' AND "prenom" = 'Jean-Louis';
