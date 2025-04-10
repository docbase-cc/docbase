import { homedir } from "os";
import { join } from "path";
import { ensureDir } from "fs-extra";
import { PackageManager } from "./pkgManager";
import { DocBase } from "core";
import { DB } from "./db";
import { createDocBase } from "./docbase";
import { WebDAV } from "./webdav";
import { fsLayerParams } from "./fs";
import { env } from "process";
export { PackageManager, DB };

// 初始化插件目录
const baseDir = env.DATA_DIR ?? join(homedir(), ".docbase");
const pluginsDir = join(baseDir, "plugins");
const dataDir = join(baseDir, "data");
const fileDir = join(baseDir, "files");

await ensureDir(pluginsDir);
await ensureDir(dataDir);
await ensureDir(fileDir);

export const webdav = new WebDAV(fileDir);

// 启动 webdav
webdav.startWebDAV();

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
