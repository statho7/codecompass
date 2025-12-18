import { LanguageConfig, LanguageDetection } from "./types"
import { LANGUAGE_CONFIGS } from "./language-configs"

/**
 * Language Detection System
 * Auto-detects the primary programming language of a GitHub repository
 */

interface GitHubTreeItem {
  path: string
  type: string
  sha: string
}

export class LanguageDetector {
  private configs: Map<string, LanguageConfig>

  constructor() {
    // Build a map of language configs for quick lookup
    this.configs = new Map()
    LANGUAGE_CONFIGS.forEach((config) => {
      this.configs.set(config.id, config)
      // Also map aliases
      config.aliases.forEach((alias) => {
        this.configs.set(alias.toLowerCase(), config)
      })
    })
  }

  /**
   * Detect language from GitHub repository
   * Uses multiple detection methods in priority order:
   * 1. GitHub Languages API (most accurate)
   * 2. Manifest file detection
   * 3. File extension analysis
   */
  async detectLanguage(
    owner: string,
    repo: string,
    headers: HeadersInit,
    tree?: GitHubTreeItem[],
  ): Promise<LanguageDetection> {
    // Method 1: Try GitHub Languages API
    try {
      const detection = await this.detectFromGitHubAPI(owner, repo, headers)
      if (detection) return detection
    } catch (error) {
      console.warn("GitHub API language detection failed:", error)
    }

    // Method 2: Try manifest file detection
    if (tree) {
      const detection = this.detectFromManifests(tree)
      if (detection) return detection
    }

    // Method 3: Fallback to extension analysis
    if (tree) {
      const detection = this.detectFromExtensions(tree)
      if (detection) return detection
    }

    // Default fallback to JavaScript
    return {
      language: "javascript",
      confidence: 0.3,
      method: "manual",
    }
  }

  /**
   * Detect language using GitHub's Languages API
   * This is the most accurate method as it uses GitHub's linguist analysis
   */
  private async detectFromGitHubAPI(
    owner: string,
    repo: string,
    headers: HeadersInit,
  ): Promise<LanguageDetection | null> {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, {
        headers,
      })

      if (!response.ok) {
        return null
      }

      const languages: Record<string, number> = await response.json()

      // Calculate total bytes
      const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)

      if (totalBytes === 0) {
        return null
      }

      // Find the dominant language (most bytes)
      const sortedLanguages = Object.entries(languages).sort(([, a], [, b]) => b - a)

      const [primaryLanguage, primaryBytes] = sortedLanguages[0]
      const confidence = primaryBytes / totalBytes

      // Map GitHub language name to our language ID
      const languageId = this.mapGitHubLanguageToId(primaryLanguage)

      return {
        language: languageId,
        confidence,
        method: "github-api",
        metadata: {
          languageStats: languages,
        },
      }
    } catch (error) {
      console.error("Error fetching GitHub languages:", error)
      return null
    }
  }

  /**
   * Detect language by looking for manifest files
   * e.g., package.json → JavaScript, requirements.txt → Python
   */
  private detectFromManifests(tree: GitHubTreeItem[]): LanguageDetection | null {
    const filePaths = tree.filter((item) => item.type === "blob").map((item) => item.path.toLowerCase())

    const detectedManifests: Array<{ language: string; file: string }> = []

    // Check each language's manifest files
    for (const config of LANGUAGE_CONFIGS) {
      for (const manifestFile of config.manifestFiles) {
        if (filePaths.includes(manifestFile.toLowerCase())) {
          detectedManifests.push({
            language: config.id,
            file: manifestFile,
          })
        }
      }
    }

    if (detectedManifests.length === 0) {
      return null
    }

    // If multiple manifests found, prioritize by order in config
    // (configs are ordered by popularity/priority)
    const primaryManifest = detectedManifests[0]

    return {
      language: primaryManifest.language,
      confidence: 0.8,
      method: "manifest",
      metadata: {
        manifestFiles: detectedManifests.map((m) => m.file),
      },
    }
  }

  /**
   * Detect language by analyzing file extension distribution
   * Counts files by extension and determines dominant language
   */
  private detectFromExtensions(tree: GitHubTreeItem[]): LanguageDetection | null {
    const extensionCounts: Record<string, number> = {}

    // Count files by extension
    for (const item of tree) {
      if (item.type !== "blob") continue

      const ext = this.getExtension(item.path)
      if (ext) {
        extensionCounts[ext] = (extensionCounts[ext] || 0) + 1
      }
    }

    // Map extensions to languages and count
    const languageCounts: Record<string, number> = {}

    for (const [ext, count] of Object.entries(extensionCounts)) {
      const languageId = this.findLanguageByExtension(ext)
      if (languageId) {
        languageCounts[languageId] = (languageCounts[languageId] || 0) + count
      }
    }

    if (Object.keys(languageCounts).length === 0) {
      return null
    }

    // Find dominant language
    const sortedLanguages = Object.entries(languageCounts).sort(([, a], [, b]) => b - a)

    const [primaryLanguage, primaryCount] = sortedLanguages[0]
    const totalFiles = Object.values(languageCounts).reduce((sum, count) => sum + count, 0)
    const confidence = primaryCount / totalFiles

    return {
      language: primaryLanguage,
      confidence,
      method: "extension",
    }
  }

  /**
   * Map GitHub language names to our internal language IDs
   */
  private mapGitHubLanguageToId(githubLanguage: string): string {
    const normalized = githubLanguage.toLowerCase()

    // Check if it directly matches an ID or alias
    const config = this.configs.get(normalized)
    if (config) {
      return config.id
    }

    // Manual mappings for special cases
    const mappings: Record<string, string> = {
      typescript: "javascript", // Use same parser
      tsx: "javascript",
      jsx: "javascript",
      "c++": "cpp",
      "c#": "csharp",
    }

    return mappings[normalized] || normalized
  }

  /**
   * Find language by file extension
   */
  private findLanguageByExtension(extension: string): string | null {
    for (const config of LANGUAGE_CONFIGS) {
      if (config.extensions.includes(extension)) {
        return config.id
      }
    }
    return null
  }

  /**
   * Get file extension from path
   */
  private getExtension(path: string): string | null {
    const match = path.match(/(\.[^/.]+)$/)
    return match ? match[1] : null
  }

  /**
   * Get language config by ID
   */
  getConfig(languageId: string): LanguageConfig | undefined {
    return this.configs.get(languageId.toLowerCase())
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageConfig[] {
    return LANGUAGE_CONFIGS
  }
}

// Singleton instance
export const languageDetector = new LanguageDetector()
