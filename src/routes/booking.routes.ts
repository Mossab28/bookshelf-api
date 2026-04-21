import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createBookingSchema } from "../schemas/booking.schema";
import * as bookingService from "../services/booking.service";

const router = Router();

router.use(authenticate);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookings = await bookingService.listBookings({
      userId: req.query.mine === "true" ? req.user!.userId : undefined,
      roomId: req.query.roomId as string,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
    });
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id as string);
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(createBookingSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.createBooking({
      ...req.body,
      userId: req.user!.userId,
    });
    res.status(201).json(booking);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/cancel", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id as string,
      req.user!.userId,
      req.user!.role === "ADMIN",
    );
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

router.get("/room/:roomId/availability", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const date = req.query.date ? new Date(req.query.date as string) : new Date();
    const availability = await bookingService.getRoomAvailability(req.params.roomId as string, date);
    res.json(availability);
  } catch (err) {
    next(err);
  }
});

export default router;
