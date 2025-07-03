import { execSync } from "child_process";
import { readdirSync } from "fs";

console.log("🗂 File structure at build time:");
console.log(execSync("find . -type f").toString());
