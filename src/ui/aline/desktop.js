// Desktop com 1 ícone ("imagem"), arrastável. Click (sem drag) -> onOpen("imagem").
// Container pai tem pointer-events: none; o root reativa com pointer-events: auto.

const DRAG_THRESHOLD = 4;

export function mountDesktop(container, { onOpen }) {
  const root = document.createElement("div");
  root.className = "desktop";

  const btn = document.createElement("button");
  btn.className = "desktop-icon";
  btn.type = "button";
  btn.dataset.app = "meuAmor.jpg";
  btn.setAttribute("aria-label", "meuAmor.jpg");

  const img = document.createElement("img");
  img.className = "desktop-icon-img";
  img.src = "/assets/icon_pic.png";
  img.alt = "";
  img.draggable = false;

  const label = document.createElement("span");
  label.className = "desktop-icon-label";
  label.textContent = "meuAmor.jpg";

  btn.append(img, label);
  root.appendChild(btn);
  container.appendChild(root);

  // Estado do drag
  let active = false;
  let dragging = false;
  let positioned = false;
  let startX = 0;
  let startY = 0;
  let downBtnLeft = 0;
  let downBtnTop = 0;
  let moved = 0;

  function onDown(e) {
    if (e.button !== 0) return;
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
    active = true;
    dragging = false;
    moved = 0;
    e.preventDefault();
  }

  function onMove(e) {
    if (!active) return;
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

  function onUp() {
    if (!active) return;
    if (dragging) btn.style.cursor = "grab";
    active = false;
    // dragging fica true até o click distinguir, mas o click só dispara
    // se moved <= threshold — então resetamos aqui mesmo
    if (moved <= DRAG_THRESHOLD) {
      // click genuíno: não estamos arrastando, abre o modal
      onOpen?.("imagem");
    }
    dragging = false;
    moved = 0;
  }

  btn.addEventListener("mousedown", onDown);
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);

  return function unmount() {
    btn.removeEventListener("mousedown", onDown);
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
    if (root.parentNode) root.parentNode.removeChild(root);
  };
}
