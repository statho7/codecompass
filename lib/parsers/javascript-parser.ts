import { LanguageParser } from "./types"
import { getLanguageConfig } from "./language-configs"

/**
 * JavaScript/TypeScript Parser
 * Handles ES6 imports and module resolution for JS/TS files
 */
export class JavaScriptParser implements LanguageParser {
  name = "JavaScript/TypeScript"
  extensions: string[]
  excludePatterns: string[]
  private config

  constructor() {
    this.config = getLanguageConfig("javascript")!
    this.extensions = this.config.extensions
    this.excludePatterns = this.config.excludePatterns
  }

  /**
   * Parse ES6 import statements from JavaScript/TypeScript content
   * Matches patterns like:
   * - import foo from "path"
   * - import { foo } from "path"
   * - import * as foo from "path"
   * - import "path" (side-effect imports)
   * - export { foo } from "path" (re-exports)
   */
  parseImports(content: string, currentPath: string): string[] {
    const imports: string[] = []

    // Match ES6 imports: import X from "path" or import { X } from "path"
    const importRegex =
      /(?:import|export)\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?["']([^"']+)["']/g

    // Also match dynamic imports: import("path")
    const dynamicImportRegex = /import\s*\(\s*["']([^"']+)["']\s*\)/g

    // Process static imports and re-exports
    let match
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1]

      // Process internal imports (relative, alias, or monorepo packages)
      if (this.isInternalImport(importPath, currentPath)) {
        const resolvedPath = this.resolveImportPath(importPath, currentPath)
        imports.push(resolvedPath)
      }
    }

    // Process dynamic imports
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      const importPath = match[1]

      if (this.isInternalImport(importPath, currentPath)) {
        const resolvedPath = this.resolveImportPath(importPath, currentPath)
        imports.push(resolvedPath)
      }
    }

    return imports
  }

  /**
   * Determine if an import is internal to the project
   * Handles:
   * - Relative imports (./foo, ../bar)
   * - Path aliases (@/, ~/)
   * - Monorepo packages (packages/*)
   */
  private isInternalImport(importPath: string, currentPath: string): boolean {
    // Relative imports
    if (importPath.startsWith(".")) {
      return true
    }

    // Common path aliases
    if (importPath.startsWith("@/") || importPath.startsWith("~/")) {
      return true
    }

    // Monorepo internal packages (e.g., packages/foo, apps/bar)
    // Check if the import starts with a known package that exists in the repo
    // For Next.js specifically, check for packages/* imports
    if (currentPath.includes("packages/") || currentPath.includes("apps/")) {
      // If we're in a monorepo, treat non-scoped package names as potentially internal
      // This catches cases like "next/server" when analyzing the Next.js repo itself
      const parts = importPath.split("/")
      const packageName = parts[0]

      // If the package name matches a directory in packages/ or apps/, it's internal
      // This will be validated during path resolution
      if (!packageName.startsWith("@") && packageName !== "." && packageName !== "..") {
        return true
      }
    }

    return false
  }

  /**
   * Resolve import path to actual file path
   * Handles:
   * - Relative imports (./foo, ../bar)
   * - Path aliases (@/components/foo, ~/utils/bar)
   * - Monorepo package imports (packages/foo/bar)
   * - Missing extensions
   */
  resolveImportPath(importPath: string, currentPath: string): string {
    let resolvedPath = importPath

    // Handle path aliases (@/ -> root, ~/ -> root)
    if (importPath.startsWith("@/")) {
      resolvedPath = importPath.replace("@/", "")
    } else if (importPath.startsWith("~/")) {
      resolvedPath = importPath.replace("~/", "")
    }
    // Handle relative imports
    else if (importPath.startsWith("./") || importPath.startsWith("../")) {
      const currentDir = currentPath.split("/").slice(0, -1).join("/")
      resolvedPath = this.normalizePath(currentDir, importPath)
    }
    // Handle potential monorepo package imports
    else if (currentPath.includes("packages/") || currentPath.includes("apps/")) {
      // For monorepo imports, try to resolve to packages/ directory
      // e.g., "next/server" in Next.js repo -> "packages/next/server"
      const parts = importPath.split("/")
      const packageName = parts[0]

      // Try packages/ prefix first
      resolvedPath = `packages/${importPath}`
    }

    // Don't auto-add extension here - let matchImportToFile handle it
    // This allows for better matching logic with multiple extension attempts
    return resolvedPath
  }

  /**
   * Normalize relative path by resolving . and .. segments
   */
  private normalizePath(currentDir: string, relativePath: string): string {
    const parts = currentDir.split("/").filter(Boolean)
    const relativeParts = relativePath.split("/")

    for (const part of relativeParts) {
      if (part === "..") {
        parts.pop()
      } else if (part !== ".") {
        parts.push(part)
      }
    }

    return parts.join("/")
  }

  /**
   * Determine file type based on path conventions
   * Recognizes Next.js/React project structure
   */
  getFileType(path: string): string {
    const fileTypes = this.config.fileTypes

    // Check each file type's patterns
    for (const [type, patterns] of Object.entries(fileTypes)) {
      for (const pattern of patterns) {
        if (path.includes(pattern)) {
          return type
        }
      }
    }

    return "other"
  }

  /**
   * Match import path against available file paths
   * Handles variations in extensions and index files
   * Also handles monorepo package resolution
   */
  matchImportToFile(importPath: string, availableFiles: string[]): string | null {
    // Try exact match first
    if (availableFiles.includes(importPath)) {
      return importPath
    }

    // Try with different extensions
    const withoutExt = importPath.replace(/\.(tsx?|jsx?|mjs|cjs)$/, "")
    const variations = [
      // Try common extensions first
      `${withoutExt}.ts`,
      `${withoutExt}.tsx`,
      `${withoutExt}.js`,
      `${withoutExt}.jsx`,
      `${withoutExt}.mjs`,
      `${withoutExt}.cjs`,
      // Try index files
      `${withoutExt}/index.ts`,
      `${withoutExt}/index.tsx`,
      `${withoutExt}/index.js`,
      `${withoutExt}/index.jsx`,
      `${withoutExt}/index.mjs`,
      `${withoutExt}/index.cjs`,
    ]

    for (const variation of variations) {
      if (availableFiles.includes(variation)) {
        return variation
      }
    }

    // For monorepo imports, also try without packages/ prefix
    // In case the import was "packages/foo" but files are listed as just "foo"
    if (importPath.startsWith("packages/")) {
      const withoutPackages = importPath.replace(/^packages\//, "")
      const result = this.matchImportToFile(withoutPackages, availableFiles)
      if (result) return result
    }

    // Try with apps/ prefix for monorepo apps
    if (!importPath.startsWith("apps/") && !importPath.startsWith("packages/")) {
      const withApps = `apps/${importPath}`
      const result = this.matchImportToFile(withApps, availableFiles)
      if (result) return result
    }

    return null
  }
}
