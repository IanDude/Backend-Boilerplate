import archiver from "archiver";
import fs from "node:fs";

import APIError, { ERROR_CODES } from "../util/APIError.js";
import generateUUID from "../util/generateUUID.js";
import * as fileRepository from "../repository/fileRepository.js";
import { getFileExtension, normalizePath, resolvePath } from "../util/file/fileHelpers.js";
import { unlinkMultiple, unlinkSingle } from "../util/file/unlink.js";

export async function getAllFiles(db) {
  const files = await fileRepository.getAll(db);

  if (!files) throw new APIError("No files found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);

  return files;
}

export async function uploadFile({ db, userId, upload, files }) {
  const { fileType, category, scan } = upload;
  const fileList = Array.isArray(files) ? files : [files];
  const scanList = Array.isArray(scan) ? scan : [scan];

  if (!fileList[0]) throw new APIError("No file uploaded", 400, ERROR_CODES.VALIDATION_FAILED);

  const savedFileData = [];
  try {
    for (let i = 0; i < fileList.length; i++) {
      const fileData = await saveOne({ file: fileList[i], userId, fileType, category, scanResult: scanList[i], db });
      savedFileData.push(fileData);
    }
    return savedFileData.length === 1 ? savedFileData[1] : savedFileData;
  } catch (error) {
    await unlinkMultiple(fileList.map((f) => ({ path: resolvePath(normalizePath(f.path)) })));
    throw error;
  }
}

async function saveOne({ file, userId, fileType, category, scanResult, db }) {
  const fileData = {
    file_uuid: generateUUID(),
    user_id: userId,
    file_name: file.filename,
    original_name: file.originalname,
    file_path: normalizePath(file.path),
    mime_type: file.mimetype,
    file_size: file.size,
    file_type: fileType,
    category,
    // extension: getFileExtension(file.originalname),
    file_hash: scanResult?.fileHash ?? null,
  };
  try {
    const result = await fileRepository.saveFileData(fileData, db);
    if (result.affectedRows === 0) throw new APIError("Failed to save file data", 400, ERROR_CODES.DATABASE_ERROR);
    return fileData;
  } catch (error) {
    await unlinkSingle(resolvePath(fileData.file_path)).catch(() => {});
    throw error;
  }
}

export async function getFileByUUID(fileUUID, db) {
  const result = await fileRepository.findByUUID(fileUUID, db);

  if (!result) throw new APIError("No file found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
  return result;
}

export async function getFilesByUUID(fileUUIDs, db) {
  const files = await fileRepository.getFiles(fileUUIDs, db);
  if (files.length === 0) throw new APIError("No files found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);

  return files;
}

export async function updateFile(file, { originalName, category, isPublic }, db) {
  const updates = {
    original_name: originalName ?? file.original_name,
    category: category ?? file.category,
    is_public: isPublic ?? file.is_public,
  };

  const result = await fileRepository.updateData(file.file_id, updates, db);
  if (result.affectedRows === 0) throw new APIError("Failed to update file", 400, ERROR_CODES.DATABASE_ERROR);
}

export async function deleteFile(file, db) {
  const result = await fileRepository.deleteData(file.file_id, db);

  if (result.affectedRows === 0) throw new APIError("Failed to delete file data", 400, ERROR_CODES.DATABASE_ERROR);

  const isFileDeleted = await unlinkSingle(file);
  if (!isFileDeleted) throw new APIError("Failed to delete file", 500, ERROR_CODES.DATABASE_ERROR);
}

export async function buildZipArchive(files) {
  const zipName = `${Date.now()}_files.zip`;
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  for (const file of files) {
    const resolvedPath = resolvePath(file.file_path);
    const fileName = file.original_name;

    if (fs.existsSync(resolvedPath)) {
      archive.file(resolvedPath, {
        name: fileName,
      });
    }
  }
  return { archive, zipName };
}
