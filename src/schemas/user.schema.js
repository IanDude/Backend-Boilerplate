import { z } from "zod";

export const methodByIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const newUserSchema = z.object({
  name: z.string(),
  email: z.email(),
  password: z.string().min(6),
});
