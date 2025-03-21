import { lowerCase } from "es-toolkit";
import { extname } from "path";
import os from "os";

/** 从路径获取拓展名 */
export const getExtFromPath = (path: string) =>
  lowerCase(extname(path).replace(".", ""));

/** windows 标准化路径分隔符 */
export const slash = (path: string) => {
  const isExtendedLengthPath = path.startsWith('\\\\?\\');
  const isNotWindows = os.platform() !== 'win32';

  if (isExtendedLengthPath || isNotWindows) {
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
