import fs, { readJSON } from "fs-extra";
import path from "path";
import { Spinner } from "@topcli/spinner";
import { select } from "@inquirer/prompts";
import { defineCommand } from "citty";
import { getFileList } from "./download";
import { cwd } from "process";

const repo = "docbase-cc/plugin-template";

export default defineCommand({
  meta: {
    name: "init",
    description: "init a docbase plugin",
  },
  async run() {
    const spinner = new Spinner();
    const type = await select({
      choices: [
        { name: "📁 DocLoader", value: "docloader" },
        { name: "🔪 DocSplitter", value: "docsplitter" },
      ],
      message: "🧩 Which plugin Type?",
    });

    spinner.start("🗃️  Download DocBase Plugin Template...");

    // 获取项目根目录
    const base = cwd();
    const remoteFiles = await getFileList(repo, base);

    // 替换特有配置
    const packageJsonPath = path.join(base, `${type}.package.json`);
    const basePackageJsonPath = path.join(base, `package.json`);
    const packageJson = await fs.readJson(packageJsonPath);
    const basePackageJson = await readJSON(basePackageJsonPath);

    for (const key of Object.keys(packageJson)) {
      if (packageJson[key]) {
        basePackageJson[key] = packageJson[key];
      } else {
        delete basePackageJson[key];
      }
    }

    await fs.writeJSON(basePackageJsonPath, basePackageJson, { spaces: 2 });

    // 删除模板 package.json 文件
    const deletePakageJsonTasks = remoteFiles
      .filter((file) => file.endsWith(".package.json"))
      .map(async (file) => {
        const filePath = path.join(base, file);
        await fs.remove(filePath);
      });

    // index 文件同理
    const indexTsPath = path.join(base, `src/${type}.index.ts`);

    await fs.move(indexTsPath, path.join(base, `src/index.ts`), {
      overwrite: true,
    });

    const srcPath = path.join(base, `src`);
    // 删除模板 index 文件
    const deleteIndexTsTasks = (await fs.readdir(srcPath))
      .filter((file) => file.endsWith(".index.ts"))
      .map(async (file) => {
        const filePath = path.join(srcPath, file);
        await fs.remove(filePath);
      });

    await Promise.all([...deletePakageJsonTasks, ...deleteIndexTsTasks]);

    spinner.succeed("Succeed");
  },
});
