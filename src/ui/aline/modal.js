// Modal arrastável no estilo de .login de views/aline.js.
// Visual: borda 1px var(--yellow), background var(--bg), monospace uppercase
// com text-shadow, titlebar amarela igual à .login-top-bar.

let zCounter = 1000;

export function createModal({ title, body }) {
  const root = document.createElement("div");
  root.className = "modal";
  root.dataset.app = title;

  const titlebar = document.createElement("div");
  titlebar.className = "modal-titlebar";

  const titleEl = document.createElement("span");
  titleEl.className = "modal-title";
  titleEl.textContent = title;

  const closeBtn = document.createElement("button");
  closeBtn.className = "modal-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "fechar");
  closeBtn.textContent = "x";

  titlebar.append(titleEl, closeBtn);

  const bodyEl = document.createElement("div");
  bodyEl.className = "modal-body";
  if (body instanceof Node) {
    bodyEl.appendChild(body);
  } else if (body != null) {
    bodyEl.textContent = String(body);
  }

  root.append(titlebar, bodyEl);

  // Estado
  let closed = false;
  let dragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let positioned = false;
  const z = ++zCounter;
  root.style.zIndex = String(z);

  // Drag
  function onMove(e) {
    if (!dragging || closed) return;
    root.style.left = `${e.clientX - dragOffsetX}px`;
    root.style.top = `${e.clientY - dragOffsetY}px`;
    root.style.transform = "none";
  }
  function onUp() {
    dragging = false;
    titlebar.style.cursor = "grab";
  }
  function onTitleDown(e) {
    if (closed) return;
    if (e.button !== 0) return;
    const r = root.getBoundingClientRect();
    if (!positioned) {
      // converte de centralizado para absoluto
      root.style.left = `${r.left}px`;
      root.style.top = `${r.top}px`;
      root.style.transform = "none";
      positioned = true;
    }
    dragOffsetX = e.clientX - r.left;
    dragOffsetY = e.clientY - r.top;
    dragging = true;
    titlebar.style.cursor = "grabbing";
    e.preventDefault();
  }

  function onKey(e) {
    if (closed) return;
    if (e.key === "Escape") close();
  }

  titlebar.addEventListener("mousedown", onTitleDown);
  closeBtn.addEventListener("click", close);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
  document.addEventListener("keydown", onKey);

  function close() {
    if (closed) return;
    closed = true;
    titlebar.removeEventListener("mousedown", onTitleDown);
    closeBtn.removeEventListener("click", close);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    document.removeEventListener("keydown", onKey);
    if (root.parentNode) root.parentNode.removeChild(root);
  }

  return { el: root, close };
}
