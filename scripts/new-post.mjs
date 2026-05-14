#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { execSync } from "child_process";

const slug = process.argv[2];
const title = process.argv[3] || slug;

if (!slug) {
    console.error("Uso: node scripts/new-post.mjs <slug> \"<Título>\"");
    process.exit(1);
}

const postDir = `content/posts/${slug}`;
if (existsSync(postDir)) {
    console.error(`Já existe: ${postDir}`);
    process.exit(1);
}

const date = new Date().toISOString().split("T")[0];

mkdirSync(postDir, { recursive: true });

writeFileSync(
    `${postDir}/index.html`,
    `<meta name="post-date" content="${date}">\n<article>\n    <h1 class="post-title">${title}</h1>\n    <p class="post-body">Em breve.</p>\n</article>\n`,
    "utf8",
);

execSync("node scripts/gen-posts.mjs", { stdio: "inherit" });

console.log(`Post criado: ${postDir}/index.html`);
