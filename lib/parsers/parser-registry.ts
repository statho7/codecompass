import { LanguageParser } from "./types"
import { JavaScriptParser } from "./javascript-parser"
import { PythonParser } from "./python-parser"

/**
 * Parser Registry
 * Central registry for all language parsers
 */

export class ParserRegistry {
  private parsers: Map<string, LanguageParser>

  constructor() {
    this.parsers = new Map()
    this.registerDefaultParsers()
  }

  /**
   * Register default parsers
   */
  private registerDefaultParsers(): void {
    const jsParser = new JavaScriptParser()
    const pyParser = new PythonParser()

    // Register JavaScript parser with all its aliases
    this.parsers.set("javascript", jsParser)
    this.parsers.set("typescript", jsParser)
    this.parsers.set("js", jsParser)
    this.parsers.set("ts", jsParser)
    this.parsers.set("jsx", jsParser)
    this.parsers.set("tsx", jsParser)

    // Register Python parser
    this.parsers.set("python", pyParser)
    this.parsers.set("py", pyParser)

    // TODO: Add more parsers as they're implemented
    // this.parsers.set("go", new GoParser())
    // this.parsers.set("rust", new RustParser())
    // this.parsers.set("java", new JavaParser())
  }

  /**
   * Get parser for a specific language
   * Falls back to JavaScript parser if language not found
   */
  getParser(languageId: string): LanguageParser {
    const parser = this.parsers.get(languageId.toLowerCase())

    if (parser) {
      return parser
    }

    // Fallback to JavaScript parser
    console.warn(`No parser found for language: ${languageId}, falling back to JavaScript parser`)
    return this.parsers.get("javascript")!
  }

  /**
   * Check if a parser exists for a language
   */
  hasParser(languageId: string): boolean {
    return this.parsers.has(languageId.toLowerCase())
  }

  /**
   * Get all supported language IDs
   */
  getSupportedLanguages(): string[] {
    return Array.from(new Set(this.parsers.keys()))
  }

  /**
   * Register a custom parser
   * Useful for extending with new languages
   */
  registerParser(languageId: string, parser: LanguageParser): void {
    this.parsers.set(languageId.toLowerCase(), parser)
  }
}

// Singleton instance
export const parserRegistry = new ParserRegistry()
