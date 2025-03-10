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
  // Use native fetch API which is supported in both modern Node.js and Bun
  return fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(
        `Failed to fetch content from ${url}: ${response.status} ${response.statusText}`
      );
    }
    return response.text();
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
 * Check if a URL is from cursor.directory
 * @param {string} url - URL to check
 * @returns {boolean} - True if the URL is from cursor.directory
 */
function isCursorDirectoryUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === "cursor.directory";
  } catch (err) {
    return false;
  }
}

/**
 * Extract rule name from URL
 * @param {string} url - URL to extract from
 * @returns {string} - Extracted rule name
 */
function extractRuleNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    // Get the last part of the path
    const pathParts = urlObj.pathname.split("/").filter((part) => part);
    return pathParts[pathParts.length - 1];
  } catch (err) {
    return "";
  }
}

/**
 * Decode HTML entities in text
 * @param {string} html - Text with HTML entities
 * @returns {string} - Decoded text
 */
function decodeHtmlEntities(html) {
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#x27;": "'",
    "&#39;": "'",
    "&#x2F;": "/",
    "&#x2f;": "/",
    "&#47;": "/",
  };

  // Replace all known entities
  let decoded = html;
  for (const [entity, replacement] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, "g"), replacement);
  }

  // Replace numeric entities (like &#xxxx;)
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });

  // Replace hex entities (like &#x...;)
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

/**
 * Scrape a cursor.directory page to extract rule content
 * @param {string} url - URL of the cursor.directory page
 * @returns {Promise<Object>} - A promise that resolves to the rule content
 */
async function scrapeCursorDirectoryPage(url) {
  const html = await fetchContent(url);

  // Extract the rule name from the URL
  const ruleName = extractRuleNameFromUrl(url);

  // Try multiple approaches to extract the content
  let content = "";

  // PRIORITY APPROACH: Look for the specific element identified by the user
  // <code class="text-sm block pr-3"> contains the actual rule content
  const specificCodeMatch = html.match(
    /<code class="text-sm block pr-3">([\s\S]*?)<\/code>/i
  );
  if (specificCodeMatch && specificCodeMatch[1]) {
    content = specificCodeMatch[1].trim();
    // Decode HTML entities and remove any tags
    content = decodeHtmlEntities(content);
    content = content.replace(/<[^>]*>/g, "");
    return {
      content,
      name: ruleName,
    };
  }

  // Approach 1: Look for content in a div with class "rule-content" containing a pre tag
  const contentMatch = html.match(
    /<div class="rule-content">.*?<pre>(.*?)<\/pre>/s
  );
  if (contentMatch && contentMatch[1]) {
    content = contentMatch[1].trim();
  }
  // Approach 2: Look for any pre tag with content
  else {
    const preMatch = html.match(/<pre.*?>(.*?)<\/pre>/s);
    if (preMatch && preMatch[1]) {
      content = preMatch[1].trim();
    }
  }

  // Approach 3: Look for content in a markdown or code block section
  if (!content) {
    const markdownMatch = html.match(/```(?:markdown|md)?\s*([\s\S]*?)```/);
    if (markdownMatch && markdownMatch[1]) {
      content = markdownMatch[1].trim();
    }
  }

  // Approach 4: Look for any code elements that might contain the rule
  if (!content) {
    const codeElements = html.match(/<code[^>]*>([\s\S]*?)<\/code>/gi);
    if (codeElements && codeElements.length > 0) {
      // Find the longest code block as it's likely the rule content
      let longestCode = "";
      for (const codeEl of codeElements) {
        const codeContent = codeEl.replace(
          /<code[^>]*>([\s\S]*?)<\/code>/i,
          "$1"
        );
        if (codeContent.length > longestCode.length) {
          longestCode = codeContent;
        }
      }

      if (longestCode) {
        content = longestCode.trim();
        // Decode HTML entities
        content = decodeHtmlEntities(content);
        content = content.replace(/<[^>]*>/g, "");
      }
    }
  }

  // If content was found, decode any HTML entities
  if (content) {
    content = decodeHtmlEntities(content);
  }

  // Approach 5: Look for content in elements with common content-related classes
  if (!content) {
    const contentClassMatch = html.match(
      /<div class="(?:content|markdown|rule|prompt|code).*?">([\s\S]*?)<\/div>/i
    );
    if (contentClassMatch && contentClassMatch[1]) {
      content = contentClassMatch[1].trim();
      // Remove any HTML tags from the content
      content = content.replace(/<[^>]*>/g, "");
    }
  }

  // If content is still not found, try a simpler approach - get text from body
  if (!content) {
    const bodyMatch = html.match(/<body.*?>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      // Extract what seems like rule content (paragraphs between important markers)
      let bodyContent = bodyMatch[1];

      // Remove navigation, header, footer sections with common class names
      bodyContent = bodyContent.replace(
        /<(?:nav|header|footer).*?>[\s\S]*?<\/(?:nav|header|footer)>/gi,
        ""
      );
      bodyContent = bodyContent.replace(
        /<div class="(?:nav|header|footer|sidebar|menu).*?>[\s\S]*?<\/div>/gi,
        ""
      );

      // Extract paragraphs that might contain useful content
      const paragraphs = bodyContent.match(/<p.*?>([\s\S]*?)<\/p>/gi);
      if (paragraphs && paragraphs.length > 0) {
        // Join paragraphs with newlines and clean HTML tags
        content = paragraphs.join("\n\n").replace(/<[^>]*>/g, "");
        content = decodeHtmlEntities(content);
      }
    }
  }

  // If still no content found
  if (!content) {
    // For URLs with composite names (like nextjs-react-typescript), try creating synthetic content
    if (ruleName.includes("-")) {
      const technologies = ruleName
        .split("-")
        .filter((t) => t !== "cursor" && t !== "rules");
      content = createSyntheticRuleContent(technologies, ruleName);
    } else {
      throw new Error(`Could not extract rule content from ${url}`);
    }
  }

  return {
    content,
    name: ruleName,
  };
}

