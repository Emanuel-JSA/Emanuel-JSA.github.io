const routes = [];
let currentUnmount = null;

export function route(pattern, view) {
    routes.push({ pattern, view });
}

async function navigate(path) {
    const resolved = resolve(path);
    const { view, params } = resolved ?? { view: notFound, params: {} };

    if (currentUnmount) {
        currentUnmount();
        currentUnmount = null;
    }

    const main = document.getElementById("view");
    main.innerHTML = await view.render(params);

    if (view.mount) {
        currentUnmount = (await view.mount(main, params)) ?? null;
    }
}

function resolve(path) {
    for (const { pattern, view } of routes) {
        const params = match(pattern, path);
        if (params !== null) return { view, params };
    }
    return null;
}

function match(pattern, path) {
    const pp = pattern.split("/").filter(Boolean);
    const pa = path.split("/").filter(Boolean);
    if (pp.length !== pa.length) return null;
    const params = {};
    for (let i = 0; i < pp.length; i++) {
        if (pp[i][0] === ":") {
            params[pp[i].slice(1)] = decodeURIComponent(pa[i]);
        } else if (pp[i] !== pa[i]) {
            return null;
        }
    }
    return params;
}

const notFound = {
    render: () =>
        `<p style="color:#fff;font-family:monospace;padding:5% 20px">404 — página não encontrada.</p>`,
};

export function start() {
    // Restaura path salvo pelo 404.html (workaround GitHub Pages)
    const redirect = sessionStorage.getItem("spa-redirect");
    if (redirect) {
        sessionStorage.removeItem("spa-redirect");
        history.replaceState(null, "", redirect);
    }

    document.addEventListener("click", (e) => {
        const a = e.target.closest("a[href]");
        if (!a) return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin) return;
        e.preventDefault();
        history.pushState(null, "", url.pathname);
        navigate(url.pathname);
    });

    window.addEventListener("popstate", () => navigate(location.pathname));

    navigate(location.pathname);
}
