import { Router } from "express";
import archiver from "archiver";
import fs from "node:fs";

import { catchAsync } from "../../util/catchAsync.js";
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

    // const archiveName = "files.zip";

    // res.set("Content-Type", "application/zip");
    // res.set("Content-Disposition", `attachment; filename=${archiveName}`);
    // const filesPaths = files.map((f) => normalizePath(resolvePath(f.file_path)));
    // const filesPaths

    console.log(files);
    // res.zip(filesPaths, archiveName, (err) => {
    //   if (err) {
    //     console.log("Error sending files", err);
    //   } else {
    //     console.log("Files sent successfully");
    //   }
    // });
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
    // const { fileUUID } = req.params;
    // if (!fileUUID)
    //   return res.sendError("File UUID required", "fileUUID parameter is null", 400, ERROR_CODES.INVALID_INPUT);
    const file = req.resource;
    // const [file] = await req.db.query("SELECT * FROM user_files WHERE file_uuid = ?", [fileUUID]);
    // if (!file) return res.sendError("No Matching File", "File Not Found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
    // console.log(fileUUID);
    // console.log(`Created At: ${new Date(file.created_at).toLocaleTimeString("en-PH")}`);
    const resolvedPath = resolvePath(file.file_path);
    console.log("Serving file from:", resolvedPath);
    // file.path = normalizePath(resolvedPath);
    // res.sendFile(file.path);
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

    // const filesDataObject = files.map((file) => ({
    //   file_uuid: generateUUID(),
    //   user_id: req.user.id,
    //   file_name: file.filename,
    //   original_name: file.originalname,
    //   file_path: normalizePath(file.path),
    //   mime_type: file.mimetype,
    //   file_size: file.size,
    //   category: "gallery",
    // }));
    // const start = Date.now();
    // console.log("Start time: Object", start);
    // for (const file of filesDataObject) {
    //   const insertFile = await req.db.query("INSERT INTO user_files SET ?", [file]);
    //   console.log(insertFile);
    // }
    // const duration = Date.now() - start;
    // console.log("End Time: Object", duration);
    // console.log(files);
    // console.log(filesData);
    // const startTime = Date.now();
    // console.log("Start Time: Array", startTime);

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
    // const endTime = Date.now() - startTime;
    // console.log("End Time: Array", endTime);
    // console.log(insertImages);
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
    // const { fileUUID } = req.params;
    const file = req.resource;
    console.log(file);
    // const { originalName, category, isPublic } = req.body;

    // const updateResult = await req.db.query(
    //   `
    // UPDATE user_files SET ? WHERE file_uuid = ?`,
    //   [{ original_name: originalName, category, isPublic }, fileUUID],
    // );

    // if (updateResult.affectedRows === 0) return res.sendError("Failed to update file data");

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
    // const { fileUUIDs } = req.body;
    // const rows = await req.db.query("SELECT * FROM user_files WHERE file_uuid IN (?)", [fileUUIDs]);
    // console.log(rows);
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
