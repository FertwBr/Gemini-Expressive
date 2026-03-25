/**
 * Converts a Hex color to an HSL array.
 * @param {string} hex The hexadecimal color string.
 * @returns {number[]} An array containing the hue, saturation, and lightness values.
 */
function hexToHsl(hex) {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Converts HSL values to a Hex color string.
 * @param {number} h The hue value.
 * @param {number} s The saturation value.
 * @param {number} l The lightness value.
 * @returns {string} The hexadecimal color string.
 */
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Converts a Hex color directly to an RGB comma-separated string.
 * @param {string} hex The hexadecimal color string.
 * @returns {string} The RGB comma-separated string.
 */
function hexToRgbString(hex) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
}

/**
 * Checks if the dark mode is currently active.
 * @param {string} themeMode The user's theme preference.
 * @returns {boolean} True if dark mode should be applied, false otherwise.
 */
function isDarkModeActive(themeMode) {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;

    if (document.body && document.body.getAttribute('data-theme') === 'dark') return true;
    if (document.documentElement && document.documentElement.getAttribute('data-theme') === 'dark') return true;

    if (document.body && document.body.classList.contains('dark-theme')) return true;
    if (document.documentElement && document.documentElement.classList.contains('dark-theme')) return true;

    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Highly accurate approximation of Material 3 Tonal Palettes.
 * Applies the generated theme to the document structure based on the seed color and the selected mode.
 * @param {string} seedColor The primary seed color.
 * @param {string} themeMode The active theme mode.
 */
function applyMaterialTheme(seedColor, themeMode) {
    if (!seedColor) return;

    try {
        const isDark = isDarkModeActive(themeMode);
        const root = document.documentElement;
        const body = document.body;

        const [h, s] = hexToHsl(seedColor);

        const sPrimary = s;
        const sSecondary = Math.min(s * 0.75, 70);
        const sTertiary = Math.min(s * 0.85, 80);
        const sNeutral = Math.min(s * 0.08, 8);
        const sNeutralVariant = Math.min(s * 0.16, 16);
        const hTertiary = (h + 60) % 360;

        const color = (sat, tone) => hslToHex(h, sat, tone);
        const colorTertiary = (sat, tone) => hslToHex(hTertiary, sat, tone);

        let schemeJson = {};

        if (isDark) {
            schemeJson = {
                primary: color(sPrimary, 80),
                onPrimary: color(sPrimary, 20),
                primaryContainer: color(sPrimary, 30),
                onPrimaryContainer: color(sPrimary, 90),

                secondary: color(sSecondary, 80),
                onSecondary: color(sSecondary, 20),
                secondaryContainer: color(sSecondary, 30),
                onSecondaryContainer: color(sSecondary, 90),

                tertiary: colorTertiary(sTertiary, 80),
                onTertiary: colorTertiary(sTertiary, 20),
                tertiaryContainer: colorTertiary(sTertiary, 30),
                onTertiaryContainer: colorTertiary(sTertiary, 90),

                background: color(sNeutral, 6),
                onBackground: color(sNeutral, 90),
                surface: color(sNeutral, 6),
                onSurface: color(sNeutral, 90),

                surfaceVariant: color(sNeutralVariant, 30),
                onSurfaceVariant: color(sNeutralVariant, 80),

                outline: color(sNeutralVariant, 60),
                outlineVariant: color(sNeutralVariant, 30),

                surfaceContainerLowest: color(sNeutral, 4),
                surfaceContainerLow: color(sNeutral, 10),
                surfaceContainer: color(sNeutral, 12),
                surfaceContainerHigh: color(sNeutral, 17),
                surfaceContainerHighest: color(sNeutral, 22),
            };
        } else {
            schemeJson = {
                primary: color(sPrimary, 40),
                onPrimary: color(sPrimary, 100),
                primaryContainer: color(sPrimary, 90),
                onPrimaryContainer: color(sPrimary, 10),

                secondary: color(sSecondary, 40),
                onSecondary: color(sSecondary, 100),
                secondaryContainer: color(sSecondary, 90),
                onSecondaryContainer: color(sSecondary, 10),

                tertiary: colorTertiary(sTertiary, 40),
                onTertiary: colorTertiary(sTertiary, 100),
                tertiaryContainer: colorTertiary(sTertiary, 90),
                onTertiaryContainer: colorTertiary(sTertiary, 10),

                background: color(sNeutral, 99),
                onBackground: color(sNeutral, 10),
                surface: color(sNeutral, 99),
                onSurface: color(sNeutral, 10),

                surfaceVariant: color(sNeutralVariant, 90),
                onSurfaceVariant: color(sNeutralVariant, 30),

                outline: color(sNeutralVariant, 50),
                outlineVariant: color(sNeutralVariant, 80),

                surfaceContainerLowest: color(sNeutral, 100),
                surfaceContainerLow: color(sNeutral, 96),
                surfaceContainer: color(sNeutral, 94),
                surfaceContainerHigh: color(sNeutral, 92),
                surfaceContainerHighest: color(sNeutral, 90),
            };
        }

        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", schemeJson.surface);
        }

        for (const [key, value] of Object.entries(schemeJson)) {
            const token = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

            root.style.setProperty(`--bg-sys-color-${token}`, value);
            root.style.setProperty(`--bg-sys-color-${token}-rgb`, hexToRgbString(value));

            root.style.setProperty(`--gem-sys-color--${token}`, value, "important");
            root.style.setProperty(`--md-sys-color-${token}`, value, "important");
            root.style.setProperty(`--sys-color--${token}`, value, "important");

            if (body) {
                body.style.setProperty(`--gem-sys-color--${token}`, value, "important");
                body.style.setProperty(`--md-sys-color-${token}`, value, "important");
                body.style.setProperty(`--sys-color--${token}`, value, "important");
            }
        }

        if (body) {
            body.style.setProperty("--bard-color-synthetic--chat-window-surface", schemeJson.surface, "important");
            body.style.setProperty("--bard-color-synthetic--mat-card-background", schemeJson.surfaceContainerHigh, "important");
            body.style.setProperty("--bard-color-synthetic--chat-window-surface-container", schemeJson.surfaceContainer, "important");
            body.style.setProperty("--bard-color-synthetic--chat-window-surface-container-high", schemeJson.surfaceContainerHigh, "important");
            body.style.setProperty("--bard-color-synthetic--chat-window-surface-container-highest", schemeJson.surfaceContainerHighest, "important");

            body.style.setProperty("--bard-color-sidenav-background-desktop", schemeJson.surfaceContainerHigh, "important");
            body.style.setProperty("--bard-color-sidenav-background-mobile", schemeJson.surfaceContainerHigh, "important");
        }

        if (themeMode === 'dark') {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
            root.style.colorScheme = 'dark';
        } else if (themeMode === 'light') {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
            root.style.colorScheme = 'light';
        } else {
            root.style.colorScheme = isDark ? 'dark' : 'light';
        }
    } catch (error) {
    }
}