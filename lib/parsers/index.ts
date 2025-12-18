/**
 * Language Parser System
 * Multi-language support for dependency graph generation
 */

export { LanguageParser, LanguageConfig, LanguageDetection } from "./types"
export { languageDetector, LanguageDetector } from "./language-detector"
export { parserRegistry, ParserRegistry } from "./parser-registry"
export { JavaScriptParser } from "./javascript-parser"
export { PythonParser } from "./python-parser"
export { LANGUAGE_CONFIGS, getLanguageConfig, getSupportedLanguageIds } from "./language-configs"
