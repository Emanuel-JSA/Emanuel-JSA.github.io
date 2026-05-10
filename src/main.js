import { Renderer } from "./sky/renderer.js";
import { World } from "./sky/world.js";
import { route, start } from "./router.js";
import * as home from "./views/home.js";
import * as post from "./views/post.js";

const canvas = document.getElementById("sky");
const renderer = new Renderer(canvas);
const world = new World(renderer.cols, renderer.rows);

let lastTimestamp;
const DT_MAX = 100;
let needsResize = false;
window.addEventListener("resize", () => { needsResize = true; });

function loop(timestamp) {
    const rawDt = lastTimestamp === undefined ? 0 : timestamp - lastTimestamp;
    const dt = Math.min(rawDt, DT_MAX);
    lastTimestamp = timestamp;

    if (needsResize) {
        needsResize = false;
        renderer.resize();
        world.setSize(renderer.cols, renderer.rows);
    }

    world.update(dt);
    renderer.draw(world);
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

route("/", home);
route("/posts/:slug", post);
start();

if ("serviceWorker" in navigator && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    navigator.serviceWorker.register("/sw.js");
}
