import { homedir } from "os";
import { join } from "path";
import { ensureDir } from "fs-extra";
import { PackageManager } from "./pkgManager";
import { DocBase } from "core/src";
import { DB } from "./db";
import { createDocBase } from "./docbase";
import { startWebDAV } from "./webdav";
import { fsLayerParams } from "./fs";
export { PackageManager, DB };

// 初始化插件目录
const baseDir = join(homedir(), ".docbase");
const pluginsDir = join(baseDir, "plugins");
const dataDir = join(baseDir, "data");
const fileDir = join(baseDir, "files");

await ensureDir(pluginsDir);
await ensureDir(dataDir);
await ensureDir(fileDir);

// 启动 webdav
startWebDAV(fileDir);

let pkgManager: PackageManager | undefined;
let db: DB | undefined;
let docbase: DocBase | undefined;

export const getPkgManager = () => {
  if (pkgManager) {
    return pkgManager;
  } else {
    pkgManager = new PackageManager(pluginsDir);
    return pkgManager;
  }
};

export const getDB = async () => {
  if (db) {
    return db;
  } else {
    db = new DB({
      dataDir,
      fileDir,
      pkgManager: getPkgManager(),
    });
    await db.init();
    return db;
  }
};

export const getDocBase = async () => {
  if (docbase) {
    return docbase;
  } else {
    docbase = await createDocBase({ db: await getDB(), fs: fsLayerParams });
    return docbase;
  }
};
