import { z } from "zod";

export const permissionUUIDParam = z.object({
  permissionUUID: z.string(),
});

export const permissionBody = z.object({
  permissionName: z.string(),
});