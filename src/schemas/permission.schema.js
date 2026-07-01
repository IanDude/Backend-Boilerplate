import { z } from "zod";

export const permissionUUIDParams = z.object({
  permissionUUID = z.string(),
});

export const permissionBody = z.object({
  permissionName = z.string(),
})