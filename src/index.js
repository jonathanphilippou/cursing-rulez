#!/usr/bin/env node

/**
 * Cursing Rulez (rulez) - A CLI for managing Cursor rules
 */

const { Command } = require("commander");
const chalk = require("chalk");
const pkg = require("../package.json");

// Import commands
const initCommand = require("./commands/init");
const addCommand = require("./commands/add");

// Set up CLI program
const program = new Command();

program
  .name("rulez")
  .description("A CLI tool for managing Cursor editor rules")
  .version(pkg.version);

// Register commands
const registerCommand = (commandModule) => {
  const command = program
    .command(commandModule.command)
    .description(commandModule.description)
    .action(commandModule.execute);

  // Add any options
  if (commandModule.options) {
    commandModule.options.forEach((option) => {
      command.option(option.flags, option.description);
    });
  }

  return command;
};

// Register all commands
registerCommand(initCommand);
registerCommand(addCommand);

// Add error handling
program.configureOutput({
  outputError: (str, write) => write(chalk.red(str)),
});

// Add help text for when no command is provided
program.addHelpText(
  "afterAll",
  `
Examples:
  $ rulez init              Initialize a project with Cursor rules
  $ rulez add nextjs        Add the Next.js rule from Cursor Directory
  $ rulez add react --local Add the React rule to local overrides
`
);

// Parse command line arguments
program.parse(process.argv);

// Display help if no arguments provided
if (process.argv.length <= 2) {
  program.help();
}
