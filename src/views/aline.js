import { html, css } from "../util/html.js";
import { mountDesktop } from "../ui/aline/desktop.js";
import { createModal } from "../ui/aline/modal.js";
import { createPixelatingImage } from "../ui/aline/pixelate.js";

const styles = css`
  * {
    box-sizing: border-box;
  }

  .aline.container {
    --yellow: #fda400;
    --bg: #171814;
    position: relative;
    background: var(--bg);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    overflow: hidden;
    font-family: monospace;
    color: var(--yellow);
  }

  .login {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 420px;
    text-align: start;
    border: 1px solid var(--yellow);
    background-size:
      2px 100%,
      100% 2px,
      2px 100%,
      100% 2px;
    background-position:
      0 0,
      0 0,
      100% 0,
      0 100%;
    background-repeat: no-repeat;
    padding: 2.5rem 1.5rem;
    font-family: monospace;
    font-weight: normal;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    text-transform: uppercase;
  }

  .login-title {
    color: var(--yellow);
    font-family: monospace;
    font-size: clamp(1rem, 4vw, 1.1rem);
    margin: 0;
    letter-spacing: 1px;
    line-height: 1.4;
    font-weight: normal;
    text-shadow: 0 0 6px var(--yellow);
    text-transform: uppercase;
  }

  .login-input {
    background: transparent;
    border: 1px solid var(--yellow);
    color: var(--yellow);
    font-family: monospace;
    font-size: clamp(1rem, 4vw, 1.1rem);
    padding: 1rem;
    outline: none;
    width: 100%;
    letter-spacing: 1px;
    text-transform: uppercase;
    text-shadow: 0 0 6px var(--yellow);
  }

  .login-input::placeholder {
    color: rgba(253, 164, 0, 0.4);
  }

  .login-btn {
    width: 100%;
    background: transparent;
    border: 1px solid var(--yellow);
    font-family: monospace;
    font-size: clamp(1rem, 4vw, 1.1rem);
    padding: 1rem;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: var(--yellow);
  }

  .login-top-bar {
    width: calc(100% + 3rem);
    height: 30px;
    margin: -2.5rem -1.5rem 0;
    background: var(--yellow);
  }

  .vinheta {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 3;
    background: radial-gradient(
      ellipse at center,
      transparent 55%,
      rgba(0, 0, 0, 0.8) 100%
    );
  }

  .login-erro {
    color: var(--yellow);
    text-shadow: 0 0 6px var(--yellow);
    font-size: clamp(0.7rem, 2.5vw, 0.8rem);
    letter-spacing: 1px;
    min-height: 1.4em;
    margin: 0;
    margin-top: -1rem;
    text-align: start;
    align-self: stretch;
    width: 100%;
  }

  .aline-content[hidden] {
    display: none;
  }

  .aline-content {
    position: fixed;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(253, 164, 0, 0.18) 1px, transparent 1px),
      linear-gradient(90deg, rgba(253, 164, 0, 0.18) 1px, transparent 1px);
    background-size: 32px 32px;
    background-position: -1px -1px;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    align-items: start;
    justify-items: center;
    padding: 3rem 1.5rem;
    gap: 2rem;
    overflow: auto;
  }

  .aline-content > * {
    pointer-events: auto;
  }

  .aline-content h1 {
    font-family: monospace;
    font-size: clamp(1.2rem, 5vw, 1.8rem);
    margin: 0;
    letter-spacing: 1px;
    text-shadow: 0 0 6px var(--yellow);
    text-align: center;
  }

  .aline-content p {
    font-family: monospace;
    font-size: clamp(0.9rem, 3vw, 1rem);
    margin: 0;
    opacity: 0.7;
    text-align: center;
  }

  .desktop {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 1rem;
    padding-top: 0.5rem;
  }

  .desktop-icon {
    position: relative;
    background: transparent;
    border: 1px solid transparent;
    color: var(--yellow);
    font-family: monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 0 0 6px var(--yellow);
    padding: 0.5rem;
    cursor: grab;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 96px;
  }

  .desktop-icon:hover,
  .desktop-icon:focus {
    border-color: var(--yellow);
    outline: none;
  }

  .desktop-icon-img {
    width: 64px;
    height: auto;
    image-rendering: pixelated;
    pointer-events: none;
  }

  .desktop-icon-label {
    font-size: clamp(0.7rem, 2.5vw, 0.85rem);
  }

  .modal {
    position: fixed;
    width: min(80vw, 720px);
    border: 1px solid var(--yellow);
    background: var(--bg);
    color: var(--yellow);
    font-family: monospace;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-shadow: 0 0 6px var(--yellow);
    box-shadow: 0 0 24px rgba(253, 164, 0, 0.25);
  }

  .modal[hidden] {
    display: none;
  }

  .modal-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 30px;
    padding: 0 0.75rem;
    background: var(--yellow);
    color: var(--bg);
    text-shadow: none;
    cursor: grab;
    user-select: none;
  }

  .modal-title {
    font-size: 0.85rem;
    letter-spacing: 1px;
  }

  .modal-close {
    background: transparent;
    border: none;
    color: var(--bg);
    font-family: monospace;
    font-size: 1rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.25rem;
  }

  .modal-close:hover {
    text-shadow: 0 0 4px var(--bg);
  }

  .modal-body {
    padding: 1rem;
    display: flex;
    justify-content: center;
  }

  .modal-body img,
  .modal-body canvas {
    display: block;
    max-width: min(80vw, 800px);
    max-height: 70vh;
    object-fit: contain;
  }

  .modal-body canvas {
    image-rendering: pixelated;
    width: auto;
    height: auto;
  }

  .modal-body pre {
    margin: 0;
    padding: 0;
    font-family: monospace;
    font-size: clamp(0.8rem, 3vw, 0.95rem);
    line-height: 1.5;
    letter-spacing: 0.5px;
    color: var(--yellow);
    background: transparent;
    text-shadow: none;
    text-transform: none;
    white-space: pre-wrap;
    word-break: break-word;
    max-width: min(80vw, 640px);
    max-height: 70vh;
    overflow: auto;
    text-align: start;
  }

  .crt-overlay {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
    background: repeating-linear-gradient(
      0deg,
      transparent 0,
      transparent 2px,
      rgba(0, 0, 0, 0.45) 2px,
      rgba(0, 0, 0, 0.45) 3px
    );
    box-shadow:
      inset 0 0 140px 50px rgba(0, 0, 0, 0.9),
      inset 0 0 70px 12px rgba(0, 0, 0, 0.7);
    animation: crt-flicker 6s steps(60) infinite;
    mix-blend-mode: multiply;
  }

  .crt-overlay::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    height: 28%;
    background: linear-gradient(
      transparent,
      rgba(253, 164, 0, 0.08),
      transparent
    );
    animation: crt-roll 7s linear infinite;
  }

  @keyframes crt-flicker {
    0%,
    100% {
      opacity: 1;
    }
    3% {
      opacity: 0.9;
    }
    6% {
      opacity: 1;
    }
    48% {
      opacity: 0.97;
    }
    50% {
      opacity: 0.82;
    }
    52% {
      opacity: 1;
    }
    78% {
      opacity: 0.95;
    }
  }

  @keyframes crt-roll {
    0% {
      top: -30%;
    }
    100% {
      top: 130%;
    }
  }

  .aline.container .login-title,
  .aline.container .login-input,
  .aline.container .login-input::placeholder,
  .aline.container .login-btn,
  .aline.container .login-erro,
  .aline.container .desktop-icon,
  .aline.container .desktop-icon-label,
  .aline-content h1,
  .aline-content p {
    text-shadow:
      1.5px 0 rgba(255, 0, 80, 0.7),
      -1.5px 0 rgba(0, 200, 255, 0.7),
      0 0 6px var(--yellow);
  }
`;

