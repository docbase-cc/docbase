import { lowerCase } from "es-toolkit";
import { extname } from "path";

/** 从路径获取拓展名 */
export const getExtFromPath = (path: string) =>
  lowerCase(extname(path).replace(".", ""));

/** 转换路径分隔符 */
export const slash = (path: string) => {
  const isExtendedLengthPath = path.startsWith('\\\\?\\');

  if (isExtendedLengthPath) {
    return path;
  }

  let result = '';
  for (let i = 0; i < path.length; i++) {
    if (path[i] === '\\') {
      result += '/';
      // 跳过连续的反斜杠
      while (i + 1 < path.length && path[i + 1] === '\\') {
        i++;
      }
    } else {
      result += path[i];
    }
  }
  return result;
}
