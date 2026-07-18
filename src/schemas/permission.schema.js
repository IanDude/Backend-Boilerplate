import { z } from "zod";

export const permissionUUIDParam = z.object({
  permissionUUID: z.string().uuid(),
});

export const permissionBody = z.object({
  permissionName: z.string(),
});