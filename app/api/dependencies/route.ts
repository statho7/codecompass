import { type NextRequest, NextResponse } from "next/server"
import { languageDetector, parserRegistry } from "@/lib/parsers"

interface FileNode {
  path: string
  type: string
  imports: string[]
  importedBy: string[]
}

interface DependencyGraph {
  nodes: FileNode[]
  edges: Array<{ source: string; target: string }>
  metadata?: {
    language: string
    detectionMethod: string
    confidence: number
  }
  warnings?: string[]
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")
  const manualLanguage = searchParams.get("lang") // Optional manual language override

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 })
    }

    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, "")

    const headers: HeadersInit = {
      Accept: "application/vnd.github.v3+json",
    }

    // Only add authorization if token is valid (not expired/revoked)
    if (process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.length > 10) {
      headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`
      console.log("[v0] Using GitHub token for authentication")
    } else {
      console.log("[v0] No GitHub token configured, using unauthenticated requests (lower rate limits)")
    }

    // Fetch directory tree - try multiple default branches
    let tree: Array<{ path: string; type: string; sha: string }> = []
    let isTruncated = false
    const warnings: string[] = []
    const branchesToTry = ["main", "master", "canary", "develop"]

    let treeData: any = null
    let authFailed = false

    for (const branch of branchesToTry) {
      try {
        const treeRes = await fetch(
          `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${branch}?recursive=1`,
          { headers }
        )

        if (treeRes.ok) {
          treeData = await treeRes.json()
          tree = treeData.tree || []
          isTruncated = treeData.truncated || false
          console.log(`[v0] Successfully fetched tree from branch: ${branch}`)
          break
        } else if (treeRes.status === 401 && headers["Authorization"] && !authFailed) {
          // Auth failed, try without token
          console.warn("[v0] GitHub token authentication failed (401), retrying without authentication")
          authFailed = true
          delete headers["Authorization"]
          // Retry the same branch without auth
          const retryRes = await fetch(
            `https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${branch}?recursive=1`,
            { headers }
          )
          if (retryRes.ok) {
            treeData = await retryRes.json()
            tree = treeData.tree || []
            isTruncated = treeData.truncated || false
            console.log(`[v0] Successfully fetched tree from branch: ${branch} (without auth)`)
            break
          }
        } else {
          const errorData = await treeRes.json().catch(() => null)
          console.log(`[v0] Branch ${branch} not found or inaccessible: ${treeRes.status}`, errorData?.message)
        }
      } catch (e) {
        console.log(`[v0] Error fetching branch ${branch}:`, e)
      }
    }

    if (tree.length === 0) {
      console.error(`[v0] Failed to fetch repository tree from any branch`)
      warnings.push(
        "Could not fetch repository tree. The repository may be private, empty, or the GitHub API may be rate limited."
      )
    }

    if (isTruncated) {
      console.warn(`[v0] GitHub tree is truncated for ${owner}/${cleanRepo}. Repository has >7,000 files.`)
      warnings.push(
        "Repository is very large (>7,000 files). Analysis may be incomplete. Consider analyzing a specific subdirectory or package."
      )
    }

    console.log(`[v0] Fetched ${tree.length} files from repository tree${isTruncated ? " (truncated)" : ""}`)

    // Auto-detect language or use manual override
    let languageDetection
    if (manualLanguage) {
      languageDetection = {
        language: manualLanguage.toLowerCase(),
        confidence: 1.0,
        method: "manual" as const,
      }
    } else {
      languageDetection = await languageDetector.detectLanguage(owner, cleanRepo, headers, tree)
    }

    console.log(
      `[v0] Detected language: ${languageDetection.language} (${languageDetection.method}, confidence: ${languageDetection.confidence})`,
    )

    // Get the appropriate parser for the detected language
    const parser = parserRegistry.getParser(languageDetection.language)

    console.log(`[v0] Using parser: ${parser.name}`)

    // Build regex pattern for file extensions
    const extensionPattern = new RegExp(`(${parser.extensions.map((ext) => ext.replace(".", "\\.")).join("|")})$`)

    // Filter files based on language-specific criteria
    const codeFiles = tree
      .filter((item) => {
        if (item.type !== "blob") return false

        // Check if file has the right extension
        if (!extensionPattern.test(item.path)) return false

        // Check exclude patterns
        for (const pattern of parser.excludePatterns) {
          if (item.path.includes(pattern)) return false
        }

        return true
      })
      .slice(0, 200) // Limit to 200 files for performance

    console.log(`[v0] Filtered to ${codeFiles.length} code files for analysis`)

    if (codeFiles.length === 0) {
      warnings.push("No code files found matching the detected language. The repository might be empty or use a different structure.")
    } else if (codeFiles.length === 200) {
      warnings.push(`Analysis limited to 200 files. Repository contains more files than can be efficiently analyzed.`)
    }

    // Fetch content for each file
    let skippedLargeFiles = 0
    let failedFetches = 0

    const fileContents = await Promise.all(
      codeFiles.map(async (file) => {
        try {
          const contentRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents/${file.path}`, {
            headers,
          })
          if (contentRes.ok) {
            const data = await contentRes.json()
            // Only process files under 50KB
            if (data.size < 50000) {
              const content = Buffer.from(data.content, "base64").toString("utf-8")
              return { path: file.path, content }
            } else {
              skippedLargeFiles++
            }
          } else {
            failedFetches++
            console.warn(`[v0] Failed to fetch ${file.path}: ${contentRes.status}`)
          }
        } catch (e) {
          failedFetches++
          console.error(`[v0] Error fetching ${file.path}:`, e)
        }
        return { path: file.path, content: "" }
      }),
    )

    console.log(`[v0] Successfully fetched ${fileContents.filter(f => f.content).length} files`)
    if (skippedLargeFiles > 0) {
      console.log(`[v0] Skipped ${skippedLargeFiles} files over 50KB`)
      warnings.push(`Skipped ${skippedLargeFiles} large files (>50KB) to improve performance.`)
    }
    if (failedFetches > 0) {
      console.log(`[v0] Failed to fetch ${failedFetches} files`)
      warnings.push(`Failed to fetch ${failedFetches} files. This may be due to rate limiting or permissions.`)
    }

    // Build dependency graph
    const nodes: Map<string, FileNode> = new Map()

    // Initialize all nodes
    for (const file of fileContents) {
      nodes.set(file.path, {
        path: file.path,
        type: parser.getFileType(file.path),
        imports: [],
        importedBy: [],
      })
    }

    // Parse imports and build edges
    const edges: Array<{ source: string; target: string }> = []
    const availableFilePaths = Array.from(nodes.keys())

    for (const file of fileContents) {
      if (!file.content) continue

      const imports = parser.parseImports(file.content, file.path)
      const node = nodes.get(file.path)

      if (node) {
        for (const importPath of imports) {
          // Use parser-specific matching logic
          let matchingPath: string | null = null

          // Try parser's matchImportToFile if available
          if ("matchImportToFile" in parser && typeof parser.matchImportToFile === "function") {
            matchingPath = parser.matchImportToFile(importPath, availableFilePaths)
          } else {
            // Fallback to exact match
            matchingPath = availableFilePaths.find((p) => p === importPath) || null
          }

          if (matchingPath) {
            node.imports.push(matchingPath)
            const targetNode = nodes.get(matchingPath)
            if (targetNode) {
              targetNode.importedBy.push(file.path)
            }
            edges.push({ source: file.path, target: matchingPath })
          }
        }
      }
    }

    console.log(`[v0] Built dependency graph with ${nodes.size} nodes and ${edges.length} edges`)

    // Calculate some statistics
    const nodesWithImports = Array.from(nodes.values()).filter((n) => n.imports.length > 0).length
    const isolatedNodes = Array.from(nodes.values()).filter((n) => n.imports.length === 0 && n.importedBy.length === 0)
      .length

    console.log(`[v0] Nodes with imports: ${nodesWithImports}, Isolated nodes: ${isolatedNodes}`)

    if (isolatedNodes > nodes.size * 0.8) {
      warnings.push(
        `Most files (${isolatedNodes}/${nodes.size}) appear isolated. This might indicate import resolution issues or that the repository structure is not well-suited for dependency analysis.`
      )
    }

    const graph: DependencyGraph = {
      nodes: Array.from(nodes.values()),
      edges,
      metadata: {
        language: languageDetection.language,
        detectionMethod: languageDetection.method,
        confidence: languageDetection.confidence,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    }

    return NextResponse.json(graph)
  } catch (error) {
    console.error("[v0] Dependencies API error:", error)
    return NextResponse.json({ error: "Failed to build dependency graph" }, { status: 500 })
  }
}
