import { mountDivider } from "../ui/divider.js";

export async function render({ slug }) {
    const res = await fetch(`/content/posts/${slug}.html`);
    if (!res.ok) {
        return `<div class="post-page"><p style="color:#fff;font-family:monospace">Post não encontrado.</p></div>`;
    }
    const content = await res.text();
    return `
        <div class="post-page">
            <a class="back-link" href="/">← voltar</a>
            <pre id="divider" class="divider"></pre>
            ${content}
        </div>
    `;
}

export async function mount(el, { slug }) {
    const h1 = el.querySelector("h1");
    document.title = h1 ? `${h1.textContent.trim()} — sky` : "sky";

    const divider = el.querySelector("#divider");
    if (divider) return mountDivider(divider);
    return null;
}
