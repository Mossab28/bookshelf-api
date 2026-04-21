import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export async function createBooking(data: {
  title: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  userId: string;
}) {
  if (data.startTime >= data.endTime) {
    throw new AppError(400, "Start time must be before end time");
  }

  if (data.startTime < new Date()) {
    throw new AppError(400, "Cannot book in the past");
  }

  // Check for overlapping bookings on the same room
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId: data.roomId,
      status: "CONFIRMED",
      startTime: { lt: data.endTime },
      endTime: { gt: data.startTime },
    },
  });

  if (conflict) {
    throw new AppError(
      409,
      `Room is already booked from ${conflict.startTime.toISOString()} to ${conflict.endTime.toISOString()}`,
    );
  }

  // Verify room exists and is active
  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room || !room.isActive) {
    throw new AppError(404, "Room not found or inactive");
  }

  return prisma.booking.create({
    data: {
      title: data.title,
      roomId: data.roomId,
      userId: data.userId,
      startTime: data.startTime,
      endTime: data.endTime,
      notes: data.notes,
    },
    include: { room: { select: { name: true } } },
  });
}

export async function listBookings(filters: {
  userId?: string;
  roomId?: string;
  from?: Date;
  to?: Date;
}) {
  return prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      ...(filters.userId && { userId: filters.userId }),
      ...(filters.roomId && { roomId: filters.roomId }),
      ...(filters.from && { startTime: { gte: filters.from } }),
      ...(filters.to && { endTime: { lte: filters.to } }),
    },
    orderBy: { startTime: "asc" },
    include: {
      room: { select: { id: true, name: true, floor: true } },
      user: { select: { id: true, name: true } },
    },
  });
}

export async function getBookingById(id: string) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      room: { select: { id: true, name: true, capacity: true, floor: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!booking) throw new AppError(404, "Booking not found");
  return booking;
}

export async function cancelBooking(id: string, userId: string, isAdmin: boolean) {
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) throw new AppError(404, "Booking not found");

  if (booking.userId !== userId && !isAdmin) {
    throw new AppError(403, "You can only cancel your own bookings");
  }

  if (booking.status === "CANCELLED") {
    throw new AppError(400, "Booking is already cancelled");
  }

  return prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

export async function getRoomAvailability(roomId: string, date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: "CONFIRMED",
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    orderBy: { startTime: "asc" },
    select: { startTime: true, endTime: true, title: true },
  });

  return { date: dayStart.toISOString().split("T")[0], roomId, bookings };
}
