/**
 * rulez add - Add a Cursor rule from the community directory
 */

const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const ruleFetcher = require("../utils/rule-fetcher");
const {
  fileExists,
  getRuleFilePath,
  saveRuleToFile,
  checkCursorRulesDirectoryExists,
} = require("../utils/file-utils");

/**
 * Check if a rule name is valid
 * @param {string} ruleName - Name to validate
 * @returns {boolean} True if the name is valid
 */
const isValidRuleName = (ruleName) => {
  return /^[a-zA-Z0-9_\-]+$/.test(ruleName);
};

/**
 * Check if a string is a valid URL
 * @param {string} str - String to check
 * @returns {boolean} True if valid URL, false otherwise
 */
const isValidUrl = (str) => {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (err) {
    return false;
  }
};

/**
 * Check if a URL is from cursor.directory
 * @param {string} url - URL to check
 * @returns {boolean} True if from cursor.directory, false otherwise
 */
const isCursorDirectoryUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === "cursor.directory";
  } catch (err) {
    return false;
  }
};

/**
 * Extract rule name from URL
 * @param {string} url - URL to extract from
 * @returns {string} Extracted rule name
 */
const extractRuleNameFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // Get the last part of the path
    const pathParts = urlObj.pathname.split("/").filter((part) => part);
    return pathParts[pathParts.length - 1];
  } catch (err) {
    return "";
  }
};

/**
 * Execute the add command
 * @param {string} ruleNameOrUrl - Name of the rule to add, or URL to fetch from
 * @param {Object} options - Command options
 */
const execute = async (ruleNameOrUrl, options = {}) => {
  // Handle empty input
  if (!ruleNameOrUrl) {
    console.log(chalk.red("Error: Rule name or URL is required"));
    console.log(`Usage: rulez add <rule-name | url> [options]`);
    return process.exit(1);
  }

  // Check if input is a URL
  const isUrl = isValidUrl(ruleNameOrUrl);
  const isCursorUrl = isUrl && isCursorDirectoryUrl(ruleNameOrUrl);

  // Extract ruleName - either directly or from URL
  let ruleName = ruleNameOrUrl;
  if (isUrl) {
    ruleName = extractRuleNameFromUrl(ruleNameOrUrl);
  }

  // Validate rule name if not a URL or if extracted name is invalid
  if (!isUrl && !isValidRuleName(ruleName)) {
    console.log(
      chalk.red(
        `Error: '${ruleNameOrUrl}' doesn't appear to be a valid rule name or URL`
      )
    );
    console.log(
      chalk.yellow(
        "Rule names must only contain letters, numbers, dashes, and underscores"
      )
    );
    return process.exit(1);
  }

  // Check if extracted rule name is valid
  if (isUrl && !ruleName) {
    console.log(
      chalk.red(
        `Error: Could not extract a valid rule name from URL '${ruleNameOrUrl}'`
      )
    );
    return process.exit(1);
  }

  // Check if the Cursor rules directory structure exists
  if (!checkCursorRulesDirectoryExists(process.cwd())) {
    console.log(chalk.red("Error: Cursor rules directory structure not found"));
    console.log(
      chalk.yellow(
        "Run 'rulez init' to create the necessary directory structure first"
      )
    );
    return process.exit(1);
  }

  // Determine target directory based on options
  const targetType = options.local ? "local" : "project";

  // Display appropriate fetching message
  if (isUrl) {
    console.log(chalk.blue(`Fetching rule from URL: ${ruleNameOrUrl}`));
    if (isCursorUrl) {
      console.log(
        chalk.blue(`Detected cursor.directory URL for rule: ${ruleName}`)
      );
    }
  } else {
    console.log(
      chalk.blue(`Fetching rule '${ruleName}' from Cursor Directory...`)
    );
  }

  try {
    // Attempt to fetch the rule from the remote source
    const result = await ruleFetcher.fetchRule(ruleNameOrUrl, {
      offlineMode: options.offline,
      isUrl: isUrl,
    });

    if (!result.success) {
      console.log(chalk.red(`Error: Could not find rule '${ruleName}'`));
      console.log(chalk.red(`Reason: ${result.error}`));

      // Show suggestions if available
      if (result.suggestions && result.suggestions.length > 0) {
        console.log(chalk.yellow("\nDid you mean one of these?"));
        result.suggestions.forEach((suggestion) => {
          console.log(chalk.yellow(`- ${suggestion}`));
        });
      }

      process.exit(1);
    }

    console.log(chalk.green(`Successfully fetched rule '${ruleName}'`));
    console.log(chalk.blue(`Adding to ${targetType} rules...`));

    if (options.local) {
      console.log(
        chalk.yellow(
          "Note: Local override rules are not tracked by version control"
        )
      );
    }

    if (options.force) {
      console.log(
        chalk.yellow(
          "Force flag set: Will overwrite existing files if they exist"
        )
      );
    }

    // Display a preview of the rule content (first few lines)
    console.log(chalk.gray("\nRule content preview:"));
    const previewLines = result.content.split("\n").slice(0, 5);
    previewLines.forEach((line) => console.log(chalk.gray(`> ${line}`)));
    if (result.content.split("\n").length > 5) {
      console.log(chalk.gray("> ..."));
    }

    // Save the rule content to a file using the extracted or provided rule name
    const saveResult = saveRuleToFile(result.name || ruleName, result.content, {
      force: options.force,
      local: options.local,
      basePath: process.cwd(),
    });

    if (!saveResult.success) {
      if (saveResult.exists) {
        console.log(chalk.red(`\nError: ${saveResult.message}`));
        console.log(
          chalk.yellow("Use --force to overwrite the existing file.")
        );
      } else {
        console.log(chalk.red(`\nError saving file: ${saveResult.message}`));
      }
      process.exit(1);
    }

    console.log(
      chalk.green(`\nSuccessfully saved rule to: ${saveResult.path}`)
    );

    if (result.source) {
      console.log(chalk.gray(`Source: ${result.source}`));
    }
  } catch (error) {
    console.log(chalk.red(`Error fetching rule: ${error.message}`));
    process.exit(1);
  }
};

module.exports = {
  command: "add <rule-name|url>",
  description: "Add a Cursor rule from the community directory or URL",
  options: [
    {
      flags: "--force",
      description: "Overwrite existing file if it exists",
    },
    {
      flags: "--local",
      description: "Add to local overrides instead of project rules",
    },
    {
      flags: "--offline",
      description: "Use offline mode with simulated content",
    },
  ],
  execute,
  // Export for testing
  isValidUrl,
  isCursorDirectoryUrl,
  extractRuleNameFromUrl,
};
