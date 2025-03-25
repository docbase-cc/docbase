import { removeDependency, addDependency } from "nypm";
import { exists, readJSON } from "fs-extra";
import { join } from "path";
import { DocBasePlugin } from "core/src";

export class PackageManager {
  #path: string;
  #pkgPath: string;
  #modulePath: string;
  constructor(path: string) {
    this.#path = path;
    this.#pkgPath = join(path, "package.json");
    this.#modulePath = join(path, "node_modules");
  }

  import = async (name: string): Promise<DocBasePlugin> => {
    const m = await import(join(this.#modulePath, name));
    if (m.default) {
      return m.default;
    } else {
      return m;
    }
  };

  add = async (name: string) =>
    await addDependency(name, {
      cwd: this.#path,
      packageManager: "bun",
      silent: true,
    });

  list = async (): Promise<{ [key: string]: string }> => {
    const ex = await exists(this.#pkgPath);
    if (ex) {
      return (await readJSON(this.#pkgPath))["dependencies"];
    } else {
      return {};
    }
  };

  del = async (name: string) =>
    await removeDependency(name, {
      cwd: this.#path,
      packageManager: "bun",
      silent: true,
    });
}
