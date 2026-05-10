export async function mountBot(el) {
    const [defaultTxt, blinkingTxt, closedTxt] = await Promise.all([
        fetch("/assets/ascii-bot-default.txt").then((r) => r.text()),
        fetch("/assets/ascii-bot-blinking.txt").then((r) => r.text()),
        fetch("/assets/ascii-bot-closed-eyes.txt").then((r) => r.text()),
    ]);

    el.textContent = defaultTxt;

    const amp1 = 3 + Math.random() * 2;
    const amp2 = 1 + Math.random() * 1;
    const freq1 = 0.0016 + Math.random() * 0.0004;
    const freq2 = 0.0025 + Math.random() * 0.0005;
    let t = 0, lastTs = null;
    let alive = true;
    let rafId;

    function floatBot(ts) {
        if (!alive) return;
        if (!lastTs) lastTs = ts;
        t += ts - lastTs;
        lastTs = ts;
        el.style.transform = `translateY(${amp1 * Math.sin(freq1 * t) + amp2 * Math.sin(freq2 * t)}px)`;
        rafId = requestAnimationFrame(floatBot);
    }
    rafId = requestAnimationFrame(floatBot);

    let blinkTimeoutId;

    function blink() {
        if (!alive) return;
        el.textContent = blinkingTxt;
        blinkTimeoutId = setTimeout(() => {
            if (!alive) return;
            el.textContent = closedTxt;
            blinkTimeoutId = setTimeout(() => {
                if (!alive) return;
                el.textContent = blinkingTxt;
                blinkTimeoutId = setTimeout(() => {
                    if (!alive) return;
                    el.textContent = defaultTxt;
                    blinkTimeoutId = setTimeout(blink, 3000 + Math.random() * 5000);
                }, 120 + Math.random() * 60);
            }, 160 + Math.random() * 80);
        }, 120 + Math.random() * 60);
    }
    blinkTimeoutId = setTimeout(blink, 2000 + Math.random() * 3000);

    return function unmount() {
        alive = false;
        cancelAnimationFrame(rafId);
        clearTimeout(blinkTimeoutId);
    };
}
