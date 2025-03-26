// @ts-ignore
const distModule = await import("./dist");

const loader = await distModule.default.init();
console.info(await loader("./package.json"));

export {};
