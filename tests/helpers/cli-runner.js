/**
 * Helper for testing the CLI commands
 */
const { execSync } = require("child_process");
const path = require("path");

/**
 * Run the CLI with the given arguments
 * @param {string} args - The arguments to pass to the CLI
 * @param {Object} options - Options for the execution
 * @returns {Object} The result of the execution
 */
function runCLI(args = "", options = {}) {
  const cliPath = path.resolve(__dirname, "../../src/index.js");
  const defaults = {
    encoding: "utf8",
    stdio: "pipe",
    env: process.env,
    ...options,
  };

  try {
    const stdout = execSync(`node ${cliPath} ${args}`, defaults);
    return {
      code: 0,
      stdout,
      stderr: "",
    };
  } catch (error) {
    return {
      code: error.status,
      stdout: error.stdout ? error.stdout.toString() : "",
      stderr: error.stderr ? error.stderr.toString() : "",
    };
  }
}

module.exports = {
  runCLI,
};