/**
 * Create synthetic rule content for composite technology names
 * @param {string[]} technologies - List of technologies from the rule name
 * @param {string} ruleName - The full rule name
 * @returns {string} - Generated synthetic rule content
 */
function createSyntheticRuleContent(technologies, ruleName) {
  const techList = technologies
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(", ");

  return `# ${techList} Cursor Rule

You are a specialized AI assistant for ${techList} development. When helping with this project, follow these guidelines:

1. Use TypeScript for all code examples and solutions where applicable
2. Follow ${techList} best practices and current standards
3. Focus on writing clean, maintainable code with appropriate type definitions
4. Provide helpful explanations that consider the relationships between the technologies
5. Ensure code examples work well together within the tech stack

# File patterns: **/*.{ts,tsx,js,jsx}
`;
}

/**
 * Fetch a rule from the Cursor Directory
 * @param {string} ruleNameOrUrl - Name of the rule to fetch or URL
 * @param {Object} options - Options for the fetch
 * @returns {Promise<Object>} - A promise that resolves to the rule content
 */
async function fetchRule(ruleNameOrUrl, options = {}) {
  try {
    // Handle offline mode first
    if (options.offlineMode) {
      let ruleName = ruleNameOrUrl;
      if (options.isUrl) {
        ruleName = extractRuleNameFromUrl(ruleNameOrUrl);
      }
      return {
        success: true,
        content: generateSimulatedContent(ruleName),
        name: ruleName,
        source: "offline-mode",
      };
    }

    // Handle URL input
    if (options.isUrl) {
      // Special handling for cursor.directory URLs
      if (isCursorDirectoryUrl(ruleNameOrUrl)) {
        try {
          const { content, name } = await scrapeCursorDirectoryPage(
            ruleNameOrUrl
          );
          return {
            success: true,
            content,
            name,
            source: ruleNameOrUrl,
          };
        } catch (error) {
          console.log(
            `Warning: Error scraping cursor.directory page: ${error.message}`
          );
          console.log("Trying fallback approaches...");

          // Fallback: Try to extract rule name and fetch it directly
          const ruleName = extractRuleNameFromUrl(ruleNameOrUrl);

          // If the name contains multiple technologies, try each one
          if (ruleName.includes("-")) {
            const technologies = ruleName
              .split("-")
              .filter((t) => t !== "cursor" && t !== "rules" && t !== "rule");

            // Try each technology name as a possible rule
            for (const tech of technologies) {
              try {
                const url = getGitHubRawUrl(tech);
                const content = await fetchContent(url);
                return {
                  success: true,
                  content,
                  name: ruleName, // Keep the original composite name
                  source: url,
                };
              } catch (e) {
                // Continue to next technology
                continue;
              }
            }

            // If we get here, none of the individual technologies worked
            // Create synthetic content instead
            return {
              success: true,
              content: createSyntheticRuleContent(technologies, ruleName),
              name: ruleName,
              source: "synthetic-content",
            };
          }

          // If not a composite name, continue with normal error handling
          throw error;
        }
      }

      // For other URLs, just fetch the content directly
      const content = await fetchContent(ruleNameOrUrl);
      return {
        success: true,
        content,
        name: extractRuleNameFromUrl(ruleNameOrUrl),
        source: ruleNameOrUrl,
      };
    }

    // Handle rule name input (original behavior)
    const url = getGitHubRawUrl(ruleNameOrUrl);
    const content = await fetchContent(url);

    return {
      success: true,
      content,
      name: ruleNameOrUrl,
      source: url,
    };
  } catch (error) {
    if (options.offlineMode) {
      // In offline mode, return simulated content
      let ruleName = ruleNameOrUrl;
      if (options.isUrl) {
        ruleName = extractRuleNameFromUrl(ruleNameOrUrl);
      }
      return {
        success: true,
        content: generateSimulatedContent(ruleName),
        name: ruleName,
        source: "offline-mode",
      };
    }

    // Try to find rules with similar names
    const availableRules = await listAvailableRules();
    const ruleName = options.isUrl
      ? extractRuleNameFromUrl(ruleNameOrUrl)
      : ruleNameOrUrl;
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
  isCursorDirectoryUrl,
  extractRuleNameFromUrl,
  scrapeCursorDirectoryPage,
  createSyntheticRuleContent,
  decodeHtmlEntities,
  // Constants
  GITHUB_RAW_URL,
  CURSOR_DIRECTORY_REPO,
  CURSOR_DIRECTORY_BRANCH,
  RULES_PATH,
};
