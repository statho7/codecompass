import { LanguageParser } from "./types"
import { getLanguageConfig } from "./language-configs"

/**
 * Python Parser
 * Handles Python import statements and module resolution
 */
export class PythonParser implements LanguageParser {
  name = "Python"
  extensions: string[]
  excludePatterns: string[]
  private config

  constructor() {
    this.config = getLanguageConfig("python")!
    this.extensions = this.config.extensions
    this.excludePatterns = this.config.excludePatterns
  }

  /**
   * Parse Python import statements
   * Matches patterns like:
   * - import module
   * - import module.submodule
   * - from module import name
   * - from . import name (relative)
   * - from .. import name (parent relative)
   * - from .module import name
   */
  parseImports(content: string, currentPath: string): string[] {
    const imports: string[] = []

    // Match: import module.submodule as alias
    const simpleImportRegex = /^import\s+([\w.]+)(?:\s+as\s+\w+)?$/gm

    // Match: from module.submodule import name
    const fromImportRegex = /^from\s+([\w.]+)\s+import\s+/gm

    // Match: from . import name (relative)
    // Match: from .. import name (parent relative)
    // Match: from .module import name
    const relativeImportRegex = /^from\s+(\.+[\w.]*)\s+import\s+/gm

    // Parse simple imports: import foo.bar
    let match
    while ((match = simpleImportRegex.exec(content)) !== null) {
      const modulePath = match[1]

      // Skip standard library and third-party packages
      // We only want project-local imports
      if (this.isExternalModule(modulePath)) {
        continue
      }

      const resolvedPath = this.resolveImportPath(modulePath, currentPath)
      if (resolvedPath) {
        imports.push(resolvedPath)
      }
    }

    // Parse from imports: from foo.bar import baz
    while ((match = fromImportRegex.exec(content)) !== null) {
      const modulePath = match[1]

      if (this.isExternalModule(modulePath)) {
        continue
      }

      const resolvedPath = this.resolveImportPath(modulePath, currentPath)
      if (resolvedPath) {
        imports.push(resolvedPath)
      }
    }

    // Parse relative imports: from . import foo, from ..bar import baz
    while ((match = relativeImportRegex.exec(content)) !== null) {
      const relativePath = match[1]
      const resolvedPath = this.resolveRelativeImport(relativePath, currentPath)
      if (resolvedPath) {
        imports.push(resolvedPath)
      }
    }

    return imports
  }

  /**
   * Resolve absolute module path to file path
   * Converts module.submodule to module/submodule.py or module/submodule/__init__.py
   */
  resolveImportPath(modulePath: string, currentPath: string): string | null {
    // Convert dots to slashes: foo.bar.baz -> foo/bar/baz
    const filePath = modulePath.replace(/\./g, "/")

    // Python imports can refer to either:
    // 1. A .py file: foo/bar/baz.py
    // 2. A package: foo/bar/baz/__init__.py
    // We'll default to .py file (the resolver will try both)

    return filePath + ".py"
  }

  /**
   * Resolve relative imports
   * . = current package
   * .. = parent package
   * ...module = great-grandparent.module
   */
  private resolveRelativeImport(relativePath: string, currentPath: string): string | null {
    // Count leading dots
    const dotsMatch = relativePath.match(/^\.+/)
    if (!dotsMatch) return null

    const dotCount = dotsMatch[0].length
    const modulePart = relativePath.substring(dotCount)

    // Get current directory path
    const currentDir = currentPath.split("/").slice(0, -1)

    // Go up 'dotCount - 1' directories (. means current dir, .. means parent, etc.)
    const targetDir = currentDir.slice(0, currentDir.length - (dotCount - 1))

    if (targetDir.length === 0) {
      // Trying to go above root
      return null
    }

    // Build the target path
    let targetPath = targetDir.join("/")

    if (modulePart) {
      // from .module import foo -> current_dir/module.py
      const moduleFilePath = modulePart.replace(/\./g, "/")
      targetPath = targetPath + "/" + moduleFilePath + ".py"
    } else {
      // from . import foo -> current_dir/__init__.py
      targetPath = targetPath + "/__init__.py"
    }

    return targetPath
  }

  /**
   * Check if a module is external (standard library or third-party)
   * We use a heuristic: if it's a common standard library module, skip it
   */
  private isExternalModule(modulePath: string): boolean {
    // Common Python standard library modules (partial list)
    const stdLibModules = [
      "os",
      "sys",
      "re",
      "json",
      "math",
      "time",
      "datetime",
      "collections",
      "itertools",
      "functools",
      "pathlib",
      "typing",
      "asyncio",
      "urllib",
      "http",
      "logging",
      "unittest",
      "pytest",
      "abc",
      "io",
      "csv",
      "random",
      "string",
      "copy",
      "pickle",
      "subprocess",
      "threading",
      "multiprocessing",
    ]

    // Common third-party packages
    const commonPackages = [
      "django",
      "flask",
      "fastapi",
      "requests",
      "numpy",
      "pandas",
      "sqlalchemy",
      "pydantic",
      "pytest",
      "click",
      "boto3",
      "celery",
      "redis",
    ]

    const topLevelModule = modulePath.split(".")[0]

    return stdLibModules.includes(topLevelModule) || commonPackages.includes(topLevelModule)
  }

  /**
   * Determine file type based on path conventions
   * Recognizes Django, Flask, and common Python project structures
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
   * Handles __init__.py files and package structures
   */
  matchImportToFile(importPath: string, availableFiles: string[]): string | null {
    // Try exact match first
    if (availableFiles.includes(importPath)) {
      return importPath
    }

    // Try with .py extension if not present
    if (!importPath.endsWith(".py")) {
      const withPy = importPath + ".py"
      if (availableFiles.includes(withPy)) {
        return withPy
      }
    }

    // Try as package (with __init__.py)
    const asPackage = importPath.replace(/\.py$/, "") + "/__init__.py"
    if (availableFiles.includes(asPackage)) {
      return asPackage
    }

    // Try variations with different extensions
    const withoutExt = importPath.replace(/\.pyi?$/, "")
    const variations = [`${withoutExt}.py`, `${withoutExt}.pyi`, `${withoutExt}/__init__.py`]

    for (const variation of variations) {
      if (availableFiles.includes(variation)) {
        return variation
      }
    }

    return null
  }
}
