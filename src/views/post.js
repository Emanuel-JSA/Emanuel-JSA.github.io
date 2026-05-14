import { mountDivider } from "../ui/divider.js";

export async function render({ slug }) {
  const res = await fetch(`/content/posts/${slug}/index.html`);
  if (!res.ok) {
    return `<div class="post-page"><p style="color:#fff;font-family:monospace">Post não encontrado.</p></div>`;
  }
  const content = await res.text();
  return `
        <div class="post-page post-${slug}">
            <a class="back-link" href="/"><==</a>
            <pre id="divider" class="divider"></pre>
            ${content}
        </div>
    `;
}

export async function mount(el, { slug }) {
  const h1 = el.querySelector("h1");
  document.title = h1 ? `${h1.textContent.trim()} — sky` : "sky";

  const cleanups = [];
  const divider = el.querySelector("#divider");
  if (divider) cleanups.push(mountDivider(divider));

  try {
    const mod = await import(`/content/posts/${slug}/index.js`);
    if (typeof mod.mount === "function") {
      cleanups.push(await mod.mount(el));
    }
  } catch (e) {
    const msg = String(e?.message ?? e);
    const isMissing = /Failed to fetch|Cannot find module|404|MIME type/i.test(
      msg,
    );
    if (!isMissing) console.error(`[post:${slug}] erro carregando JS:`, e);
  }

  return () => cleanups.forEach((fn) => typeof fn === "function" && fn());
}
