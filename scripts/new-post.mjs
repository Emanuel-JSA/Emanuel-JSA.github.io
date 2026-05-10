#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "fs";

const slug = process.argv[2];
const title = process.argv[3] || slug;

if (!slug) {
    console.error("Uso: node scripts/new-post.mjs <slug> \"<Título>\"");
    process.exit(1);
}

const contentPath = `content/posts/${slug}.html`;
if (existsSync(contentPath)) {
    console.error(`Já existe: ${contentPath}`);
    process.exit(1);
}

const date = new Date().toISOString().split("T")[0];

writeFileSync(
    contentPath,
    `<article>\n    <h1 class="post-title">${title}</h1>\n    <p class="post-body">Em breve.</p>\n</article>\n`,
    "utf8",
);

const indexPath = "content/posts/index.json";
const index = JSON.parse(readFileSync(indexPath, "utf8"));
index.unshift({ slug, title, date });
writeFileSync(indexPath, JSON.stringify(index, null, 4) + "\n", "utf8");

console.log(`Post criado: ${contentPath}`);
console.log(`index.json atualizado.`);
