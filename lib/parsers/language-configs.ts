import { LanguageConfig } from "./types"

/**
 * Language Configuration Database
 * Defines supported languages and their characteristics
 * Ordered by priority (most common first)
 */

export const LANGUAGE_CONFIGS: LanguageConfig[] = [
  {
    id: "javascript",
    displayName: "JavaScript/TypeScript",
    aliases: ["typescript", "tsx", "jsx", "js", "ts"],
    extensions: [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"],
    excludePatterns: ["node_modules", ".d.ts", ".test.", ".spec.", "dist/", "build/", ".next/"],
    manifestFiles: ["package.json", "tsconfig.json", "yarn.lock", "package-lock.json", "pnpm-lock.yaml"],
    fileTypes: {
      component: ["/components/", ".tsx", ".jsx"],
      api: ["/api/", "route.ts", "route.js"],
      util: ["/utils/", "/lib/", "/helpers/"],
      page: ["/app/", "/pages/", "page."],
      config: ["config", ".config."],
      style: [".css", ".scss", ".sass"],
      hook: ["/hooks/", "use"],
      service: ["/services/"],
      middleware: ["/middleware/", "middleware."],
      other: [],
    },
  },
  {
    id: "python",
    displayName: "Python",
    aliases: ["py"],
    extensions: [".py", ".pyi", ".pyw"],
    excludePatterns: ["__pycache__", ".pyc", ".pyo", ".pyd", "venv/", ".venv/", "env/", ".pytest_cache/", "dist/", "build/"],
    manifestFiles: ["requirements.txt", "setup.py", "pyproject.toml", "Pipfile", "poetry.lock", "setup.cfg"],
    fileTypes: {
      model: ["/models/", "_model.py", "/entities/"],
      view: ["/views/", "_view.py"],
      controller: ["/controllers/", "_controller.py"],
      service: ["/services/", "_service.py"],
      util: ["/utils/", "/helpers/", "_utils.py"],
      test: ["/tests/", "_test.py", "test_"],
      config: ["config.py", "settings.py"],
      api: ["/api/", "/endpoints/"],
      middleware: ["/middleware/"],
      other: [],
    },
  },
  {
    id: "go",
    displayName: "Go",
    aliases: ["golang"],
    extensions: [".go"],
    excludePatterns: ["/vendor/", "_test.go", "/testdata/"],
    manifestFiles: ["go.mod", "go.sum"],
    fileTypes: {
      handler: ["/handlers/", "/controllers/", "_handler.go"],
      model: ["/models/", "/entities/", "_model.go"],
      service: ["/services/", "_service.go"],
      util: ["/utils/", "/pkg/"],
      test: ["_test.go"],
      middleware: ["/middleware/"],
      api: ["/api/"],
      config: ["config.go"],
      other: [],
    },
  },
  {
    id: "rust",
    displayName: "Rust",
    aliases: ["rs"],
    extensions: [".rs"],
    excludePatterns: ["/target/", "/deps/"],
    manifestFiles: ["Cargo.toml", "Cargo.lock"],
    fileTypes: {
      model: ["/models/", "/entities/"],
      service: ["/services/"],
      util: ["/utils/", "/helpers/"],
      handler: ["/handlers/", "/routes/"],
      api: ["/api/"],
      config: ["config.rs"],
      test: ["/tests/", "_test.rs"],
      other: [],
    },
  },
  {
    id: "java",
    displayName: "Java",
    aliases: [],
    extensions: [".java"],
    excludePatterns: ["/target/", "/build/", ".class"],
    manifestFiles: ["pom.xml", "build.gradle", "build.gradle.kts", "settings.gradle"],
    fileTypes: {
      controller: ["/controller/", "Controller.java"],
      service: ["/service/", "Service.java"],
      model: ["/model/", "/entity/", "Entity.java"],
      repository: ["/repository/", "Repository.java"],
      util: ["/util/", "Utils.java"],
      config: ["/config/", "Config.java"],
      api: ["/api/"],
      test: ["/test/", "Test.java"],
      other: [],
    },
  },
  {
    id: "cpp",
    displayName: "C/C++",
    aliases: ["c", "c++", "cxx"],
    extensions: [".cpp", ".cc", ".cxx", ".c", ".h", ".hpp", ".hxx"],
    excludePatterns: ["/build/", "/cmake-build-", ".o", ".a", ".so"],
    manifestFiles: ["CMakeLists.txt", "Makefile", "configure.ac"],
    fileTypes: {
      header: [".h", ".hpp", ".hxx"],
      source: [".cpp", ".cc", ".cxx", ".c"],
      util: ["/utils/", "/helpers/"],
      test: ["/tests/", "_test."],
      config: ["config."],
      other: [],
    },
  },
  {
    id: "ruby",
    displayName: "Ruby",
    aliases: ["rb"],
    extensions: [".rb", ".rake"],
    excludePatterns: ["/vendor/", ".bundle/"],
    manifestFiles: ["Gemfile", "Gemfile.lock", "Rakefile"],
    fileTypes: {
      controller: ["/controllers/", "_controller.rb"],
      model: ["/models/", "_model.rb"],
      view: ["/views/"],
      service: ["/services/", "_service.rb"],
      util: ["/lib/", "/helpers/"],
      test: ["/test/", "/spec/", "_spec.rb"],
      config: ["/config/"],
      other: [],
    },
  },
  {
    id: "php",
    displayName: "PHP",
    aliases: [],
    extensions: [".php"],
    excludePatterns: ["/vendor/", "/cache/"],
    manifestFiles: ["composer.json", "composer.lock"],
    fileTypes: {
      controller: ["/Controllers/", "Controller.php"],
      model: ["/Models/", "Model.php"],
      service: ["/Services/", "Service.php"],
      view: ["/views/", "/templates/"],
      util: ["/Utils/", "/Helpers/"],
      middleware: ["/Middleware/"],
      test: ["/tests/", "Test.php"],
      config: ["/config/"],
      other: [],
    },
  },
]

/**
 * Get language config by ID
 */
export function getLanguageConfig(languageId: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS.find((config) => config.id === languageId || config.aliases.includes(languageId.toLowerCase()))
}

/**
 * Get all supported language IDs
 */
export function getSupportedLanguageIds(): string[] {
  return LANGUAGE_CONFIGS.map((config) => config.id)
}
