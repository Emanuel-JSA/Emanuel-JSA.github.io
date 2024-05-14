document.addEventListener('DOMContentLoaded', (event) => {
    const logoDark = document.getElementById('logo-dark');
    const logoLight = document.getElementById('logo-light');
    const moon = document.getElementById('moon');
    const sun = document.getElementById('sun');
    const toggleThemeButton = document.getElementById('theme-toggle');
    
    if (!toggleThemeButton) return;

    // Function to update UI elements based on the theme
    function updateUI(isDarkTheme) {
        document.body.style.setProperty('--color-bg', isDarkTheme ? '#121212' : '#FFFFFA');
        document.body.style.setProperty('--color-text', isDarkTheme ? '#FFFFFA' : '#121212');
        logoDark.style.display = isDarkTheme ? 'block' : 'none';
        logoLight.style.display = isDarkTheme ? 'none' : 'block';
        moon.style.display = isDarkTheme ? 'none' : 'block';
        sun.style.display = isDarkTheme ? 'block' : 'none';
    }
    

    // Initialize theme from local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme ? savedTheme : (isSystemDark ? 'dark-theme' : 'light-theme');
    document.body.classList.add(initialTheme);
    updateUI(initialTheme === 'dark-theme');

    // Add event listener for theme toggle
    toggleThemeButton.addEventListener('click', function() {
        const isCurrentlyDark = document.body.classList.contains('dark-theme');
        document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme');
        void document.body.offsetWidth; // Trigger reflow
        updateUI(!isCurrentlyDark);
        localStorage.setItem('theme', isCurrentlyDark ? 'light-theme' : 'dark-theme');

        // Force reevaluation of CSS rules
        const themeClass = isCurrentlyDark ? 'light-theme' : 'dark-theme';
        document.body.classList.remove(themeClass);
        void document.body.offsetWidth; // Trigger reflow
        document.body.classList.add(themeClass);
    });
});
