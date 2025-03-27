import { copy, readFile, writeFile } from "fs-extra";
import path from "path";
import { name, version } from "~/package.json";

// 获取项目根目录和dist目录路径
const rootDir = path.resolve(__dirname, "../../dist");

await copy(".", rootDir);

// 修改package.json
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
// 修改name和version
packageJson.name = name;
packageJson.version = version;

delete packageJson.scripts;
delete packageJson.devDependencies;
delete packageJson.tsup;
delete packageJson.exports["./src"];

// 写入文件
await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
