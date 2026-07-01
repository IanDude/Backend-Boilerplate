import { Router } from "express";
import archiver from "archiver";
import fs from "node:fs";

import catchAsync from "../../util/catchAsync.js";
import { audioUpload, docsUpload, imageUpload, videoUpload } from "../../middlewares/fileUploads.js";
import fileDelete from "../../middlewares/fileDeletes.js";
import { normalizePath, resolvePath } from "../../util/file/pathHelpers.js";
import { ERROR_CODES } from "../../util/APIError.js";
import generateUUID from "../../util/generateUUID.js";
import authorize from "../../middlewares/authorize.js";
import { validateBody, validateParams } from "../../util/validation.js";
import { fileUUIDParamSchema, multipleDownloadSchema } from "../../schemas/file.schema.js";

const router = Router();

//GET /view - View Image
router.get(
  "/view",
  catchAsync(async (req, res) => {
    const { filePath } = req.body;
    // const { filePath } = req.params;
    const resolvedFilePath = resolvePath(filePath);
    console.log(resolvedFilePath);
    res.sendFile(resolvedFilePath);
    // res.sendSuccess("Test");
  }),
);

//GET /files - Get all files as Admin/Moderator
router.get(
  "/",
  authorize({
    resource: "file",
    action: "view_all",
  }),
  catchAsync(async (req, res) => {
    const files = await req.db.query("SELECT * FROM user_files");
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
      const { fileUUID } = req.params;
      const [file] = await req.db.query("SELECT * FROM user_files WHERE file_uuid = ?", [fileUUID]);
      return file;
    },
    ownerField: "user_id",
  }),
  catchAsync(async (req, res) => {
    const file = req.resource;
    const resolvedPath = resolvePath(file.file_path);
    console.log("Serving file from:", resolvedPath);
    res.sendSuccess("File Found!", file);
  }),
);

//POST /image - Upload endpoint for general image uploads
router.post(
  "/",
  authorize({ resource: "file", action: "upload" }),
  imageUpload(),
  catchAsync(async (req, res) => {
    if (!req.file) return res.sendError("No File Uploaded");

    const file = req.file;

    const fileData = {
      file_uuid: generateUUID(),
      user_id: req.user.id,
      file_name: file.filename,
      original_name: file.originalname,
      file_path: normalizePath(file.path),
      mime_type: file.mimetype,
      file_size: file.size,
      category: "profile",
    };

    const insertRow = await req.db.query(`INSERT INTO user_files SET ?`, fileData);

    if (insertRow.affectedRows === 0) return res.sendError("Failed to insert file data");

    res.sendSuccess("Image Uploaded Successfully", fileData);
  }),
);

//POST /profile - Upload endpoint for single profile uploads
router.post(
  "/profile",
  authorize({ resource: "file", action: "upload" }),
  imageUpload({
    field: "profile",
    compressionProfile: "profile",
  }),
  catchAsync(async (req, res) => {
    if (!req.file) return res.sendError("No FIle Uploaded");
    const file = req.file;

    const fileData = {
      file_uuid: generateUUID(),
      user_id: req.user.id,
      file_name: file.filename,
      original_name: file.originalname,
      file_path: normalizePath(file.path),
      mime_type: file.mimetype,
      file_size: file.size,
      category: "profile",
    };

    const insertFileData = await req.db.query("INSERT INTO user_files SET ?", fileData);

    if (insertFileData.affectedRows === 0) return res.sendError("Failed to save file data");

    res.sendSuccess("Upload Success", fileData);
  }),
);

//POST /gallery - upload endpoint for multiple image uploads
router.post(
  "/gallery",
  authorize({ resource: "file", action: "upload" }),
  imageUpload({ multiple: true }),
  catchAsync(async (req, res) => {
    if (!req.files) return res.sendError("No Files Uploaded");

    const files = req.files;
    const filesData = files.map((file) => [
      generateUUID(),
      req.user.id,
      file.filename,
      file.originalname,
      normalizePath(file.path),
      file.mimetype,
      file.size,
      "gallery",
    ]);
    const insertImages = await req.db.query(
      `INSERT INTO user_files (
        file_uuid,
        user_id,
        file_name,
        original_name,
        file_path,
        mime_type,
        file_size,
        category
      ) VALUES ? `,
      [filesData],
    );
    if (insertImages.affectedRows === 0) return res.sendError("Failed to Upload Images");
    res.sendSuccess("Images Uploaded Successfully", filesData);
  }),
);

