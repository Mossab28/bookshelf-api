import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export async function listRooms(filters?: { capacity?: number; floor?: number }) {
  return prisma.room.findMany({
    where: {
      isActive: true,
      ...(filters?.capacity && { capacity: { gte: filters.capacity } }),
      ...(filters?.floor !== undefined && { floor: filters.floor }),
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { bookings: true } } },
  });
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      bookings: {
        where: { status: "CONFIRMED", endTime: { gte: new Date() } },
        orderBy: { startTime: "asc" },
        take: 10,
        select: { id: true, title: true, startTime: true, endTime: true, userId: true },
      },
    },
  });
  if (!room) throw new AppError(404, "Room not found");
  return room;
}

export async function createRoom(
  data: { name: string; description?: string; capacity: number; floor?: number; amenities?: string[] },
  userId: string,
) {
  return prisma.room.create({
    data: { ...data, floor: data.floor ?? 0, amenities: data.amenities ?? [], createdById: userId },
  });
}

export async function updateRoom(id: string, data: Partial<{ name: string; description: string; capacity: number; floor: number; amenities: string[]; isActive: boolean }>) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new AppError(404, "Room not found");

  return prisma.room.update({ where: { id }, data });
}

export async function deleteRoom(id: string) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new AppError(404, "Room not found");

  // Soft delete — mark as inactive
  return prisma.room.update({ where: { id }, data: { isActive: false } });
}
