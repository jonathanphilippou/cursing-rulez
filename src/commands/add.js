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
} = require("../utils/file-utils");

/**
 * Check if the Cursor rules directory exists
 * @returns {boolean} True if the rules directory exists
 */
const checkCursorRulesDirectoryExists = () => {
  const cursorDir = path.join(process.cwd(), ".cursor");
  const rulesDir = path.join(cursorDir, "rules");
  const localDir = path.join(cursorDir, "local");

  return (
    fs.existsSync(cursorDir) &&
    fs.existsSync(rulesDir) &&
    fs.existsSync(localDir)
  );
};

/**
 * Validate the rule name
 * @param {string} ruleName - Name of the rule to validate
 * @returns {boolean} True if valid, false otherwise
 */
const isValidRuleName = (ruleName) => {
  // Rule name should only contain alphanumeric characters, dashes, and underscores
  // This is a basic validation, we might need to refine it later
  return /^[a-zA-Z0-9-_]+$/.test(ruleName);
};

/**
 * Execute the add command
 * @param {string} ruleName - Name of the rule to add
 * @param {Object} options - Command options
 */
const execute = async (ruleName, options = {}) => {
  // Validate rule name
  if (!ruleName) {
    console.log(chalk.red("Error: Rule name is required"));
    console.log(`Usage: rulez add <rule-name> [options]`);
    return process.exit(1);
  }

  // Validate rule name format
  if (!isValidRuleName(ruleName)) {
    console.log(chalk.red(`Error: Invalid rule name '${ruleName}'`));
    console.log(
      chalk.yellow(
        "Rule names must only contain letters, numbers, dashes, and underscores"
      )
    );
    return process.exit(1);
  }

  // Check if the Cursor rules directory structure exists
  if (!checkCursorRulesDirectoryExists()) {
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

  console.log(
    chalk.blue(`Fetching rule '${ruleName}' from Cursor Directory...`)
  );

  try {
    // Attempt to fetch the rule from the remote source
    const result = await ruleFetcher.fetchRule(ruleName, {
      offlineMode: options.offline,
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

    // Save the rule content to a file
    const saveResult = saveRuleToFile(ruleName, result.content, {
      force: options.force,
      local: options.local,
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
  command: "add <rule-name>",
  description: "Add a Cursor rule from the community directory",
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
};
