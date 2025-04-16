import { join } from "path";
import { ensureDir, exists } from "fs-extra";
import { PackageManager } from "./pkgManager";
import { DocBase } from "core";
import { DB } from "./db";
import { createDocBase } from "./docbase";
import { WebDAV } from "./webdav";
import { fsLayerParams } from "./fs";
import { env } from "process";
import { _dirname } from "../utils";
export { PackageManager, DB };

// 初始化插件目录
const baseDir = env.DATA_DIR ?? join(_dirname, ".docbase");
console.log("[baseDir] ", baseDir);
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
    const enginePath = join(_dirname, "query_engine.node");
    if (await exists(enginePath)) {
      console.log("[enginePath] ", enginePath);
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
    }
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
