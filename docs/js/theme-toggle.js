document.addEventListener('DOMContentLoaded', (event) => {
    const logoDark = document.getElementById('logo-dark');
    const logoLight = document.getElementById('logo-light');
    const moon = document.getElementById('moon');
    const sun = document.getElementById('sun');

    const toggleThemeButton = document.getElementById('theme-toggle');
    if (!toggleThemeButton) return;

    // Load theme from local storage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.add(savedTheme);
        const isDarkTheme = savedTheme === 'dark-theme';
        logoDark.style.display = isDarkTheme ? 'none' : 'block';
        logoLight.style.display = isDarkTheme ? 'block' : 'none';
        moon.style.display = isDarkTheme ? 'none' : 'block';
        sun.style.display = isDarkTheme ? 'block' : 'none';
    } else {
        const isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.add(isDarkTheme ? 'dark-theme' : 'light-theme');
        logoDark.style.display = isDarkTheme ? 'none' : 'block';
        logoLight.style.display = isDarkTheme ? 'block' : 'none';
        moon.style.display = isDarkTheme ? 'none' : 'block';
        sun.style.display = isDarkTheme ? 'block' : 'none';
    }

    toggleThemeButton.addEventListener('click', function() {
        const isDarkTheme = document.body.classList.toggle('dark-theme');
        logoDark.style.display = isDarkTheme ? 'none' : 'block';
        logoLight.style.display = isDarkTheme ? 'block' : 'none';
        moon.style.display = isDarkTheme ? 'none' : 'block';
        sun.style.display = isDarkTheme ? 'block' : 'none';

        // Save theme to local storage
        localStorage.setItem('theme', isDarkTheme ? 'dark-theme' : 'light-theme');
    });
});