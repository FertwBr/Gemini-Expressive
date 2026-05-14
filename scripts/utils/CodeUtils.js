/*
 * Copyright (c) 2026 Fernando Vaz
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Provides static utilities for analyzing, parsing, and sanitizing raw text and code blocks.
 * It encapsulates logic for identifying programming languages, mapping them to official icons,
 * and using regular expressions to extract metadata such as file names directly from the code syntax.
 */
class CodeUtils {
    /**
     * Strips away localized conversational filler text injected by the AI interface (e.g., "You said",
     * "Gemini said", "Show reasoning") to ensure clean extraction of the actual code or message intent.
     * @param {string} text - The raw text content retrieved from the DOM.
     * @returns {string} The sanitized text string ready for UI preview rendering.
     */
    static cleanText(text) {
        let cleaned = text.replace(/Você disse\s*/gi, '');
        cleaned = cleaned.replace(/Mostrar raciocínio\s*/gi, '');
        cleaned = cleaned.replace(/You said\s*/gi, '');
        cleaned = cleaned.replace(/Show reasoning\s*/gi, '');
        cleaned = cleaned.replace(/O Gemini disse\s*/gi, '');
        cleaned = cleaned.replace(/Gemini said\s*/gi, '');
        return cleaned.trim();
    }

    /**
     * Evaluates a recognized programming language string and maps it to the most semantically
     * appropriate Google Material Symbol icon identifier for visual representation in headers.
     * @param {string} lang - The string name of the programming language.
     * @returns {string} The string identifier for the matching Material Symbol.
     */
    static getLanguageIcon(lang) {
        const language = lang.toLowerCase();
        if (language === 'sql') {
            return 'database';
        }
        if (language === 'python' || language === 'bash' || language === 'shell' || language === 'go' || language === 'rust' || language === 'ruby' || language === 'c' || language === 'cpp') {
            return 'terminal';
        }
        if (language === 'json' || language === 'xml' || language === 'yaml') {
            return 'data_object';
        }
        return 'code';
    }

    /**
     * Applies language-specific regex heuristics to infer a plausible file name based on class,
     * struct, function, or interface declarations found within the raw code block content.
     * @param {string} code - The raw, unformatted code string.
     * @param {string} language - The identified language context of the code.
     * @returns {string|null} The inferred file name with extension, or null if no confident match is found.
     */
    static extractCodeMetadata(code, language) {
        let ext = '';
        let match = null;
        const lang = language.toLowerCase();

        if (lang === 'javascript' || lang === 'js') {
            ext = '.js';
            match = code.match(/function\s+([a-zA-Z0-9_]+)/) || code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/) || code.match(/const\s+([a-zA-Z0-9_]+)\s*=\s*(?:=>|function)/);
        } else if (lang === 'typescript' || lang === 'ts') {
            ext = '.ts';
            match = code.match(/function\s+([a-zA-Z0-9_]+)/) || code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/) || code.match(/interface\s+([A-Z][a-zA-Z0-9_]*)/);
        } else if (lang === 'java') {
            ext = '.java';
            match = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/) || code.match(/interface\s+([A-Z][a-zA-Z0-9_]*)/);
        } else if (lang === 'kotlin' || lang === 'kt') {
            ext = '.kt';
            match = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/) || code.match(/fun\s+([a-zA-Z0-9_]+)/);
        } else if (lang === 'python' || lang === 'py') {
            ext = '.py';
            match = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/) || code.match(/def\s+([a-zA-Z0-9_]+)/);
        } else if (lang === 'csharp' || lang === 'cs') {
            ext = '.cs';
            match = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/);
        } else if (lang === 'cpp' || lang === 'c++') {
            ext = '.cpp';
            match = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/);
        } else if (lang === 'php') {
            ext = '.php';
            match = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/) || code.match(/function\s+([a-zA-Z0-9_]+)/);
        } else if (lang === 'ruby' || lang === 'rb') {
            ext = '.rb';
            match = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/) || code.match(/def\s+([a-zA-Z0-9_]+)/);
        } else if (lang === 'go') {
            ext = '.go';
            match = code.match(/func\s+([a-zA-Z0-9_]+)/) || code.match(/type\s+([A-Z][a-zA-Z0-9_]*)\s+struct/);
        } else if (lang === 'rust' || lang === 'rs') {
            ext = '.rs';
            match = code.match(/fn\s+([a-zA-Z0-9_]+)/) || code.match(/struct\s+([A-Z][a-zA-Z0-9_]*)/);
        } else if (lang === 'swift') {
            ext = '.swift';
            match = code.match(/class\s+([A-Z][a-zA-Z0-9_]*)/) || code.match(/struct\s+([A-Z][a-zA-Z0-9_]*)/) || code.match(/func\s+([a-zA-Z0-9_]+)/);
        }

        if (match && match[1]) {
            return match[1] + ext;
        }

        return null;
    }
}

window.CodeUtils = CodeUtils;