import moment from "moment";
import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import APIError, { ERROR_CODES } from "../APIError.js";
import catchAsync from "../catchAsync.js";
import { getFileExtension } from "./fileHelpers.js";

export const FILE_TYPE_CONFIGS = {
  images: {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "image/svg+xml": [".svg"],
    "image/bmp": [".bmp"],
    "image/tiff": [".tiff", ".tif"],
    "image/heic": [".heic"],
    "image/heif": [".heif"],
  },
  documents: {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    "text/plain": [".txt"],
    "text/csv": [".csv"],
  },
  audios: {
    "audio/mpeg": [".mp3"],
    "audio/wav": [".wav"],
    "audio/wave": [".wav"],
    "audio/ogg": [".ogg"],
    "audio/aac": [".aac"],
  },
  videos: {
    "video/mp4": [".mp4"],
    "video/quicktime": [".mov"],
    "video/x-msvideo": [".avi"],
    "video/webm": [".webm"],
  },
};

// Helper function to get allowed types from config
const getAllowedTypes = (fileTypes) => {
  const result = {};
  fileTypes.forEach((type) => {
    if (FILE_TYPE_CONFIGS[type]) {
      Object.assign(result, FILE_TYPE_CONFIGS[type]);
    }
  });
  return result;
};

// Helper function to validate file
const validateFile = (allowedTypes, mimeType, fileExt) => {
  if (!allowedTypes[mimeType]) {
    return { valid: false, error: `MIME type '${mimeType}' is not allowed` };
  }

  if (!allowedTypes[mimeType].includes(fileExt)) {
    return {
      valid: false,
      error: `Extension '${fileExt}' does not match MIME type '${mimeType}'. Expected: ${allowedTypes[mimeType].join(
        ", ",
      )}`,
    };
  }

  return { valid: true };
};

const storage = (options) =>
  multer.diskStorage({
    destination: (req, _file, cb) => {
      const destPath = path.join("storage", options.filePath(req, _file));
      const isExists = fs.existsSync(destPath);
      if (!isExists) {
        fs.mkdirSync(destPath, { recursive: true });
      }

      cb(null, destPath);
    },
    filename: (_req, file, cb) => {
      const ext = getFileExtension(file.originalname);
      const date = moment().format("YYYYMMDDHHmmss");
      const filename = `${crypto.randomUUID()}${date}${ext}`;

      cb(null, filename);
    },
  });

const formatFileSize = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
};

const wrapMulterMethod =
  (multerInstance, method, options) =>
  (...args) => {
    const middleware = method.apply(multerInstance, args);
    return (req, res, next) => {
      middleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          // console.log("Error inside upload", err);
          const maxSize = options.maxFileSize || 1024 * 1024 * 3;
          const messages = {
            LIMIT_FILE_SIZE: `File too large. Maximum file size is ${formatFileSize(maxSize)}`,
            LIMIT_FILE_COUNT: "Too many files uploaded",
            LIMIT_UNEXPECTED_FILE: `Unexpected file field, or too many files uploaded (max ${options.maxCount ?? "allowed"})`,
          };
          return next(new APIError(messages[err.code] || err.message, 400, ERROR_CODES.VALIDATION_FAILED));
        }
        if (err instanceof APIError) {
          return next(err);
        }
        if (err) return next(err);
        next();
      });
    };
  };

export const upload = (options) => {
  const multerInstance = multer({
    storage: storage(options),
    fileFilter: (_req, file, cb) => {
      const mimeType = file.mimetype;
      const fileExt = getFileExtension(file.originalname);
      // console.log("Incoming file:", file.originalname, file.mimetype);
      // console.log("Incoming file extension:", fileExt);
      // If specific file types are defined, use them
      if (options.fileTypes) {
        const allowedTypes = getAllowedTypes(options.fileTypes);
        const validation = validateFile(allowedTypes, mimeType, fileExt);

        if (validation.valid) {
          cb(null, true);
        } else {
          cb(new APIError(validation.error, 400, ERROR_CODES.VALIDATION_FAILED));
        }
      }
      // If custom allowedTypes object is provided (legacy support)
      else if (options.allowedTypes) {
        const validation = validateFile(options.allowedTypes, mimeType, fileExt);

        if (validation.valid) {
          cb(null, true);
        } else {
          cb(new APIError(validation.error, 400, ERROR_CODES.VALIDATION_FAILED));
        }
      } else {
        cb(new APIError("Invalid file type", 400, ERROR_CODES.VALIDATION_FAILED));
      }
    },
    limits: {
      fileSize: options.maxFileSize || 1024 * 1024 * 3, // Default 3MB, customizable
    },
  });

  return {
    single: wrapMulterMethod(multerInstance, multerInstance.single, options),
    array: wrapMulterMethod(multerInstance, multerInstance.array, options),
    fields: wrapMulterMethod(multerInstance, multerInstance.fields, options),
    none: wrapMulterMethod(multerInstance, multerInstance.none, options),
    any: wrapMulterMethod(multerInstance, multerInstance.any, options),
  };
};
