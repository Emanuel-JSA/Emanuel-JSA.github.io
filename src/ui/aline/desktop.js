// Desktop com N ícones arrastáveis. Click (sem drag) -> onOpen(app).
// Container pai tem pointer-events: none; o root reativa com pointer-events: auto.
// Drag via Pointer Events (mouse + touch unificados).

const DRAG_THRESHOLD = 4;

export function mountDesktop(container, { icons, onOpen }) {
  const root = document.createElement("div");
  root.className = "desktop";

  const cleanups = [];
  for (const { app, icon, label } of icons) {
    cleanups.push(makeIcon(root, { app, icon, label, onOpen }));
  }
  container.appendChild(root);

  return function unmount() {
    cleanups.forEach((fn) => fn());
    if (root.parentNode) root.parentNode.removeChild(root);
  };
}

function makeIcon(root, { app, icon, label, onOpen }) {
  const btn = document.createElement("button");
  btn.className = "desktop-icon";
  btn.type = "button";
  btn.dataset.app = app;
  btn.setAttribute("aria-label", label);
  btn.style.touchAction = "none";

  const img = document.createElement("img");
  img.className = "desktop-icon-img";
  img.src = icon;
  img.alt = "";
  img.draggable = false;

  const lbl = document.createElement("span");
  lbl.className = "desktop-icon-label";
  lbl.textContent = label;

  btn.append(img, lbl);
  root.appendChild(btn);

  let pointerId = null;
  let dragging = false;
  let positioned = false;
  let startX = 0;
  let startY = 0;
  let downBtnLeft = 0;
  let downBtnTop = 0;
  let moved = 0;

  function onDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const r = btn.getBoundingClientRect();
    if (!positioned) {
      btn.style.position = "absolute";
      btn.style.left = `${r.left - root.getBoundingClientRect().left}px`;
      btn.style.top = `${r.top - root.getBoundingClientRect().top}px`;
      positioned = true;
    }
    startX = e.clientX;
    startY = e.clientY;
    downBtnLeft = parseFloat(btn.style.left) || 0;
    downBtnTop = parseFloat(btn.style.top) || 0;
    pointerId = e.pointerId;
    dragging = false;
    moved = 0;
    try {
      btn.setPointerCapture(pointerId);
    } catch {}
    e.preventDefault();
  }

  function onMove(e) {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dist = Math.hypot(dx, dy);
    if (!dragging && dist > DRAG_THRESHOLD) {
      dragging = true;
      btn.style.cursor = "grabbing";
    }
    if (dragging) {
      btn.style.left = `${downBtnLeft + dx}px`;
      btn.style.top = `${downBtnTop + dy}px`;
    }
    moved = dist;
  }

  function onUp(e) {
    if (e.pointerId !== pointerId) return;
    if (dragging) btn.style.cursor = "grab";
    if (moved <= DRAG_THRESHOLD) onOpen?.(app);
    dragging = false;
    moved = 0;
    pointerId = null;
  }

  btn.addEventListener("pointerdown", onDown);
  btn.addEventListener("pointermove", onMove);
  btn.addEventListener("pointerup", onUp);
  btn.addEventListener("pointercancel", onUp);

  return function cleanup() {
    btn.removeEventListener("pointerdown", onDown);
    btn.removeEventListener("pointermove", onMove);
    btn.removeEventListener("pointerup", onUp);
    btn.removeEventListener("pointercancel", onUp);
  };
}
