import { fdir } from "fdir";
import { watch } from "chokidar";
import { getExtFromPath, DocBaseFSLayerParams } from "core";
import { exists, stat, readFile } from "fs-extra";

export const fsLayerParams: DocBaseFSLayerParams = {
  scan: (params): AsyncIterable<string> => {
    const { dir, exts } = params;
    const fd = new fdir().withBasePath();
    const outs = fd
      .filter((path) => {
        const ext = getExtFromPath(path);
        return exts.includes(ext);
      })
      .crawl(dir)
      .withPromise();

    return {
      [Symbol.asyncIterator]: async function* () {
        const result = await outs;
        for (const item of result) {
          yield item;
        }
      },
    };
  },
  watch: (params) => {
    const { path, filter } = params;

    const watcher = watch(path, {
      ignored: (path) => !filter(path),
    });

    return {
      onUpsert: (callback) => {
        watcher.on("add", callback);
        watcher.on("change", callback);
      },
      onRemove: (callback) => {
        watcher.on("unlink", callback);
      },
      unwatch: (path) => {
        watcher.unwatch(path);
      },
    };
  },
  exists: exists,
  stat: stat,
  read: (path: string) => readFile(path, "utf-8"),
};
