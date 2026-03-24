/**
 * Converts a hex string to an RGB array format.
 * @param {string} hex Hex color code.
 * @returns {Array<number>} RGB array.
 */
function hexToRgb(hex) {
    let r = 0;
    let g = 0;
    let b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    return [r, g, b];
}

/**
 * Converts RGB values to a Hex string.
 * @param {number} r Red value.
 * @param {number} g Green value.
 * @param {number} b Blue value.
 * @returns {string} Hex color string.
 */
function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

/**
 * Tints a color with white or black to create tones.
 * @param {Array<number>} rgb RGB array.
 * @param {number} factor Tint factor.
 * @returns {Array<number>} Tinted RGB array.
 */
function tintColor(rgb, factor) {
    let r = rgb[0];
    let g = rgb[1];
    let b = rgb[2];
    if (factor > 0) {
        r = r + (255 - r) * factor;
        g = g + (255 - g) * factor;
        b = b + (255 - b) * factor;
    } else if (factor < 0) {
        const absFactor = Math.abs(factor);
        r = r * (1 - absFactor);
        g = g * (1 - absFactor);
        b = b * (1 - absFactor);
    }
    return [Math.round(r), Math.round(g), Math.round(b)];
}

/**
 * Determines if dark mode should be applied based on settings and OS preference.
 * @param {string} themeMode The saved theme mode setting.
 * @returns {boolean} True if dark mode should be applied.
 */
function isDarkModeActive(themeMode) {
    if (themeMode === 'dark') {
        return true;
    }
    if (themeMode === 'light') {
        return false;
    }
    if (document.body && document.body.classList.contains('dark-theme')) {
        return true;
    }
    if (document.documentElement && document.documentElement.classList.contains('dark-theme')) {
        return true;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Applies the custom theme to the document root based on the provided settings.
 * @param {string} seedColor Hex color string.
 * @param {string} themeMode Theme mode selection.
 */
function applyMaterialTheme(seedColor, themeMode) {
    if (!seedColor) {
        return;
    }

    try {
        const isDark = isDarkModeActive(themeMode);
        const root = document.documentElement;
        const baseRgb = hexToRgb(seedColor);

        let primary, onPrimary, primaryContainer, onPrimaryContainer;
        let secondaryContainer, onSecondaryContainer;
        let background, onBackground, surface, onSurface, surfaceVariant, onSurfaceVariant;
        let outline, outlineVariant;
        let surfaceContainer, surfaceContainerHigh, surfaceContainerHighest;

        if (isDark) {
            primary = rgbToHex(...tintColor(baseRgb, 0.4));
            onPrimary = rgbToHex(...tintColor(baseRgb, -0.8));
            primaryContainer = rgbToHex(...tintColor(baseRgb, -0.6));
            onPrimaryContainer = rgbToHex(...tintColor(baseRgb, 0.8));

            secondaryContainer = rgbToHex(...tintColor(baseRgb, -0.7));
            onSecondaryContainer = rgbToHex(...tintColor(baseRgb, 0.8));

            surface = rgbToHex(...tintColor(hexToRgb("#1a1c1e"), 0.02));
            onSurface = "#e3e2e6";
            background = surface;
            onBackground = onSurface;

            surfaceVariant = "#44474e";
            onSurfaceVariant = "#c4c7c5";
            outline = "#8d9199";
            outlineVariant = "#44474e";

            surfaceContainer = rgbToHex(...tintColor(hexToRgb("#1e1f22"), 0.04));
            surfaceContainerHigh = rgbToHex(...tintColor(hexToRgb("#2b2930"), 0.04));
            surfaceContainerHighest = rgbToHex(...tintColor(hexToRgb("#36343b"), 0.04));
        } else {
            primary = seedColor;
            onPrimary = "#ffffff";
            primaryContainer = rgbToHex(...tintColor(baseRgb, 0.85));
            onPrimaryContainer = rgbToHex(...tintColor(baseRgb, -0.8));

            secondaryContainer = rgbToHex(...tintColor(baseRgb, 0.8));
            onSecondaryContainer = rgbToHex(...tintColor(baseRgb, -0.8));

            surface = rgbToHex(...tintColor(baseRgb, 0.98));
            onSurface = "#1a1c1e";
            background = surface;
            onBackground = onSurface;

            surfaceVariant = "#e1e2e8";
            onSurfaceVariant = "#444746";
            outline = "#74777f";
            outlineVariant = "#c4c7c5";

            surfaceContainer = rgbToHex(...tintColor(baseRgb, 0.95));
            surfaceContainerHigh = rgbToHex(...tintColor(baseRgb, 0.92));
            surfaceContainerHighest = rgbToHex(...tintColor(baseRgb, 0.90));
        }

        const schemeJson = {
            primary: primary,
            onPrimary: onPrimary,
            primaryContainer: primaryContainer,
            onPrimaryContainer: onPrimaryContainer,
            secondaryContainer: secondaryContainer,
            onSecondaryContainer: onSecondaryContainer,
            background: background,
            onBackground: onBackground,
            surface: surface,
            onSurface: onSurface,
            surfaceVariant: surfaceVariant,
            onSurfaceVariant: onSurfaceVariant,
            outline: outline,
            outlineVariant: outlineVariant,
            surfaceContainer: surfaceContainer,
            surfaceContainerHigh: surfaceContainerHigh,
            surfaceContainerHighest: surfaceContainerHighest
        };

        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", surface);
        }

        for (const [key, value] of Object.entries(schemeJson)) {
            const token = key.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
            root.style.setProperty(`--bg-sys-color-${token}`, value);
            root.style.setProperty(`--bg-sys-color-${token}-rgb`, hexToRgb(value).join(', '));

            root.style.setProperty(`--gem-sys-color--${token}`, value, "important");
            root.style.setProperty(`--md-sys-color-${token}`, value, "important");
        }

        root.style.setProperty("--bard-color-synthetic--chat-window-surface", surface, "important");
        root.style.setProperty("--bard-color-synthetic--mat-card-background", surfaceContainer, "important");
        root.style.setProperty("--bard-color-synthetic--chat-window-surface-container", surfaceContainer, "important");
        root.style.setProperty("--bard-color-synthetic--chat-window-surface-container-high", surfaceContainerHigh, "important");

        if (themeMode === 'dark') {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
            root.style.colorScheme = 'dark';
        } else if (themeMode === 'light') {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
            root.style.colorScheme = 'light';
        } else {
            root.classList.remove('dark-theme', 'light-theme');
            if (isDark) {
                root.style.colorScheme = 'dark';
            } else {
                root.style.colorScheme = 'light';
            }
        }
    } catch (error) {
        console.error("Theme update failed", error);
    }
}