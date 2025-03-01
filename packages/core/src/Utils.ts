import { lowerCase } from "es-toolkit";
import { extname } from "path";

/** 从路径获取拓展名 */
export const getExtFromPath = (path: string) =>
  lowerCase(extname(path).replace(".", ""));
