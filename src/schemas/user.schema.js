import { z } from "zod";

export const UserUUIDParamSchema = z.object({
  userUUID: z.string(),
});

export const newUserSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  password: z.string().min(6),
});

export const updateUserSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
});