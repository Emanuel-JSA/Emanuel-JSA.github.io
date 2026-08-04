// Tagged template literal que produz um DocumentFragment.
// Permite interpolar Nodes (incluindo arrays), strings, null/false/true.
//   const frag = html`<h1>${"A"}</h1>`;    // -> "A"
//   const frag = html`<ul>${items.map(...Node...)}</ul>`;
export function html(strings, ...values) {
  const subs = [];

  const markup = strings.reduce((acc, s, i) => {
    if (i === 0) return s;
    const v = values[i - 1];
    if (v === null || v === undefined || v === false || v === true) {
      return acc + s;
    }
    if (v instanceof Node) {
      subs.push(v);
      return acc + `<!--__h_${subs.length - 1}__-->` + s;
    }
    if (Array.isArray(v)) {
      const tokens = v.map((x) => {
        if (x instanceof Node) {
          subs.push(x);
          return `<!--__h_${subs.length - 1}__-->`;
        }
        if (x === null || x === undefined || x === false || x === true) {
          return "";
        }
        return escapeHtml(String(x));
      });
      return acc + tokens.join("") + s;
    }
    return acc + escapeHtml(String(v)) + s;
  }, "");

  const tpl = document.createElement("template");
  tpl.innerHTML = markup;
  const frag = tpl.content;

  if (subs.length) {
    const walker = document.createTreeWalker(frag, NodeFilter.SHOW_COMMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const m = node.nodeValue.match(/^__h_(\d+)__$/);
      if (!m) continue;
      node.replaceWith(subs[Number(m[1])]);
    }
  }
  return frag;
}

// Tagged template que devolve um <style>. Não escapa o conteúdo (CSS cru).
// O elemento é um Node — pode ser interpolado em html`...${css`...`}...`.
// Limpeza: como o <style> vive dentro de <main id="view">, o router
// substitui tudo na próxima navegação — não vaza.
export function css(strings, ...values) {
  const text = strings.reduce(
    (acc, s, i) => acc + (i === 0 ? "" : String(values[i - 1] ?? "")) + s,
    "",
  );
  const style = document.createElement("style");
  style.textContent = text;
  return style;
}

const ESC_RE = /[&<>"']/g;
const ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
function escapeHtml(s) {
  return s.replace(ESC_RE, (c) => ESC_MAP[c]);
}