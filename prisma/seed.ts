import { PrismaClient, Role, Statut } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Démarrage du seed...");

  // Clear existing data
  await prisma.photo.deleteMany();
  await prisma.historique.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.rendezVous.deleteMany();
  await prisma.session.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Admin2024!", 12);
  const clientPasswordHash = await bcrypt.hash("Client2024!", 12);

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: "zingzag10@hotmail.fr",
      nom: "Administrateur",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const tech1 = await prisma.user.create({
    data: {
      email: "jean.technicien@hauts-californie.fr",
      nom: "Jean Technicien",
      role: Role.TECHNICIEN,
      passwordHash,
    },
  });

  const tech2 = await prisma.user.create({
    data: {
      email: "marc.technicien@hauts-californie.fr",
      nom: "Marc Technicien",
      role: Role.TECHNICIEN,
      passwordHash,
    },
  });

  console.log("✅ Utilisateurs créés");

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        email: "marie.dupont@email.com",
        nom: "Dupont",
        prenom: "Marie",
        telephone: "+596 696 12 34 56",
        passwordHash: clientPasswordHash,
      },
    }),
    prisma.client.create({
      data: {
        email: "jean-paul.martin@email.com",
        nom: "Martin",
        prenom: "Jean-Paul",
        telephone: "+596 696 23 45 67",
        passwordHash: clientPasswordHash,
      },
    }),
    prisma.client.create({
      data: {
        email: "claudette.joseph@email.com",
        nom: "Joseph",
        prenom: "Claudette",
        telephone: "+596 696 34 56 78",
        passwordHash: clientPasswordHash,
      },
    }),
    prisma.client.create({
      data: {
        email: "patrick.saint-louis@email.com",
        nom: "Saint-Louis",
        prenom: "Patrick",
        telephone: "+596 696 45 67 89",
        passwordHash: clientPasswordHash,
      },
    }),
    prisma.client.create({
      data: {
        email: "nadege.lollivier@email.com",
        nom: "Lollivier",
        prenom: "Nadège",
        telephone: "+596 696 56 78 90",
        passwordHash: clientPasswordHash,
      },
    }),
  ]);

  console.log("✅ Clients créés");

  // Helper to generate ticket number
  const year = new Date().getFullYear().toString().slice(-2);
  let counter = 1;
  const nextNumero = () => `DS${year}${String(counter++).padStart(4, "0")}`;

  // Create tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      numero: nextNumero(),
      clientId: clients[0].id,
      materiel: "Tondeuse",
      marque: "Honda",
      modele: "HRX476",
      numeroSerie: "MZBB-6130001",
      panneDeclaree: "La tondeuse ne démarre plus, moteur cale au démarrage",
      statut: Statut.EN_REPARATION,
      technicienId: tech1.id,
      notesPubliques: "Diagnostic en cours, pièces commandées",
      notesPrivees: "Carburateur encrassé, commande filtre à air référence 17210-Z0Z-010",
      dateEstimee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.historique.createMany({
    data: [
      { ticketId: ticket1.id, statut: Statut.RECU, note: "Appareil réceptionné", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket1.id, statut: Statut.DIAGNOSTIC, note: "Diagnostic effectué: carburateur défectueux", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket1.id, statut: Statut.ATTENTE_PIECES, note: "Pièces commandées auprès du fournisseur", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket1.id, statut: Statut.EN_REPARATION, note: "Pièces reçues, réparation en cours", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    ],
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      numero: nextNumero(),
      clientId: clients[1].id,
      materiel: "Débroussailleuse",
      marque: "Stihl",
      modele: "FS 55",
      panneDeclaree: "Fil de coupe ne sort plus automatiquement",
      statut: Statut.PRET,
      technicienId: tech2.id,
      notesPubliques: "Réparation terminée, appareil prêt à être récupéré",
      dateEstimee: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.historique.createMany({
    data: [
      { ticketId: ticket2.id, statut: Statut.RECU, note: "Appareil réceptionné", createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket2.id, statut: Statut.DIAGNOSTIC, note: "Tête de fil cassée", createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket2.id, statut: Statut.EN_REPARATION, note: "Remplacement tête de fil", createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket2.id, statut: Statut.PRET, note: "Réparation terminée, testée et fonctionnelle", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      numero: nextNumero(),
      clientId: clients[2].id,
      materiel: "Tronçonneuse",
      marque: "Husqvarna",
      modele: "135",
      numeroSerie: "20190300063",
      panneDeclaree: "Chaîne se décroche constamment",
      statut: Statut.RECU,
      notesPubliques: "Appareil reçu, diagnostic en attente",
    },
  });

  await prisma.historique.create({
    data: { ticketId: ticket3.id, statut: Statut.RECU, note: "Appareil réceptionné" },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      numero: nextNumero(),
      clientId: clients[3].id,
      materiel: "Souffleur",
      marque: "Echo",
      modele: "PB-500T",
      panneDeclaree: "Moteur surchauffe et s'arrête après 5 minutes",
      statut: Statut.DIAGNOSTIC,
      technicienId: tech1.id,
      notesPrivees: "Probable problème de refroidissement, vérifier filtre à air",
    },
  });

  await prisma.historique.createMany({
    data: [
      { ticketId: ticket4.id, statut: Statut.RECU, note: "Appareil réceptionné", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket4.id, statut: Statut.DIAGNOSTIC, note: "En cours de diagnostic", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    ],
  });

  const ticket5 = await prisma.ticket.create({
    data: {
      numero: nextNumero(),
      clientId: clients[4].id,
      materiel: "Tondeuse robot",
      marque: "Husqvarna",
      modele: "Automower 305",
      numeroSerie: "ARB123456",
      panneDeclaree: "Ne charge plus, reste bloqué en dehors de la station",
      statut: Statut.LIVRE,
      technicienId: tech2.id,
      notesPubliques: "Réparation terminée et livré au client",
      dateEstimee: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.historique.createMany({
    data: [
      { ticketId: ticket5.id, statut: Statut.RECU, note: "Appareil réceptionné", createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket5.id, statut: Statut.DIAGNOSTIC, note: "Module de charge défectueux", createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket5.id, statut: Statut.ATTENTE_PIECES, note: "Module commandé", createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket5.id, statut: Statut.EN_REPARATION, note: "Remplacement module de charge", createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket5.id, statut: Statut.PRET, note: "Testée et fonctionnelle", createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket5.id, statut: Statut.LIVRE, note: "Livré au client", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
  });

  const ticket6 = await prisma.ticket.create({
    data: {
      numero: nextNumero(),
      clientId: clients[0].id,
      materiel: "Motoculteur",
      marque: "Honda",
      modele: "FJ500",
      panneDeclaree: "Fraises ne tournent plus, embrayage patine",
      statut: Statut.ATTENTE_PIECES,
      technicienId: tech1.id,
      notesPubliques: "Pièces en cours de commande",
      notesPrivees: "Disque embrayage référence 22500-VH7-003",
      dateEstimee: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.historique.createMany({
    data: [
      { ticketId: ticket6.id, statut: Statut.RECU, note: "Appareil réceptionné", createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket6.id, statut: Statut.DIAGNOSTIC, note: "Disque d'embrayage usé", createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
      { ticketId: ticket6.id, statut: Statut.ATTENTE_PIECES, note: "Commande passée, délai 7 jours", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ],
  });

  console.log("✅ Tickets créés");

  // Create appointments — times expressed in Martinique local (UTC-4)
  // Using ISO offset -04:00 so the DB stores the correct UTC value regardless of server TZ
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Martinique" });
  const tomorrowDate = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = tomorrowDate.toLocaleDateString("en-CA", { timeZone: "America/Martinique" });

  await prisma.rendezVous.createMany({
    data: [
      {
        clientId: clients[2].id,
        dateHeure: new Date(`${todayStr}T08:00:00-04:00`),
        duree: 30,
        type: "depot",
        statut: "confirme",
        notes: "Dépôt tronçonneuse pour réparation",
      },
      {
        clientId: clients[1].id,
        dateHeure: new Date(`${todayStr}T10:00:00-04:00`),
        duree: 30,
        type: "retrait",
        statut: "confirme",
        notes: "Retrait débroussailleuse réparée",
      },
      {
        clientId: clients[3].id,
        dateHeure: new Date(`${tomorrowStr}T09:00:00-04:00`),
        duree: 30,
        type: "diagnostic",
        statut: "confirme",
        notes: "Diagnostic souffleur",
      },
    ],
  });

  console.log("✅ Rendez-vous créés");
  console.log("🎉 Seed terminé avec succès!");
  console.log("\nComptes créés:");
  console.log(`  Admin: zingzag10@hotmail.fr / Admin2024!`);
  console.log(`  Tech 1: jean.technicien@hauts-californie.fr / Admin2024!`);
  console.log(`  Tech 2: marc.technicien@hauts-californie.fr / Admin2024!`);
  console.log(`  Client 1: marie.dupont@email.com / Client2024!`);
  console.log(`  Client 2: jean-paul.martin@email.com / Client2024!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
