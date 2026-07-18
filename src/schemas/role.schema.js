import { z } from "zod";

export const roleUUIDParam = z.object({
  roleUUID: z.string(),
});

export const roleBody = z.object({
  roleName: z.string(),
});

export const roleUUIDBody = z.object({
  roleUUID: z.string().uuid(),
});