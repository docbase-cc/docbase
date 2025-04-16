import { defineCommand, runMain } from "citty";
import { version } from "~/package.json";

const main = defineCommand({
  meta: {
    name: "DocBase",
    version: version,
    description: "docbase cli tool",
  },
  subCommands: {
    init: () => import("./cmds/initPlugin").then((r) => r.default),
  },
});

runMain(main);
