import { join } from "path";
import { readdir } from "fs/promises";
import chalk from "chalk";

// 获取 packages 目录下的所有包
const getPackages = async () => {
  const packagesDir = join(process.cwd(), "packages");
  const packages = await readdir(packagesDir);
  return packages.map((pkg) => join(packagesDir, pkg));
};

// 并行运行所有包的 dev 命令
const runDevCommands = async () => {
  const packages = await getPackages();
  // 获取每个包的名称
  const packageNames = packages.map((pkg) => pkg.split("/").pop());

  // 为每个包分配不同的颜色
  const colors = ["cyan", "magenta", "yellow", "green", "blue", "red"];

  const processes = packages.map((pkg, index) => {
    const pkgName = packageNames[index];
    const color = colors[index % colors.length];

    // 创建带有彩色前缀的输出处理函数
    const prefixOutput = (data: string) => {
      if (
        !data.includes(
          "is not in the project directory and will not be watched"
        ) &&
        !data.includes('Script not found "dev"')
      ) {
        process.stdout.write(chalk[color](`${pkgName} › `) + data);
      }
    };

    const proc = Bun.spawn(["bun", "run", "--bun", "dev"], {
      cwd: pkg,
      stdio: ["inherit", "pipe", "pipe"],
    });

    // 添加输出前缀
    if (proc.stdout)
      proc.stdout.pipeTo(
        new WritableStream({
          write(chunk) {
            prefixOutput(new TextDecoder().decode(chunk));
          },
        })
      );
    if (proc.stderr)
      proc.stderr.pipeTo(
        new WritableStream({
          write(chunk) {
            prefixOutput(new TextDecoder().decode(chunk));
          },
        })
      );

    return proc;
  });

  // 等待所有进程完成
  await Promise.all(processes.map((p) => p.exited));
};

// 执行并行命令
await runDevCommands();
