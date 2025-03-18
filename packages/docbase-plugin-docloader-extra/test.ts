const distModule = await import("./dist")

const loader = await distModule.default.init()
console.log(
    await loader("./package.json")
)

export { }