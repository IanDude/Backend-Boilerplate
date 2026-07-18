import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function normalizePath(rawPath) {
  return rawPath.replace(/\\/g, "/");
}

export function resolvePath(filePath) {
  return path.join(__dirname, "../../../", filePath);
}

export function getFileExtension(fileString) {
  return path.extname(fileString).toLowerCase();
}
