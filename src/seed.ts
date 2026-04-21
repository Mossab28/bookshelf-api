import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bookshelf.dev" },
    update: {},
    create: {
      email: "admin@bookshelf.dev",
      password: adminPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  // Create demo user
  const userPassword = await bcrypt.hash("user123456", 12);
  const user = await prisma.user.upsert({
    where: { email: "user@bookshelf.dev" },
    update: {},
    create: {
      email: "user@bookshelf.dev",
      password: userPassword,
      name: "Demo User",
      role: "USER",
    },
  });

  // Create rooms
  const rooms = await Promise.all([
    prisma.room.create({
      data: { name: "Salle Turing", capacity: 8, floor: 1, amenities: ["projector", "whiteboard"], createdById: admin.id },
    }),
    prisma.room.create({
      data: { name: "Salle Lovelace", capacity: 4, floor: 1, amenities: ["screen", "webcam"], createdById: admin.id },
    }),
    prisma.room.create({
      data: { name: "Salle Dijkstra", capacity: 20, floor: 2, amenities: ["projector", "whiteboard", "microphone"], createdById: admin.id },
    }),
    prisma.room.create({
      data: { name: "Salle Knuth", capacity: 6, floor: 0, amenities: ["whiteboard"], createdById: admin.id },
    }),
  ]);

  // Create a booking
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(11, 30, 0, 0);

  await prisma.booking.create({
    data: {
      title: "Sprint planning",
      roomId: rooms[0].id,
      userId: user.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
    },
  });

  console.log("Seed complete: 1 admin, 1 user, 4 rooms, 1 booking");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
