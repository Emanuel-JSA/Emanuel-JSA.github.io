import { mountDivider } from "../ui/divider.js";
import { mountBot } from "../ui/bot.js";
import posts from "/content/posts.js";

export async function render() {

  const postLinks = posts
    .map((p) => `<a class="post-title" href="/posts/${p.slug}">${p.title}</a>`)
    .join("\n            ");

  return `
        <div class="container">
            <div class="top-row">
                <div class="intro">
                    <pre id="bem-vindo" class="ascii-art"></pre>
                    <p class="bio">
                        Me chamo Emanuel! gosto de programar e de ensinar robôs
                        a resolverem problemas
                    </p>
                    <p class="links">
                        <a href="https://www.linkedin.com/in/emanuel-jsa/" target="_blank">linkedin</a>
                        <span> | </span>
                        <a href="https://github.com/Emanuel-JSA" target="_blank">github</a>
                    </p>
                </div>
                <pre id="bot" class="ascii-art ascii-bot"></pre>
            </div>
            <pre id="divider" class="divider"></pre>
            <div class="posts">
                ${postLinks}
            </div>
        </div>
    `;
}

export async function mount(el) {
  document.title = "sky";

  const bemVindo = el.querySelector("#bem-vindo");
  if (bemVindo) {
    bemVindo.textContent = await fetch("/assets/ascii-bem-vindo.txt").then(
      (r) => r.text(),
    );
  }

  const cleanups = [];

  const bot = el.querySelector("#bot");
  if (bot) {
    const unmountBot = await mountBot(bot);
    if (unmountBot) cleanups.push(unmountBot);
  }

  const divider = el.querySelector("#divider");
  if (divider) cleanups.push(mountDivider(divider));

  return function unmount() {
    for (const fn of cleanups) fn();
  };
}
