export function mountDivider(el) {
    const probe = document.createElement("span");
    probe.style.font = getComputedStyle(el).font;
    probe.style.visibility = "hidden";
    probe.style.position = "absolute";
    probe.style.whiteSpace = "pre";
    probe.textContent = "-";
    document.body.appendChild(probe);

    function fill() {
        probe.style.font = getComputedStyle(el).font;
        const charW = probe.getBoundingClientRect().width || 8;
        const style = getComputedStyle(el);
        const availW = Math.max(0,
            el.getBoundingClientRect().width
            - parseFloat(style.paddingLeft)
            - parseFloat(style.paddingRight)
        );
        const cols = Math.max(1, Math.floor(availW / charW));
        el.textContent = "-".repeat(cols);
    }
    fill();
    window.addEventListener("resize", fill);

    return function unmount() {
        window.removeEventListener("resize", fill);
        probe.remove();
    };
}
