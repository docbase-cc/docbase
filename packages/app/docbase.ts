import { dirname, join } from "path";
import { execPath } from "process";

const entry = join(dirname(execPath), "main.js");
const docbase = await import(entry);
const out = docbase.default ?? docbase;
export default out;
