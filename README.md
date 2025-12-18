# CodeCompass 🧭

**Onboard to any codebase in minutes, not days.**

CodeCompass is an AI-powered tool that generates comprehensive onboarding guides for any GitHub repository. Paste a repo URL and get an instant architecture overview, tech stack breakdown, and interactive 3D dependency graph.

![Built with v0](https://img.shields.io/badge/Built%20with-v0-black?style=flat-square&logo=vercel)
![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude-cc785c?style=flat-square)
![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## ✨ Features

- **AI-Generated Onboarding Guide** — Get a plain-English summary of what the project does, its architecture, and where to start reading code
- **Tech Stack Detection** — Automatic identification of frameworks, libraries, and tools used
- **Interactive 3D Dependency Graph** — Visualize how files connect and import each other in a navigable 3D space
- **Multi-Language Support** — Automatic language detection and parsing for JavaScript/TypeScript, Python, Go, Rust, Java, C/C++, Ruby, and PHP
- **File-Level Analysis** — Click any node in the graph to get AI analysis of that specific file
- **Key Concepts & Common Tasks** — Understand the mental models and workflows you'll need
- **One-Click Export** — Copy the entire guide as Markdown for your team's docs

## 🎯 Why CodeCompass?

Starting on a new codebase is overwhelming. You're dropped into thousands of files with a README that's either outdated or assumes you already understand the architecture. CodeCompass fixes this by giving you the guided tour a senior engineer would provide — instantly.

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React + Tailwind CSS (scaffolded with [v0](https://v0.dev))
- **AI:** Claude via [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)
- **3D Visualization:** React Three Fiber
- **Data:** GitHub REST API

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Vercel AI Gateway API key
- A GitHub Personal Access Token (for accessing public repositories)
- An Anthropic API key (for Claude analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/statho7/codecompass.git
   cd codecompass
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```env
   VERCEL_AI_GATEWAY_KEY=your_vercel_ai_gateway_key
   GITHUB_TOKEN=your_github_personal_access_token
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

   **Getting your API keys:**

   - **Vercel AI Gateway Key**: Sign up at [Vercel](https://vercel.com) and create an AI Gateway API key
   - **GitHub Token**: Generate a Personal Access Token at [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens). The token only needs `public_repo` scope for public repositories
   - **Anthropic API Key**: Get your API key from [Anthropic Console](https://console.anthropic.com/)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** and paste any GitHub repository URL

## 🌐 Deployment

You can deploy CodeCompass to any platform that supports Next.js applications. Make sure to configure your environment variables (`VERCEL_AI_GATEWAY_KEY`, `GITHUB_TOKEN`, and `ANTHROPIC_API_KEY`) in your deployment platform's settings.

## 📖 How It Works

1. **Fetch** — When you submit a GitHub URL, CodeCompass fetches the repository's README, manifest files, and file tree via the GitHub API
2. **Detect** — The system automatically detects the primary programming language using GitHub's language statistics API, manifest files (package.json, requirements.txt, etc.), or file extensions
3. **Analyze** — The data is sent to Claude, which generates a structured onboarding guide including architecture overview, key concepts, and recommendations
4. **Visualize** — A language-specific parser analyzes import statements to build a dependency graph (supports JavaScript/TypeScript, Python, and more)
5. **Explore** — The 3D graph renders with React Three Fiber, letting you click nodes to drill into individual file analysis

## 🌍 Supported Languages

CodeCompass now supports dependency graph generation for multiple programming languages:

| Language | Status | Import Patterns Supported |
|----------|--------|---------------------------|
| **JavaScript/TypeScript** | ✅ Full Support | ES6 imports, require statements |
| **Python** | ✅ Full Support | import, from...import, relative imports |
| **Go** | 🚧 Configured* | import statements |
| **Rust** | 🚧 Configured* | use, mod declarations |
| **Java** | 🚧 Configured* | import statements |
| **C/C++** | 🚧 Configured* | #include directives |
| **Ruby** | 🚧 Configured* | require, require_relative |
| **PHP** | 🚧 Configured* | use, require, include |

*_Language configurations are in place, but parsers need full implementation. Contributions welcome!_

### Manual Language Override

If auto-detection doesn't work as expected, you can manually specify the language:

```
https://your-app.com/?url=github.com/user/repo&lang=python
```

## 🤝 Contributing

Contributions are welcome! Some ideas for improvement:

- Complete parser implementations for Go, Rust, Java, C/C++, Ruby, and PHP
- Private repository authentication flow
- Team collaboration features
- Custom analysis prompts
- Export to additional formats

## 📄 License

MIT License — feel free to use this for your own projects.
