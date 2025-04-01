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

    const watcher = watch(path, { ignoreInitial: true });

    const hook = (callback: (path: string) => void) => (p: string) => {
      if (filter(p)) callback(p);
    };

    return {
      onUpsert: (callback) => {
        watcher.on("add", hook(callback));
        watcher.on("change", hook(callback));
      },
      onRemove: (callback) => {
        watcher.on("unlink", hook(callback));
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
