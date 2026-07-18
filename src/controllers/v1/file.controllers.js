import { Router } from "express";
import archiver from "archiver";
import fs from "node:fs";

import catchAsync from "../../util/catchAsync.js";
import fileUpload from "../../middlewares/fileUploads.js";
import * as fileService from "../../services/fileService.js";
import * as fileRepository from "../../repository/fileRepository.js";
import { resolvePath } from "../../util/file/fileHelpers.js";
import authorize from "../../middlewares/authorize.js";
import { validateBody, validateParams } from "../../util/validation.js";
import { fileUUIDParamSchema, multipleDownloadSchema } from "../../schemas/file.schema.js";
import { ERROR_CODES } from "../../util/APIError.js";

const router = Router();

//GET /view - View Image
router.get(
  "/view",
  catchAsync(async (req, res) => {
    const { filePath } = req.body;
    const resolvedFilePath = resolvePath(filePath);
    res.sendFile(resolvedFilePath);
  }),
);

//GET /files - Get all files as Admin/Moderator
router.get(
  "/",
  authorize({
    resource: "file",
    action: "view",
    getResource: async (req) => {
      return await fileService.getAllFiles(req.db);
    },
    ownerField: "user_id",
  }),
  catchAsync(async (req, res) => {
    const files = req.resource;
    res.sendSuccess("Files retrieved successfully", files);
  }),
);

//GET /:fileUUID - Fetch 1 file by uuid
router.get(
  "/:fileUUID",
  validateParams(fileUUIDParamSchema),
  authorize({
    resource: "file",
    action: "view",
    getResource: async (req) => {
      return await fileService.getFileByUUID(req.params.fileUUID, req.db);
    },
    ownerField: "user_id",
  }),
  catchAsync(async (req, res) => {
    const file = req.resource;
    const resolvedPath = resolvePath(file.file_path);
    res.sendFile(resolvedPath);
  }),
);

//POST / - Upload endpoint for general image uploads
router.post(
  "/",
  authorize({ resource: "file", action: "upload" }),
  fileUpload("images"),
  catchAsync(async (req, res) => {
    const { db, user, upload, file, files } = req;
    const result = await fileService.uploadFile({ db, userId: user.id, upload, files: file ?? files });
    res.sendSuccess("Image Uploaded Successfully", result);
  }),
);

//POST /profile - Upload endpoint for single profile uploads
router.post(
  "/profile",
  authorize({ resource: "file", action: "upload" }),
  fileUpload("images", { field: "profile", category: "profile", compressionProfile: "profile" }),
  catchAsync(async (req, res) => {
    const { db, user, upload, file, files } = req;
    const result = await fileService.uploadFile({ db, userId: user.id, upload, files: file ?? files });

    res.sendSuccess("Upload Success", result);
  }),
);

//POST /gallery - upload endpoint for multiple image uploads
router.post(
  "/gallery",
  authorize({ resource: "file", action: "upload" }),
  fileUpload("images", { multiple: true }),
  catchAsync(async (req, res) => {
    const { db, user, upload, file, files } = req;
    const connection = await db.beginTransaction();
    let result;
    try {
      result = await fileService.uploadFile({ db: connection, userId: user.id, upload, files: file ?? files });
    } catch (error) {
      await db.rollback(connection);
      res.sendError("Failed to upload images", error, 400, ERROR_CODES.INVALID_INPUT);
    }
    await db.commit(connection);
    res.sendSuccess("Images Uploaded Successfully", result);
  }),
);

//POST /document - upload endpoint for document uploads
router.post(
  "/document",
  authorize({ resource: "file", action: "upload" }),
  // docsUpload(),
  fileUpload("documents"),
  catchAsync(async (req, res) => {
    const { db, user, upload, file, files } = req;
    const result = await fileService.uploadFile({ db, userId: user.id, upload, files: file ?? files });
    res.sendSuccess("File uploaded successfully", result);
  }),
);

//POST /documents upload endpoint for multiple documents
router.post(
  "/documents",
  authorize({ resource: "file", action: "upload" }),
  // docsUpload({ multiple: true }),
  fileUpload("documents", { multiple: true }),
  catchAsync(async (req, res) => {
    const { db, user, upload, file, files } = req;
    const result = await fileService.uploadFile({ db, userId: user.id, upload, files: file ?? files });
    res.sendSuccess("Files uploaded successfully", result);
  }),
);

