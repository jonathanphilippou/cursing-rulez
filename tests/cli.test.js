/**
 * Tests for the CLI interface
 */
const { runCLI } = require("./helpers/cli-runner");

describe("Cursing Rulez CLI", () => {
  test("displays help when called with no arguments", () => {
    const result = runCLI("--help");

    // Verify that the help output contains expected information
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Usage:");
    expect(result.stdout).toContain("Options:");
    expect(result.stdout).toContain("Commands:");
  });

  test("displays version when called with --version", () => {
    const result = runCLI("--version");

    // Verify that the version output is present
    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Match semver pattern
  });

  test("handles init command", () => {
    const result = runCLI("init");

    // Just check that the command runs without error for now
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Initializing Cursor rules structure");
  });

  test("handles add command with argument", () => {
    const result = runCLI("add testRule");

    // Verify that the add command acknowledges the rule name
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Adding rule 'testRule'");
  });

  test("shows error for add command without argument", () => {
    const result = runCLI("add");

    // Verify that an error is shown for missing required argument
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("error");
  });
});
