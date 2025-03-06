import { copySync } from 'fs-extra'
import { join } from 'path'

// 复制 packages/ui/dist到 dist/main/public
copySync(
  join(process.cwd(), 'packages/ui/dist'),
  join(process.cwd(), 'dist/main/public'),
)

// 复制 packages/app/dist/* 到 dist/main/ 下
copySync(
  join(process.cwd(), 'packages/app/dist'),
  join(process.cwd(), 'dist/main')
)
