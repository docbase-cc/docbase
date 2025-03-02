export * from "./Plugin";
export * from "./DocBase";

import { version } from "~/package.json";

// 路由版本
export const routeVersion = `v${version.split(".")[0]}`;
