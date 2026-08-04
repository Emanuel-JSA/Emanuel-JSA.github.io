// Modal arrastável no estilo de .login de views/aline.js.
// Visual: borda 1px var(--yellow), background var(--bg), monospace uppercase
// com text-shadow, titlebar amarela igual à .login-top-bar.
// Posicionamento: `position: fixed` com left/top em pixels. Na criação,
// centraliza calculando o centro do viewport. Drag ajusta left/top.
// Drag via Pointer Events (mouse + touch unificados).

let zCounter = 1000;

export function createModal({ title, body }) {
  const root = document.createElement("div");
  root.className = "modal";
  root.dataset.app = title;
  root.style.touchAction = "none";

  const titlebar = document.createElement("div");
  titlebar.className = "modal-titlebar";
  titlebar.style.touchAction = "none";

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

  const z = ++zCounter;
  root.style.zIndex = String(z);

  // Centraliza via pixels (não transform) para evitar ambiguidade no drag
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = root.offsetWidth || 280;
  const h = root.offsetHeight || 200;
  root.style.position = "fixed";
  root.style.left = `${(vw - w) / 2}px`;
  root.style.top = `${(vh - h) / 2}px`;
  root.style.right = "auto";
  root.style.bottom = "auto";
  root.style.transform = "none";

  let closed = false;
  let pointerId = null;
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  function onMove(e) {
    if (e.pointerId !== pointerId || !dragging || closed) return;
    root.style.left = `${e.clientX - offsetX}px`;
    root.style.top = `${e.clientY - offsetY}px`;
  }
  function onUp(e) {
    if (e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    titlebar.style.cursor = "grab";
  }
  function onTitleDown(e) {
    if (closed) return;
    if (e.button !== undefined && e.button !== 0) return;
    const r = root.getBoundingClientRect();
    offsetX = e.clientX - r.left;
    offsetY = e.clientY - r.top;
    pointerId = e.pointerId;
    dragging = true;
    titlebar.style.cursor = "grabbing";
    try {
      titlebar.setPointerCapture(pointerId);
    } catch {}
    e.preventDefault();
  }

  titlebar.addEventListener("pointerdown", onTitleDown);
  closeBtn.addEventListener("click", close);
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
  document.addEventListener("pointercancel", onUp);

  function close() {
    if (closed) return;
    closed = true;
    titlebar.removeEventListener("pointerdown", onTitleDown);
    closeBtn.removeEventListener("click", close);
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    document.removeEventListener("pointercancel", onUp);
    if (root.parentNode) root.parentNode.removeChild(root);
  }

  return { el: root, close };
}
