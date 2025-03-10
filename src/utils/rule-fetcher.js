/**
 * Rule fetcher utility for retrieving rules from remote sources
 */
const https = require("https");
const fs = require("fs");
const path = require("path");

// Constants for remote sources
const GITHUB_RAW_URL = "https://raw.githubusercontent.com";
const CURSOR_DIRECTORY_REPO = "ivangrynenko/cursorrules";
const CURSOR_DIRECTORY_BRANCH = "main";
const RULES_PATH = ".cursor/rules";

/**
 * Fetches content from a remote URL
 * @param {string} url - URL to fetch content from
 * @returns {Promise<string>} - A promise that resolves to the content
 */
function fetchContent(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to fetch content from ${url}: ${response.statusCode} ${response.statusMessage}`
            )
          );
          return;
        }

        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (error) => {
        reject(
          new Error(`Failed to fetch content from ${url}: ${error.message}`)
        );
      });
  });
}

/**
 * Get a list of available rules from the remote source
 * @param {Object} options - Options for the rule listing
 * @returns {Promise<Object[]>} - A promise that resolves to an array of rule objects
 */
async function listAvailableRules(options = {}) {
  // For a full implementation, we would fetch a list of all available rules
  // This could be from an API or by parsing a repository's file structure

  // For this initial implementation, we'll just return some hardcoded examples
  return [
    {
      name: "default",
      displayName: "Default Cursor Rules",
      description: "Basic rules for any project",
    },
    {
      name: "react",
      displayName: "React Best Practices",
      description: "Rules for React projects",
    },
    {
      name: "nextjs",
      displayName: "Next.js Framework Rules",
      description: "Rules for Next.js projects",
    },
    {
      name: "python",
      displayName: "Python Coding Standards",
      description: "Rules for Python projects",
    },
    {
      name: "typescript",
      displayName: "TypeScript Best Practices",
      description: "Rules for TypeScript projects",
    },
  ];
}

/**
 * Generate the GitHub raw content URL for a rule
 * @param {string} ruleName - Name of the rule
 * @returns {string} - The GitHub raw URL
 */
function getGitHubRawUrl(ruleName) {
  // Format the rule name for the URL
  const fileName = `${ruleName}.mdc`;
  return `${GITHUB_RAW_URL}/${CURSOR_DIRECTORY_REPO}/${CURSOR_DIRECTORY_BRANCH}/${RULES_PATH}/${fileName}`;
}

/**
 * Fetch a rule from the Cursor Directory
 * @param {string} ruleName - Name of the rule to fetch
 * @param {Object} options - Options for the fetch
 * @returns {Promise<Object>} - A promise that resolves to the rule content
 */
async function fetchRule(ruleName, options = {}) {
  try {
    // For a more complete implementation, we might:
    // 1. Check a local cache first
    // 2. Try multiple sources
    // 3. Handle redirects

    // For now, we'll just try to fetch from GitHub
    const url = getGitHubRawUrl(ruleName);
    const content = await fetchContent(url);

    return {
      success: true,
      content,
      name: ruleName,
      source: url,
    };
  } catch (error) {
    if (options.offlineMode) {
      // In offline mode, return simulated content
      return {
        success: true,
        content: generateSimulatedContent(ruleName),
        name: ruleName,
        source: "offline-mode",
      };
    }

    // Try to find rules with similar names
    const availableRules = await listAvailableRules();
    const suggestions = availableRules
      .filter(
        (rule) => rule.name.includes(ruleName) || ruleName.includes(rule.name)
      )
      .map((rule) => rule.name);

    return {
      success: false,
      error: error.message,
      name: ruleName,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }
}

/**
 * Generate simulated rule content for offline mode or testing
 * @param {string} ruleName - Name of the rule
 * @returns {string} - Simulated rule content
 */
function generateSimulatedContent(ruleName) {
  return `# ${ruleName} (Simulated Offline Mode)

When working with ${ruleName}, follow these guidelines:

1. This is a simulated rule created in offline mode
2. The actual rule would contain specific guidance for ${ruleName}
3. To get real rules, please connect to the internet

# File patterns: **/*.${ruleName.toLowerCase()}
`;
}

module.exports = {
  fetchRule,
  listAvailableRules,
  // Export these for testing purposes
  fetchContent,
  getGitHubRawUrl,
  generateSimulatedContent,
  // Constants
  GITHUB_RAW_URL,
  CURSOR_DIRECTORY_REPO,
  CURSOR_DIRECTORY_BRANCH,
  RULES_PATH,
};
