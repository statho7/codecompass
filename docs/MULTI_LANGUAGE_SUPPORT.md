# Multi-Language Support Architecture

This document explains how CodeCompass supports dependency graph generation for multiple programming languages.

## Overview

The dependency graph system is designed with a **plugin-based parser architecture** that allows easy addition of new programming languages without modifying core logic.

## Architecture Components

### 1. Language Parser Interface ([lib/parsers/types.ts](../lib/parsers/types.ts))

All language parsers implement the `LanguageParser` interface:

```typescript
interface LanguageParser {
  name: string                    // Display name (e.g., "Python")
  extensions: string[]            // File extensions (e.g., [".py", ".pyi"])
  excludePatterns: string[]       // Patterns to skip (e.g., "__pycache__")

  parseImports(content: string, currentPath: string): string[]
  resolveImportPath(importPath: string, currentPath: string): string
  getFileType(path: string): string
}
```

### 2. Language Detection System ([lib/parsers/language-detector.ts](../lib/parsers/language-detector.ts))

The `LanguageDetector` class automatically identifies a repository's primary language using:

**Detection Methods (in priority order):**

1. **GitHub Languages API** (Most accurate)
   - Uses GitHub's linguist analysis
   - Returns language statistics by byte count
   - Confidence score = (primary language bytes / total bytes)

2. **Manifest File Detection**
   - Looks for language-specific files:
     - `package.json` → JavaScript
     - `requirements.txt` → Python
     - `go.mod` → Go
     - `Cargo.toml` → Rust
   - Confidence score: 0.8

3. **File Extension Analysis** (Fallback)
   - Counts files by extension
   - Maps extensions to languages
   - Confidence score = (primary language files / total code files)

**Manual Override:**
```
GET /api/dependencies?url=github.com/user/repo&lang=python
```

### 3. Language Configurations ([lib/parsers/language-configs.ts](../lib/parsers/language-configs.ts))

Each supported language has a configuration defining:

```typescript
interface LanguageConfig {
  id: string                      // Identifier (e.g., "python")
  displayName: string             // Human-readable name
  aliases: string[]               // Alternative names
  extensions: string[]            // File extensions
  excludePatterns: string[]       // Directories/files to skip
  fileTypes: Record<string, string[]>  // Path patterns for categorization
  manifestFiles: string[]         // Files that indicate this language
}
```

**Example (Python):**
```typescript
{
  id: "python",
  displayName: "Python",
  aliases: ["py"],
  extensions: [".py", ".pyi", ".pyw"],
  excludePatterns: ["__pycache__", ".pyc", "venv/"],
  manifestFiles: ["requirements.txt", "setup.py", "pyproject.toml"],
  fileTypes: {
    model: ["/models/", "_model.py"],
    view: ["/views/", "_view.py"],
    util: ["/utils/", "_utils.py"],
    // ...
  }
}
```

### 4. Parser Implementations

#### JavaScript/TypeScript Parser ([lib/parsers/javascript-parser.ts](../lib/parsers/javascript-parser.ts))

**Supported Import Patterns:**
```javascript
import foo from "path"
import { foo, bar } from "path"
import * as foo from "path"
import "path"  // side-effect imports
```

**Features:**
- ES6 import statement parsing via regex
- Path alias resolution (`@/` → root)
- Relative import resolution (`./`, `../`)
- Extension inference (.tsx, .ts, .jsx, .js)
- Index file detection (`/index.*`)

#### Python Parser ([lib/parsers/python-parser.ts](../lib/parsers/python-parser.ts))

**Supported Import Patterns:**
```python
import module
import module.submodule
from module import name
from . import name          # relative import (current package)
from .. import name         # relative import (parent package)
from .module import name    # relative import with module
```

**Features:**
- Standard library detection (skips os, sys, etc.)
- Third-party package detection (skips django, flask, etc.)
- Relative import resolution (`.`, `..`, `...`)
- Module-to-path conversion (`foo.bar` → `foo/bar.py`)
- `__init__.py` package detection

### 5. Parser Registry ([lib/parsers/parser-registry.ts](../lib/parsers/parser-registry.ts))

Central registry for all parsers with fallback support:

```typescript
const parserRegistry = new ParserRegistry()

// Get parser for a language (falls back to JavaScript)
const parser = parserRegistry.getParser("python")

// Check if parser exists
if (parserRegistry.hasParser("rust")) { ... }
```

## API Flow

The dependency graph API endpoint ([app/api/dependencies/route.ts](../app/api/dependencies/route.ts)) uses this system:

```typescript
// 1. Auto-detect or use manual language
const languageDetection = manualLanguage
  ? { language: manualLanguage, method: "manual", confidence: 1.0 }
  : await languageDetector.detectLanguage(owner, repo, headers, tree)

// 2. Get appropriate parser
const parser = parserRegistry.getParser(languageDetection.language)

// 3. Filter files using parser's extensions and exclude patterns
const codeFiles = tree.filter(item =>
  parser.extensions.some(ext => item.path.endsWith(ext)) &&
  !parser.excludePatterns.some(pattern => item.path.includes(pattern))
)

// 4. Parse imports using parser
const imports = parser.parseImports(fileContent, filePath)

// 5. Classify files using parser
const fileType = parser.getFileType(filePath)

// 6. Return graph with metadata
return {
  nodes,
  edges,
  metadata: {
    language: languageDetection.language,
    detectionMethod: languageDetection.method,
    confidence: languageDetection.confidence
  }
}
```