//POST /audio - upload endpoint for single audio upload
router.post(
  "/audio",
  authorize({ resource: "file", action: "upload" }),
  // audioUpload(),
  fileUpload("audios"),
  catchAsync(async (req, res) => {
    const { db, user, upload, file, files } = req;
    const result = await fileService.uploadFile({ db, userId: user.id, upload, files: file ?? files });

    res.sendSuccess("Audio successfully uploaded", result);
  }),
);

//POSt /audios - upload endpoint for multiple audio uploads
router.post(
  "/audios",
  authorize({ resource: "file", action: "upload" }),
  // audioUpload({ multiple: true }),
  fileUpload("audios", { multiple: true }),
  catchAsync(async (req, res) => {
    const { db, user, upload, file, files } = req;
    const result = await fileService.uploadFile({ db, userId: user.id, upload, files: file ?? files });
    res.sendSuccess("Audio Files uploaded successfully", result);
  }),
);

//POST /video - upload endpoint for single video upload
router.post(
  "/video",
  authorize({ resource: "file", action: "upload" }),
  fileUpload("videos"),
  // videoUpload(),
  catchAsync(async (req, res) => {
    const { db, user, upload, file, files } = req;
    const result = await fileService.uploadFile({ db, userId: user.id, upload, files: file ?? files });
    res.sendSuccess("Video uploaded successfully", result);
  }),
);

//POST /videos - upload endpoint for multiple video uploads
router.post(
  "/videos",
  authorize({ resource: "file", action: "upload" }),
  // videoUpload({ multiple: true }),
  fileUpload("videos", { multiple: true }),
  catchAsync(async (req, res) => {
    const { db, user, upload, file, files } = req;
    const result = await fileService.uploadFile({ db, userId: user.id, upload, files: file ?? files });
    res.sendSuccess("Video Files uploaded successfully", result);
  }),
);

//PUT - Update file data in database
router.put(
  "/:fileUUID",
  validateParams(fileUUIDParamSchema),
  authorize({
    resource: "file",
    action: "update",
    getResource: async (req) => {
      return await fileService.getFileByUUID(req.params.fileUUID, req.db);
    },
    ownerField: "user_id",
  }),
  catchAsync(async (req, res) => {
    const file = req.resource;
    await fileService.updateFile(file, req.body, req.db);
    res.sendSuccess("File data updated successfully");
  }),
);

//DELETE /:fileUUID - Delete one specific file
router.delete(
  "/:fileUUID",
  validateParams(fileUUIDParamSchema),
  authorize({
    resource: "file",
    action: "delete",
    getResource: async (req) => {
      return await fileService.getFileByUUID(req.params.fileUUID, req.db);
    },
    ownerField: "user_id",
  }),
  catchAsync(async (req, res) => {
    await fileService.deleteFile(req.resource, req.db);
    res.sendSuccess("File Deleted Successfully");
  }),
);

//DELETE - Delete multiple files

//POST - Download uploaded single file as zip
router.get(
  "/download/:fileUUID",
  validateParams(fileUUIDParamSchema),
  authorize({
    resource: "file",
    action: "download",
    getResource: async (req) => {
      return await fileService.getFileByUUID(req.params.fileUUID, req.db);
    },
    ownerField: "user_id",
  }),
  catchAsync(async (req, res) => {
    const file = req.resource;

    const filePath = resolvePath(file.file_path);

    res.download(filePath, file.original_name);
  }),
);

//POST - Download multiple files
router.post(
  "/download",
  validateBody(multipleDownloadSchema),
  authorize({
    resource: "file",
    action: "download",
    getResource: async (req) => {
      return await fileService.getFilesByUUID(req.body.fileUUIDs, req.db);
    },
    ownerField: "user_id",
  }),
  catchAsync(async (req, res) => {
    const { archive, zipName } = await fileService.buildZipArchive(req.resource);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${zipName}`);
    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(res);

    await archive.finalize();
  }),
);

export default router;
