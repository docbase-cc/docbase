import { join } from 'path'
import { readdir } from 'fs/promises'
// 获取 packages 目录下的所有包
const getPackages = async () => {
  const packagesDir = join(process.cwd(), 'packages')
  const packages = await readdir(packagesDir)
  return packages.map(pkg => join(packagesDir, pkg))
}

// 并行运行所有包的 dev 命令
const runDevCommands = async () => {
  const packages = await getPackages()
  console.log(packages)
  const processes = packages.map(pkg => {
    return Bun.spawn(['bun', 'run', '--bun', 'dev'], {
      cwd: pkg,
      stdio: ['inherit', 'inherit', 'inherit']
    })
  })
  
  // 等待所有进程完成
  await Promise.all(processes.map(p => p.exited))
}

// 执行并行命令
await runDevCommands()
