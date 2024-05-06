document.addEventListener('DOMContentLoaded', (event) => {
    const logoDark = document.getElementById('logo-dark');
    const logoLight = document.getElementById('logo-light');
    const moon = document.getElementById('moon');
    const sun = document.getElementById('sun');

    const toggleThemeButton = document.getElementById('theme-toggle');
    if (!toggleThemeButton) return;

    toggleThemeButton.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        logoDark.style.display = logoDark.style.display === 'none' ? 'block' : 'none';
        logoLight.style.display = logoLight.style.display === 'none' ? 'block' : 'none';    
        moon.style.display = moon.style.display === 'none' ? 'block' : 'none';
        sun.style.display = sun.style.display === 'none' ? 'block' : 'none';
    });
});