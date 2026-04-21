import { z } from "zod";

export const createBookingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  roomId: z.string().min(1, "Room ID is required"),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  notes: z.string().max(1000).optional(),
});
