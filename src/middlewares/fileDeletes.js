import { unlinkSingle, unlinkMultiple } from "../util/file/unlink.js";
import { resolvePath, normalizePath } from "../util/file/pathHelpers.js";

function fileDelete(options = {}) {
  const { multiple = false } = options;

  return async (req, res, next) => {
    const { fileUUID } = req.params;
    try {
      console.log(fileUUID);

      const [row] = await req.db.query("SELECT * FROM user_files WHERE file_uuid = ?", [fileUUID]);
      if (!row) return res.sendError("No File Found");
      console.log(row);
      const file = row;
      console.log(file);
      const filePath = resolvePath(file.file_path);
      console.log(filePath);
      await unlinkSingle(filePath);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default fileDelete;
