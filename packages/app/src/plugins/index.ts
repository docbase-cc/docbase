import { homedir } from "os"
import { join } from "path";
import { ensureDir } from "fs-extra"
import { PackageManager } from "./pkgManager"

// 初始化插件目录
const baseDir = join(homedir(), ".docbase")
const pluginsDir = join(baseDir, "plugins")
await ensureDir(pluginsDir)

export const pkgManager = new PackageManager(pluginsDir)
