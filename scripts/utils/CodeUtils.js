/**
 * @fileoverview Utilities for code block processing.
 * @copyright (c) 2026 Fertwbr
 */

/**
 * Utility class for parsing and cleaning code strings.
 */
class CodeUtils {
    /**
     * Cleans the text content by removing known UI injected strings.
     * @param {string} text The raw text content.
     * @returns {string} The cleaned text.
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
     * Maps a language name to its corresponding Google Material Symbol icon name.
     * @param {string} lang The programming language name.
     * @returns {string} The Material Symbol icon name.
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
     * Extracts a potential file name from code content based on language heuristics.
     * @param {string} code The code content.
     * @param {string} language The language of the code.
     * @returns {string|null} The extracted file name or null.
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