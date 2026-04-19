import { Router } from "express";
// import { upload } from "../../util/file/upload.js";
// import { fileIntegrityMiddleware } from "../../util/file/fileIntegrity.js";
// import { compressImage } from "../../util/file/image-compress.js";
import { catchAsync } from "../../util/catchAsync.js";
import { docsUpload, imageUpload } from "../../util/file/fileUploads.js";

const router = Router();

router.post(
  "/profile",
  imageUpload({ field: "avatar", filePath: (req) => `uploads/${req.user.name}/avatar` }),
  catchAsync(async (req, res) => {
    res.sendSuccess("Image Uploaded", req.file);
  }),
);

router.post(
  "/gallery",
  imageUpload({ field: "images", filePath: (req) => `uploads/${req.user.name}/gallery`, multiple: true }),
  catchAsync(async (req, res) => {
    res.sendSuccess("Images uploaded successfully", req.files);
  }),
);

// router.post(
//   "/docs",
//   docsUpload({ field: "file" }),
//   catchAsync(async (req, res) => {
//     res.sendSuccess("Files uploaded successfully", req?.file || req?.files || null);
//   }),
// );

export default router;
