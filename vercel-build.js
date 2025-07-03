const { execSync } = require("child_process");

console.log("🗂 File structure at build time:");

const output = execSync(
  `find . -type f \\( -path "./node_modules/*" -o -path "./.git/*" -o -path "./.vercel/*" \\) -prune -false -o -print`
);

console.log(output.toString());
