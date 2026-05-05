import { z } from "zod";

export const fileUUIDParamSchema = z.object({
  fileUUID: z.string(),
});

export const multipleDownloadSchema = z.object({
  fileUUIDs: z.string().array(),
});
