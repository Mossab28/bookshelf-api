import * as path from "path";
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

// BookShelf app — served under /bookshelf
const bookshelfRouter = express.Router();
bookshelfRouter.use(express.static(path.join(__dirname, "..", "public")));
bookshelfRouter.use("/api/auth", authRoutes);
bookshelfRouter.use("/api/rooms", roomRoutes);
bookshelfRouter.use("/api/bookings", bookingRoutes);
bookshelfRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/bookshelf", bookshelfRouter);

// Projects hub at root
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "hub.html"));
});

// Health check global
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`BookShelf API running on port ${env.PORT}`);
});

export default app;
