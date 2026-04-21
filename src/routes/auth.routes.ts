import { Router, Request, Response, NextFunction } from "express";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import * as authService from "../services/auth.service";

const router = Router();

router.post("/register", validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.register(req.body.email, req.body.password, req.body.name);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/login", validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
