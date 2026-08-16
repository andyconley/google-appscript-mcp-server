module.exports = {
  branches: ["main"],
  tagFormat: "v${version}",
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { type: "docs", release: "patch" },
          { type: "chore", scope: "release", release: false }
        ]
      }
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "feat", section: "Features", effect: "bump" },
            { type: "fix", section: "Bug Fixes", effect: "bump" },
            { type: "docs", section: "Documentation", effect: "changelog" },
            { type: "perf", section: "Performance", effect: "bump" },
            { type: "refactor", section: "Code Refactoring", effect: "changelog" },
            { type: "test", section: "Tests", effect: "changelog" },
            { type: "build", section: "Build System", effect: "changelog" },
            { type: "ci", section: "Continuous Integration", effect: "changelog" },
            { type: "chore", section: "Maintenance", effect: "hidden" }
          ]
        }
      }
    ],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "CHANGELOG.md",
        changelogTitle: "# Changelog\n\nAll notable changes to google-appscript-mcp-server are generated from Conventional Commits. Longer design context belongs in the documentation changed by the release."
      }
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false
      }
    ],
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json", "package-lock.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
};
