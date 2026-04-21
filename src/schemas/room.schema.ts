import { z } from "zod";

export const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  capacity: z.number().int().min(1).max(500),
  floor: z.number().int().optional(),
  amenities: z.array(z.string()).optional(),
});

export const updateRoomSchema = createRoomSchema.partial().extend({
  isActive: z.boolean().optional(),
});
