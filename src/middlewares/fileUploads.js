import { upload, FILE_TYPE_CONFIGS } from "../util/file/upload.js";
import { fileIntegrityMiddleware } from "../util/file/fileIntegrity.js";
import { compressImage } from "../util/file/image-compress.js";

const UPLOAD_TYPE_CONFIGS = {
  images: {
    uploadType: "images",
    field: { single: "image", multiple: "images" },
    fileType: "image",
    maxFileSize: 5 * 1024 * 1024,
    maxCount: 5,
    allowedTypes: FILE_TYPE_CONFIGS.images,
    compress: true,
  },
  documents: {
    uploadType: "documents",
    field: { single: "document", multiple: "documents" },
    fileType: "document",
    maxFileSize: 10 * 1024 * 1024,
    maxCount: 3,
    allowedTypes: FILE_TYPE_CONFIGS.documents,
    compress: false,
  },
  audios: {
    uploadType: "audios",
    field: { single: "audio", multiple: "audios" },
    fileType: "audio",
    maxFileSize: 10 * 1024 * 1024,
    maxCount: 3,
    allowedTypes: FILE_TYPE_CONFIGS.audios,
    compress: false,
  },
  videos: {
    uploadType: "videos",
    field: { single: "video", multiple: "videos" },
    fileType: "video",
    maxFileSize: 50 * 1024 * 1024,
    maxCount: 3,
    allowedTypes: FILE_TYPE_CONFIGS.videos,
    compress: false,
  },
};

function fileUpload(type, options = {}) {
  const config = UPLOAD_TYPE_CONFIGS[type];
  if (!config) throw new Error(`Unknown upload type: ${type}`);

  const {
    multiple = false,
    field = multiple ? config.field.multiple : config.field.single,
    fileType = config.fileType,
    uploadType = config.uploadType,
    category = null,
    maxFileSize = config.maxFileSize,
    maxCount = config.maxCount,
    compressionProfile = "general",
    allowedTypes = config.allowedTypes,
  } = options;

  const filePath = (req) => `uploads/${req.user.user_uuid}/${fileType}${category ? `/${category}` : ""}`;

  const multerMiddleware = multiple
    ? upload({ filePath, fileTypes: [config.uploadType], maxFileSize, maxCount }).array(field, maxCount)
    : upload({ filePath, fileTypes: [config.uploadType], maxFileSize }).single(field);

  const integrityMiddleware = fileIntegrityMiddleware({ allowedTypes, maxFileSize });
  const compressMiddleware = config.compress ? compressImage(compressionProfile) : null;

  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) return next(err);
      integrityMiddleware(req, res, (err) => {
        if (err) return next(err);
        req.upload = {
          scan: req.file ? req.fileScanResult : req.fileScanResults,
          fileType,
          category,
        };
        if (!compressMiddleware) return next();
        compressMiddleware(req, res, (err) => {
          if (err) return next(err);
          if (res.headersSent) return;
          next();
        });
      });
    });
  };
}

export default fileUpload;
