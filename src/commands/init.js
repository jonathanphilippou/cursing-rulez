/**
 * rulez init - Initialize a project with Cursor rules structure
 */

const chalk = require("chalk");
const {
  createCursorDirectoryStructure,
  createDefaultRuleFiles,
  updateGitignoreForCursor,
} = require("../utils/file-utils");

/**
 * Execute the init command
 * @param {Object} options - Command options
 */
const execute = (options = {}) => {
  console.log(chalk.blue("Initializing Cursor rules structure..."));

  // Create the directory structure
  const dirResult = createCursorDirectoryStructure(options.force);

  if (!dirResult.success) {
    console.log(chalk.red("Error initializing Cursor rules structure:"));
    dirResult.messages.forEach((message) =>
      console.log(chalk.red(`- ${message}`))
    );
    process.exit(1);
    return; // This is needed to ensure the function stops here in the tests
  }

  // Log messages about what directories were created
  if (dirResult.created.length === 0) {
    console.log(chalk.yellow("All required directories already exist."));
  } else {
    console.log(chalk.green("Created the following directories:"));
    dirResult.created.forEach((dir) => console.log(chalk.green(`- ${dir}`)));
  }

  // Create default rule files
  console.log(chalk.blue("\nGenerating default rule files..."));
  const fileResult = createDefaultRuleFiles(options.force);

  if (!fileResult.success) {
    console.log(chalk.red("Error creating default rule files:"));
    fileResult.messages.forEach((message) =>
      console.log(chalk.red(`- ${message}`))
    );
    process.exit(1);
    return; // This is needed to ensure the function stops here in the tests
  }

  // Log messages about what files were created
  if (fileResult.created.length === 0) {
    console.log(chalk.yellow("All default rule files already exist."));
  } else {
    console.log(chalk.green("Created the following rule files:"));
    fileResult.created.forEach((file) => console.log(chalk.green(`- ${file}`)));
  }

  // Update .gitignore
  console.log(chalk.blue("\nUpdating .gitignore for local overrides..."));
  const gitignoreResult = updateGitignoreForCursor(options.force);

  if (!gitignoreResult.success) {
    console.log(chalk.red("Error updating .gitignore:"));
    gitignoreResult.messages.forEach((message) =>
      console.log(chalk.red(`- ${message}`))
    );
    process.exit(1);
    return; // This is needed to ensure the function stops here in the tests
  }

  // Log messages about gitignore updates
  if (gitignoreResult.added.length === 0) {
    console.log(chalk.yellow("All required patterns already in .gitignore."));
  } else {
    console.log(chalk.green("Added the following patterns to .gitignore:"));
    gitignoreResult.added.forEach((pattern) =>
      console.log(chalk.green(`- ${pattern}`))
    );
  }

  console.log(chalk.blue("\nCursor rules structure initialized successfully!"));
  console.log(chalk.gray("Next steps:"));
  console.log(chalk.gray("- Add more rules using 'rulez add <rule-name>'"));
  console.log(
    chalk.gray("- Commit the .cursor/rules directory to version control")
  );
};

module.exports = {
  command: "init",
  description: "Initialize a project with Cursor rules structure",
  options: [
    {
      flags: "--force",
      description: "Overwrite existing files if they exist",
    },
  ],
  execute,
};
