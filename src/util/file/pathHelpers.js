import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function normalizePath(rawPath) {
  return rawPath.replace(/\\/g, "/").replace(/^public\//, "");
}

export function resolvePath(filePath) {
  const resolvedPath = path.join(__dirname, "../../../public", filePath);
  return resolvedPath;
}
