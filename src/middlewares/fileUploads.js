import { upload } from "../util/file/upload.js";
import { fileIntegrityMiddleware } from "../util/file/fileIntegrity.js";
import { compressImage } from "../util/file/image-compress.js";

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
  "text/csv": [".csv"],
  "text/plain": [".txt"],
};

const ALLOWED_AUDIO_TYPES = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/wave": [".wav"],
};

const ALLOWED_VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
  "video/webm": [".webm"],
};

export const imageUpload = (options = {}) => {
  const {
    multiple = false,
    field = multiple ? "images" : "image",
    maxCount = 5,
    maxFileSize = 5 * 1024 * 1024,
    compressionProfile = "general",
    filePath = (req) => `uploads/${req.user.user_uuid}/${field}`,
    allowedTypes = ALLOWED_IMAGE_TYPES,
  } = options;

  const multerMiddleware = multiple
    ? upload({ filePath, fileTypes: ["images"], maxFileSize }).array(field, maxCount)
    : upload({ filePath, fileTypes: ["images"], maxFileSize }).single(field);

  const integrityMiddleware = fileIntegrityMiddleware({ allowedTypes, maxFileSize });

  const compressMiddleware = compressImage(compressionProfile);

  return (req, res, next) => {
    console.log("Multer Started >>>");

    multerMiddleware(req, res, (err) => {
      if (err) return next(err);
      console.log("Request File: ", req.file);
      console.log("Request Body: ", req.body);
      // console.log("File MimeType: ", req.file.mimetype || req.files.mimetype);
      // console.log("File/s uploaded: ", req.file || req.files);
      console.log("Multer Done <<<");
      console.log("Integrity Checks Started >>>");
      integrityMiddleware(req, res, (err) => {
        if (err) return next(err);

        console.log("Integrity Checks Done <<<");
        console.log("Compression Initiated >>>");

        compressMiddleware(req, res, (err) => {
          if (err) return next(err);
          if (res.headersSent) return;

          console.log("Compression Done");

          next();
        });
      });
    });
  };

  // return [multerMiddleware, fileIntegrityMiddleware({ allowedTypes, maxFileSize }), compressImage(compressionProfile)];
};

export const docsUpload = (options = {}) => {
  const {
    multiple = false,
    field = multiple ? "files" : "file",
    maxFileSize = 10 * 1024 * 1024,
    maxCount = 3,
    filePath = (req) => `uploads/${req.user.user_uuid}/documents`,
    allowedTypes = ALLOWED_DOCS_TYPES,
  } = options;

  const multerMiddleware = multiple
    ? upload({ filePath, fileTypes: ["documents"], maxFileSize }).array(field, maxCount)
    : upload({ filePath, fileTypes: ["documents"], maxFileSize }).single(field);

  const integrityMiddleware = fileIntegrityMiddleware({ allowedTypes, maxFileSize });

  return (req, res, next) => {
    console.log("Multer Started >>>");

    multerMiddleware(req, res, (err) => {
      if (err) return next(err);
      console.log("Multer Finished <<<");
      console.log("Integrity Checks Started >>>");
      integrityMiddleware(req, res, (err) => {
        if (err) return next(err);

        console.log("Integrity Checks Finished <<<");

        next();
      });
    });
  };

  // return [multerMiddleware, fileIntegrityMiddleware({ allowedTypes, maxFileSize })];
};

export const audioUpload = (options = {}) => {
  const {
    multiple = false,
    field = multiple ? "audios" : "audio",
    maxFileSize = 10 * 1024 * 1024,
    maxCount = 3,
    filePath = (req) => `uploads/${req.user.user_uuid}/audios`,
    allowedTypes = ALLOWED_AUDIO_TYPES,
  } = options;

  const multerMiddleware = multiple
    ? upload({ filePath, fileTypes: ["audio"], maxFileSize }).array(field, maxCount)
    : upload({ filePath, fileTypes: ["audio"], maxFileSize }).single(field);

  const integrityMiddleware = fileIntegrityMiddleware({ allowedTypes, maxFileSize });

  return (req, res, next) => {
    console.log("Multer for audio started >>>");

    multerMiddleware(req, res, (err) => {
      if (err) return next(err);
      console.log("Multer for audio finished <<<");

      console.log("Integrity Checks Started >>>");
      integrityMiddleware(req, res, (err) => {
        if (err) return next(err);
        console.log("Integrity Checks Finished <<<");
        next();
      });
    });
  };

  // return [multerMiddleware, fileIntegrityMiddleware({ allowedTypes, maxFileSize })];
};

export const videoUpload = (options = {}) => {
  const {
    multiple = false,
    field = multiple ? "videos" : "video",
    maxFileSize = 50 * 1024 * 1024,
    maxCount = 3,
    filePath = (req) => `uploads/${req.user.user_uuid}/videos`,
    allowedTypes = ALLOWED_VIDEO_TYPES,
  } = options;

  const multerMiddleware = multiple
    ? upload({ filePath, fileTypes: ["video"], maxFileSize }).array(field, maxCount)
    : upload({ filePath, fileTypes: ["video"], maxFileSize }).single(field);

  const integrityMiddleware = fileIntegrityMiddleware({ allowedTypes, maxFileSize });

  return (req, res, next) => {
    console.log("Multer for videos started >>>");
    multerMiddleware(req, res, (err) => {
      if (err) return next(err);
      console.log("Multer for videos finished <<<");
      console.log("Integrity Checks Started >>>");
      integrityMiddleware(req, res, (err) => {
        if (err) return next(err);
        console.log("Integrity Checks Finished <<<");
        next();
      });
    });
  };

  // return [multerMiddleware, fileIntegrityMiddleware({ allowedTypes, maxFileSize })];
};
