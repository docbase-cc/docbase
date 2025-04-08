import { defineCommand, runMain } from "citty";
import { version } from "~/package.json";

const main = defineCommand({
  meta: {
    name: "DocBase",
    version: version,
    description: "docbase cli tool",
  },
  args: {
    name: {
      type: "positional",
      description: "Your name",
      required: true,
    },
    friendly: {
      type: "boolean",
      description: "Use friendly greeting",
    },
  },
  run({ args }) {
    console.log(`${args.friendly ? "Hi" : "Greetings"} ${args.name}!`);
  },
});

runMain(main);
