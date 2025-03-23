import { homedir } from "os"
import { join } from "path";
import { ensureDir } from "fs-extra"
import { PackageManager } from "./pkgManager"

// 初始化插件目录
const baseDir = join(homedir(), ".docbase")
const pluginsDir = join(baseDir, "plugins")

let pkgManager: PackageManager | undefined

export const getPkgManager = async () => {
    if (pkgManager) { return pkgManager } else {
        await ensureDir(pluginsDir)
        pkgManager = new PackageManager(pluginsDir)
        return pkgManager
    }
}