export async function render() {
  return html` <div class="aline container">
    ${styles}
    <div class="login-container">
      <p>
        . ݁₊ ⊹ . ݁ ⟡ ݁ . ⊹ ₊ ݁. . ݁₊ ⊹ . ݁ ⟡ ݁. ݁ ⟡ ݁ ݁₊ ⊹ . ݁ ⟡ ݁ . ݁ . ⊹ ₊ ݁.
      </p>
      <div class="login">
        <div class="login-top-bar"></div>
        <h1 class="login-title">Qual a senha do coração do Emanuel?</h1>
        <input
          class="login-input"
          type="text"
          autocomplete="off"
          data-value=""
        />
        <p class="login-erro"></p>
        <button class="login-btn">ENTRAR</button>
      </div>
    </div>
    <div class="aline-content" hidden></div>
    <div class="crt-overlay"></div>
  </div>`;
}

export async function mount(el) {
  document.title = "TERMINAL - Aline";

  const input = el.querySelector(".login-input");
  const erro = el.querySelector(".login-erro");
  const btn = el.querySelector(".login-btn");
  const loginContainer = el.querySelector(".login-container");
  const content = el.querySelector(".aline-content");

  input.addEventListener("input", () => {
    const real = (input.dataset.value || "") + input.value.replace(/\*/g, "");
    const last = real.slice(-1);
    const next = (input.dataset.value || "") + last;
    input.dataset.value = next;
    input.value = "*".repeat(next.length);
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      input.dataset.value = (input.dataset.value || "").slice(0, -1);
      input.value = "*".repeat(input.dataset.value.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      tentarEntrar();
    }
  });

  btn.addEventListener("click", tentarEntrar);

  let unmountDesktop = null;
  let zTop = 1000;
  const modais = new Set();

  function trazerPraFrente(modal) {
    zTop += 1;
    modal.el.style.zIndex = String(zTop);
  }

  function abrirImagem() {
    const existente = [...modais].find((m) => m.el.dataset.app === "meuAmor.jpg");
    if (existente) {
      trazerPraFrente(existente);
      return;
    }
    const pixelate = createPixelatingImage("/assets/aline_dither.jpg");
    const modal = createModal({ title: "meuAmor.jpg", body: pixelate.el });
    trazerPraFrente(modal);
    content.appendChild(modal.el);
    modais.add(modal);
    const observer = new MutationObserver(() => {
      if (!modal.el.isConnected) {
        pixelate.cancel();
        modais.delete(modal);
        observer.disconnect();
      }
    });
    observer.observe(content, { childList: true });
  }

  async function abrirTexto() {
    const existente = [...modais].find((m) => m.el.dataset.app === "texto.txt");
    if (existente) {
      trazerPraFrente(existente);
      return;
    }
    const res = await fetch("/content/aline/texto.txt");
    const txt = await res.text();
    const pre = document.createElement("pre");
    pre.textContent = txt;
    const modal = createModal({ title: "texto.txt", body: pre });
    trazerPraFrente(modal);
    content.appendChild(modal.el);
    modais.add(modal);
    const observer = new MutationObserver(() => {
      if (!modal.el.isConnected) {
        modais.delete(modal);
        observer.disconnect();
      }
    });
    observer.observe(content, { childList: true });
  }

  function abrir(app) {
    if (app === "meuAmor.jpg") abrirImagem();
    else if (app === "texto.txt") abrirTexto();
  }

  function onKeyGlobal(e) {
    if (e.key !== "Escape") return;
    if (!modais.size) return;
    const topo = [...modais].reduce((a, b) =>
      parseInt(a.el.style.zIndex || "0", 10) >=
      parseInt(b.el.style.zIndex || "0", 10)
        ? a
        : b,
    );
    topo.close();
  }
  document.addEventListener("keydown", onKeyGlobal);

  const icons = [
    { app: "meuAmor.jpg", icon: "/assets/icon_pic.png", label: "meuAmor.jpg" },
    { app: "texto.txt", icon: "/assets/icon_txt.png", label: "texto.txt" },
  ];

  function tentarEntrar() {
    const senha = (input.dataset.value || "").toLowerCase();
    if (senha === "aline") {
      loginContainer.hidden = true;
      content.hidden = false;
      unmountDesktop = mountDesktop(content, { icons, onOpen: abrir });
      return;
    }
    input.dataset.value = "";
    input.value = "";
    erro.textContent = "essa não é a senha do coração do emanuel";
  }

  return function unmount() {
    document.removeEventListener("keydown", onKeyGlobal);
    modais.forEach((m) => m.close());
    if (unmountDesktop) unmountDesktop();
  };
}