## Adding a New Language

To add support for a new language, follow these steps:

### Step 1: Add Language Configuration

Edit [lib/parsers/language-configs.ts](../lib/parsers/language-configs.ts):

```typescript
{
  id: "go",
  displayName: "Go",
  aliases: ["golang"],
  extensions: [".go"],
  excludePatterns: ["/vendor/", "_test.go"],
  manifestFiles: ["go.mod", "go.sum"],
  fileTypes: {
    handler: ["/handlers/", "_handler.go"],
    model: ["/models/", "_model.go"],
    // ...
  }
}
```

### Step 2: Implement Parser Class

Create `lib/parsers/go-parser.ts`:

```typescript
import { LanguageParser } from "./types"
import { getLanguageConfig } from "./language-configs"

export class GoParser implements LanguageParser {
  name = "Go"
  extensions: string[]
  excludePatterns: string[]
  private config

  constructor() {
    this.config = getLanguageConfig("go")!
    this.extensions = this.config.extensions
    this.excludePatterns = this.config.excludePatterns
  }

  parseImports(content: string, currentPath: string): string[] {
    const imports: string[] = []

    // Single import: import "package/path"
    const singleImportRegex = /^import\s+"([^"]+)"$/gm

    // Multi-line imports: import ( ... )
    const multiImportRegex = /import\s*\(([^)]+)\)/gs

    // Parse and resolve imports...

    return imports
  }

  resolveImportPath(importPath: string, currentPath: string): string {
    // Convert Go import path to file path
    // Check if internal (matches module path from go.mod)
    // ...
  }

  getFileType(path: string): string {
    // Use config.fileTypes to classify
    // ...
  }

  matchImportToFile(importPath: string, availableFiles: string[]): string | null {
    // Match Go import paths to actual .go files
    // ...
  }
}
```

### Step 3: Register Parser

Edit [lib/parsers/parser-registry.ts](../lib/parsers/parser-registry.ts):

```typescript
import { GoParser } from "./go-parser"

private registerDefaultParsers(): void {
  // ... existing parsers

  const goParser = new GoParser()
  this.parsers.set("go", goParser)
  this.parsers.set("golang", goParser)
}
```

### Step 4: Export from Index

Edit [lib/parsers/index.ts](../lib/parsers/index.ts):

```typescript
export { GoParser } from "./go-parser"
```

### Step 5: Test

Test with a Go repository:
```bash
# Auto-detection
curl "http://localhost:3000/api/dependencies?url=github.com/gin-gonic/gin"

# Manual override
curl "http://localhost:3000/api/dependencies?url=github.com/gin-gonic/gin&lang=go"
```

## Testing Strategy

### Unit Tests (Recommended)

Create `lib/parsers/__tests__/go-parser.test.ts`:

```typescript
import { GoParser } from "../go-parser"

describe("GoParser", () => {
  const parser = new GoParser()

  test("parses simple import", () => {
    const content = 'import "fmt"'
    const imports = parser.parseImports(content, "main.go")
    expect(imports).toContain("fmt")
  })

  test("parses multi-line imports", () => {
    const content = `
      import (
        "fmt"
        "net/http"
      )
    `
    const imports = parser.parseImports(content, "main.go")
    expect(imports).toHaveLength(2)
  })
})
```

### Integration Tests

Test with real repositories:

1. **JavaScript/TypeScript**: [vercel/next.js](https://github.com/vercel/next.js)
2. **Python**: [django/django](https://github.com/django/django)
3. **Go**: [gin-gonic/gin](https://github.com/gin-gonic/gin)
4. **Rust**: [tokio-rs/tokio](https://github.com/tokio-rs/tokio)

## Performance Considerations

1. **File Limit**: Maximum 50 files analyzed to prevent API rate limits
2. **File Size Limit**: Maximum 50KB per file
3. **Regex Performance**: Use compiled regex patterns where possible
4. **Caching**: Consider adding Redis cache for language detection results

## Known Limitations

1. **No AST Parsing**: Uses regex instead of proper AST parsing for speed
   - May miss complex import patterns
   - Cannot handle dynamic imports

2. **External Module Detection**: Uses heuristics rather than parsing manifest files
   - May incorrectly classify some imports

3. **Monorepo Support**: Limited support for monorepos with multiple languages
   - Uses single language per repository

4. **Private Packages**: Cannot resolve imports from private packages
   - Only analyzes project-local imports

## Future Improvements

1. **AST-based Parsing**: Use language-specific parsers for accuracy
2. **Monorepo Support**: Detect and handle multiple languages
3. **Import Graph Depth**: Add option to control dependency depth
4. **Caching Layer**: Add Redis/memory cache for parsed results
5. **Incremental Updates**: Only re-parse changed files
6. **Error Recovery**: Better handling of malformed import statements

## Contributing

When contributing a new parser:

1. Follow the `LanguageParser` interface exactly
2. Add comprehensive tests for import parsing
3. Document language-specific quirks in comments
4. Update this documentation
5. Add language to README.md supported languages table

## References

- [GitHub Linguist](https://github.com/github-linguist/linguist) - Language detection
- [Tree-sitter](https://tree-sitter.github.io/) - Alternative parsing approach
- [RegexOne](https://regexone.com/) - Regex tutorial for import patterns
