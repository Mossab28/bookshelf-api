import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export async function register(email: string, password: string, name: string) {
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError(409, "Email already registered");

  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hash, name },
    select: { id: true, email: true, name: true, role: true },
  });

  const token = generateToken(user.id, user.role);
  return { user, token };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(401, "Invalid credentials");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError(401, "Invalid credentials");

  const token = generateToken(user.id, user.role);
  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: "7d" });
}
