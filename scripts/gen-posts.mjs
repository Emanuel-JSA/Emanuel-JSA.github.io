#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";

const postsDir = "content/posts";
const outFile = "content/posts.js";

const slugs = readdirSync(postsDir).filter((entry) =>
    statSync(join(postsDir, entry)).isDirectory(),
);

const posts = slugs
    .map((slug) => {
        const html = readFileSync(join(postsDir, slug, "index.html"), "utf8");

        const titleMatch = html.match(/<h1[^>]*class="post-title"[^>]*>([^<]+)<\/h1>/);
        if (!titleMatch) {
            console.error(`Aviso: nenhum <h1 class="post-title"> em ${slug}/index.html`);
            return null;
        }

        const dateMatch = html.match(/<meta\s+name="post-date"\s+content="([^"]+)"/);
        if (!dateMatch) {
            console.error(`Aviso: nenhum <meta name="post-date"> em ${slug}/index.html`);
            return null;
        }

        return { slug, title: titleMatch[1].trim(), date: dateMatch[1] };
    })
    .filter(Boolean)
    .sort((a, b) => b.date.localeCompare(a.date));

const lines = posts.map(
    (p) => `  { slug: ${JSON.stringify(p.slug)}, title: ${JSON.stringify(p.title)}, date: ${JSON.stringify(p.date)} },`,
);

writeFileSync(
    outFile,
    `// gerado por scripts/gen-posts.mjs — não edite manualmente\nexport default [\n${lines.join("\n")}\n];\n`,
    "utf8",
);

console.log(`${outFile} atualizado (${posts.length} post(s)).`);
