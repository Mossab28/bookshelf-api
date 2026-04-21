import { Router, Request, Response, NextFunction } from "express";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createRoomSchema, updateRoomSchema } from "../schemas/room.schema";
import * as roomService from "../services/room.service";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const capacity = req.query.capacity ? Number(req.query.capacity) : undefined;
    const floor = req.query.floor !== undefined ? Number(req.query.floor) : undefined;
    const rooms = await roomService.listRooms({ capacity, floor });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await roomService.getRoomById(req.params.id as string);
    res.json(room);
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticate, requireAdmin, validate(createRoomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await roomService.createRoom(req.body, req.user!.userId);
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", authenticate, requireAdmin, validate(updateRoomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const room = await roomService.updateRoom(req.params.id as string, req.body);
    res.json(room);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await roomService.deleteRoom(req.params.id as string);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
