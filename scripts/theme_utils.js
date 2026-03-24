import {themeFromSourceColor, applyTheme, hexFromArgb} from '@material/material-color-utilities';

/**
 * Converts a hex string to an RGB string format.
 * @param {string} hex Hex color code.
 * @returns {string} RGB string.
 */
const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
};

/**
 * Converts an ARGB number to a Hex string.
 * @param {number} argb ARGB color value.
 * @returns {string} Hex color string.
 */
const argbToHex = (argb) => {
    return `#${(argb & 0x00ffffff).toString(16).padStart(6, '0')}`;
};

/**
 * Determines if dark mode should be applied based on settings and OS preference.
 * @param {string} themeMode The saved theme mode setting.
 * @returns {boolean} True if dark mode should be applied.
 */
function isDarkModeActive(themeMode) {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Applies the Material You theme to the document root based on the provided settings.
 * @param {string} seedColor Hex color string.
 * @param {string} themeMode Theme mode selection.
 */
export function applyMaterialTheme(seedColor, themeMode) {
    if (!seedColor) {
        return;
    }

    try {
        const isDark = isDarkModeActive(themeMode);
        const theme = themeFromSourceColor(parseInt(seedColor.replace('#', ''), 16));
        applyTheme(theme, {dark: isDark, target: document.documentElement});

        const scheme = isDark ? theme.schemes.dark : theme.schemes.light;
        const root = document.documentElement;
        const schemeJson = scheme.toJSON();

        if (!schemeJson.surfaceContainer) {
            const neutralPalette = theme.palettes.neutral;
            schemeJson.surfaceContainerLowest = neutralPalette.tone(isDark ? 4 : 100);
            schemeJson.surfaceContainerLow = neutralPalette.tone(isDark ? 10 : 96);
            schemeJson.surfaceContainer = neutralPalette.tone(isDark ? 12 : 94);
            schemeJson.surfaceContainerHigh = neutralPalette.tone(isDark ? 17 : 92);
            schemeJson.surfaceContainerHighest = neutralPalette.tone(isDark ? 22 : 90);
        }

        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", argbToHex(schemeJson.surface));
        }

        for (const [key, value] of Object.entries(schemeJson)) {
            const token = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
            const hex = argbToHex(value);
            root.style.setProperty(`--bg-sys-color-${token}`, hex);
            root.style.setProperty(`--bg-sys-color-${token}-rgb`, hexToRgb(hex));
            root.style.setProperty(`--gem-sys-color--${token}`, hex);
            root.style.setProperty(`--md-sys-color-${token}`, hex);
        }

        if (themeMode === 'dark') {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
        } else if (themeMode === 'light') {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
        } else {
            root.classList.remove('dark-theme', 'light-theme');
        }

    } catch (error) {
        console.error("Theme update failed", error);
    }
}