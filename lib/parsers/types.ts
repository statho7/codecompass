/**
 * Language Parser Interface
 * Defines the contract for parsing imports from different programming languages
 */

export interface LanguageParser {
  /** Language name (e.g., "JavaScript", "Python") */
  name: string

  /** File extensions this parser handles (e.g., [".js", ".ts"]) */
  extensions: string[]

  /** Patterns to exclude from file scanning (e.g., "node_modules", "__pycache__") */
  excludePatterns: string[]

  /**
   * Parse import statements from file content
   * @param content - The file content as a string
   * @param currentPath - The current file's path (for resolving relative imports)
   * @returns Array of resolved import paths
   */
  parseImports(content: string, currentPath: string): string[]

  /**
   * Resolve an import path to an actual file path
   * @param importPath - The import path as written in code
   * @param currentPath - The current file's path
   * @returns Resolved file path
   */
  resolveImportPath(importPath: string, currentPath: string): string

  /**
   * Determine file type based on path conventions
   * @param path - The file path
   * @returns File type classification
   */
  getFileType(path: string): string
}

/**
 * Language configuration for detection and parsing
 */
export interface LanguageConfig {
  /** Primary identifier for the language */
  id: string

  /** Display name */
  displayName: string

  /** Alternative names used by GitHub API */
  aliases: string[]

  /** File extensions */
  extensions: string[]

  /** Patterns to exclude */
  excludePatterns: string[]

  /** File type classifications specific to this language */
  fileTypes: Record<string, string[]>

  /** Manifest files that indicate this language (e.g., package.json, requirements.txt) */
  manifestFiles: string[]
}

/**
 * Language detection result
 */
export interface LanguageDetection {
  /** Detected language ID */
  language: string

  /** Confidence score (0-1) */
  confidence: number

  /** Detection method used */
  method: "github-api" | "manifest" | "extension" | "manual"

  /** Additional metadata */
  metadata?: {
    /** Language statistics from GitHub */
    languageStats?: Record<string, number>

    /** Detected manifest files */
    manifestFiles?: string[]
  }
}
