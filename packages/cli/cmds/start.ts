import { fileURLToPath } from "url";
import { defineCommand } from "citty";
import { dirname, join } from "path";
import { exists } from "fs-extra";

export default defineCommand({
  meta: {
    name: "start",
    description: "start a docbase instance",
  },
  async run() {
    const dn = dirname(fileURLToPath(import.meta.url));
    let main = join(dn, "../main/main.js");
    const mainex = await exists(main);

    if (mainex) {
    } else {
      main = "app/src/main";
    }

    await import(main);
  },
});
