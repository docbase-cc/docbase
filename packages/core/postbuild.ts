import fs from "fs";
import path from "path";
import { name, version } from "~/package.json";

// 递归复制目录
const copyDir = (src: string, dest: string) => {
  // 创建目标目录
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // 读取源目录
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // 根据文件类型进行复制
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

// 获取项目根目录和dist目录路径
const rootDir = path.resolve(__dirname, "../../dist");

// 执行复制
copyDir(__dirname, rootDir);

// 修改package.json
const packageJsonPath = path.join(rootDir, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
// 修改name和version
packageJson.name = name;
packageJson.version = version;

delete packageJson.scripts
delete packageJson.devDependencies
delete packageJson.tsup

// 写入文件
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
