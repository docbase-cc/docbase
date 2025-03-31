import path from "path";
import { fileURLToPath } from "url";

export const dirname = () => {
  return path.dirname(fileURLToPath(import.meta.url));
};
