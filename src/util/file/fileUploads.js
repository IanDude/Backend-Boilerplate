import { upload } from "./upload.js";
import { fileIntegrityMiddleware } from "./fileIntegrity.js";
import { compressImage } from "./image-compress.js";

const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

const ALLOWED_DOCS_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
};

export const imageUpload = (options = {}) => {
  const {
    field = "image",
    multiple = false,
    maxCount = 5,
    maxFileSize = 5 * 1024 * 1024,
    compressionProfile = "profile",
    filePath = (req) => `uploads/${req.user.name}`,
    allowedTypes = ALLOWED_IMAGE_TYPES,
  } = options;

  const multerMiddleware = multiple
    ? upload({ filePath, fileTypes: ["images"], maxFileSize }).array(field, maxCount)
    : upload({ filePath, fileTypes: ["images"], maxFileSize }).single(field);

  return [multerMiddleware, fileIntegrityMiddleware({ allowedTypes, maxFileSize }), compressImage(compressionProfile)];
};

export const docsUpload = (options = {}) => {
  const {
    field = "file",
    multiple = false,
    maxFileSize = 5 * 1024 * 1024,
    maxCount = 3,
    compressionProfile = "general",
    filePath = (req) => `uploads/${req.user.name}/documents`,
    allowedTypes = ALLOWED_DOCS_TYPES,
  } = options;

  const multerMiddleware = multiple
    ? upload({ filePath, fileTypes: ["documents"], maxFileSize }).array(field, maxCount)
    : upload({ filePath, fileTypes: ["documents"], maxFileSize }).single(field);

  return [multerMiddleware, fileIntegrityMiddleware({ allowedTypes, maxFileSize })];
};