//POST /document - upload endpoint for document uploads
router.post(
  "/document",
  authorize({ resource: "file", action: "upload" }),
  docsUpload(),
  catchAsync(async (req, res) => {
    res.sendSuccess("File uploaded successfully", req.file);
  }),
);

//POST /documents upload endpoint for multiple documents
router.post(
  "/documents",
  authorize({ resource: "file", action: "upload" }),
  docsUpload({ multiple: true }),
  catchAsync(async (req, res) => {
    res.sendSuccess("Files uploaded successfully", req.files);
  }),
);

//POST /audio - upload endpoint for single audio upload
router.post(
  "/audio",
  authorize({ resource: "file", action: "upload" }),
  audioUpload(),
  catchAsync(async (req, res) => {
    const audio = req.file;

    res.sendSuccess("Audio successfully uploaded", audio);
  }),
);

//POSt /audios - upload endpoint for multiple audio uploads
router.post(
  "/audios",
  authorize({ resource: "file", action: "upload" }),
  audioUpload({ multiple: true }),
  catchAsync(async (req, res) => {
    const audios = req.files;

    res.sendSuccess("Audio Files uploaded successfully", audios);
  }),
);

//POST /video - upload endpoint for single video upload
router.post(
  "/video",
  authorize({ resource: "file", action: "upload" }),
  videoUpload(),
  catchAsync(async (req, res) => {
    const video = req.file;
    res.sendSuccess("Video uploaded successfully", video);
  }),
);

//POST /videos - upload endpoint for multiple video uploads
router.post(
  "/videos",
  authorize({ resource: "file", action: "upload" }),
  videoUpload({ multiple: true }),
  catchAsync(async (req, res) => {
    const videos = req.files;

    res.sendSuccess("Video Files uploaded successfully", videos);
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
      const { fileUUID } = req.params;
      const [row] = await req.db.query("SELECT * FROM user_files WHERE file_uuid = ?", [fileUUID]);
      return row;
    },
    ownerField: "user_id",
  }),
  catchAsync(async (req, res) => {
    const file = req.resource;
    res.sendSuccess("File data updated successfully");
  }),
);

//DELETE /:fileUUID - Delete one specific file
router.delete(
  "/:fileUUID",
  validateParams(fileUUIDParamSchema),
  authorize({ resource: "file", action: "delete" }),
  fileDelete(),
  catchAsync(async (req, res) => {
    const { fileUUID } = req.params;
    const row = await req.db.query("UPDATE user_files SET deleted_at = NOW() WHERE file_uuid = ?", [fileUUID]);
    console.log(row);
    if (row.affectedRows === 0) return res.sendError("Failed to delete image");
    res.sendSuccess("Images Deleted Successfully");
  }),
);

//DELETE - Delete multiple files

//POST - Download uploaded single file as zip
router.post(
  "/download/:fileUUID",
  validateParams(fileUUIDParamSchema),
  authorize({
    resource: "file",
    action: "download",
    getResource: async (req) => {
      const { fileUUID } = req.params;
      const [file] = await req.db.query("SELECT * FROM user_files WHERE file_uuid = ?", [fileUUID]);
      return file;
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
      const { fileUUIDs } = req.body;
      const files = await req.db.query("SELECT * FROM user_files WHERE file_uuid IN (?)", [fileUUIDs]);
      console.log(files);
      return files;
    },
    ownerField: "user_id",
  }),
  catchAsync(async (req, res) => {
    const files = req.resource;
    const zipName = `${Date.now()}_files.zip`;
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      throw err;
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename=${zipName}`);

    archive.pipe(res);

    for (const file of files) {
      const resolvedPath = resolvePath(file.file_path);
      const fileName = file.original_name;
      if (fs.existsSync(resolvedPath)) {
        archive.file(resolvedPath, {
          name: fileName,
        });
      }
    }

    await archive.finalize();
  }),
);

export default router;
