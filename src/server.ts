import path from "path";
import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import roomRoutes from "./routes/room.routes";
import bookingRoutes from "./routes/booking.routes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API docs at root
app.get("/", (_req, res) => {
  res.json({
    name: "BookShelf API",
    version: "1.0.0",
    description: "Room booking management REST API",
    endpoints: {
      auth: {
        "POST /api/auth/register": "Create account (email, password, name)",
        "POST /api/auth/login": "Login (email, password) → JWT token",
      },
      rooms: {
        "GET /api/rooms": "List all rooms (?capacity=&floor=)",
        "GET /api/rooms/:id": "Room details + upcoming bookings",
        "POST /api/rooms": "Create room (admin only)",
        "PATCH /api/rooms/:id": "Update room (admin only)",
        "DELETE /api/rooms/:id": "Soft-delete room (admin only)",
      },
      bookings: {
        "GET /api/bookings": "List bookings (?mine=true&roomId=&from=&to=)",
        "GET /api/bookings/:id": "Booking details",
        "POST /api/bookings": "Create booking (conflict detection)",
        "POST /api/bookings/:id/cancel": "Cancel booking",
        "GET /api/bookings/room/:roomId/availability": "Room availability (?date=)",
      },
    },
    health: "GET /health",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);

// Error handler
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`BookShelf API running on port ${env.PORT}`);
});

export default app;
