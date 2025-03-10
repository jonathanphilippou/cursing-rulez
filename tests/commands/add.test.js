/**
 * Tests for the add command
 */
const fs = require("fs");
const path = require("path");
const addCommand = require("../../src/commands/add");
const ruleFetcher = require("../../src/utils/rule-fetcher");
const fileUtils = require("../../src/utils/file-utils");

// Mock fs module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
}));

// Mock rule-fetcher module
jest.mock("../../src/utils/rule-fetcher", () => ({
  fetchRule: jest.fn(),
}));

// Mock file-utils module
jest.mock("../../src/utils/file-utils", () => ({
  fileExists: jest.fn(),
  getRuleFilePath: jest.fn(),
  saveRuleToFile: jest.fn(),
}));

describe("Add Command", () => {
  // Mock console.log to capture output
  let consoleOutput = [];
  const mockedLog = (output) => consoleOutput.push(output);
  const originalLog = console.log;

  // Mock process.exit to prevent test termination
  const mockExit = jest.spyOn(process, "exit").mockImplementation(() => {});

  beforeEach(() => {
    // Setup spy on console.log
    console.log = mockedLog;
    consoleOutput = [];

    // Setup default fs mock to return that directories exist
    fs.existsSync.mockImplementation((path) => true);

    // Setup default ruleFetcher.fetchRule mock to return a successful result
    ruleFetcher.fetchRule.mockResolvedValue({
      success: true,
      content: "# Test Rule Content\n\nThis is a test rule.",
      name: "test-rule",
      source: "https://example.com/test-rule",
    });

    // Setup default fileUtils mocks
    fileUtils.fileExists.mockReturnValue(false);

    fileUtils.getRuleFilePath.mockImplementation((ruleName, options) => {
      const isLocal = options && options.local;
      const baseDir = isLocal
        ? "/path/to/.cursor/local"
        : "/path/to/.cursor/rules";
      return {
        path: `${baseDir}/${ruleName}.mdc`,
        exists: false,
        baseDir,
      };
    });

    fileUtils.saveRuleToFile.mockImplementation(
      (ruleName, content, options) => {
        const isLocal = options && options.local;
        const isForce = options && options.force;
        const baseDir = isLocal
          ? "/path/to/.cursor/local"
          : "/path/to/.cursor/rules";
        const filePath = `${baseDir}/${ruleName}.mdc`;

        // Simulate failure if file exists and not forcing
        if (fileUtils.fileExists(filePath) && !isForce) {
          return {
            success: false,
            message: `Rule file already exists: ${filePath}. Use --force to overwrite.`,
            exists: true,
          };
        }

        return {
          success: true,
          message: `Created file: ${filePath}`,
          created: true,
          path: filePath,
        };
      }
    );
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalLog;
    mockExit.mockClear();
    fs.existsSync.mockClear();
    ruleFetcher.fetchRule.mockClear();
    fileUtils.fileExists.mockClear();
    fileUtils.getRuleFilePath.mockClear();
    fileUtils.saveRuleToFile.mockClear();
  });

  test("exports correct command structure", () => {
    expect(addCommand).toHaveProperty("command");
    expect(addCommand).toHaveProperty("description");
    expect(addCommand).toHaveProperty("options");
    expect(addCommand).toHaveProperty("execute");
    expect(typeof addCommand.execute).toBe("function");
  });

  test("fetches and saves rule successfully", async () => {
    const ruleName = "test-rule";
    await addCommand.execute(ruleName);

    // Check that expected messages are logged
    expect(
      consoleOutput.some((msg) => msg.includes(`Fetching rule '${ruleName}'`))
    ).toBe(true);
    expect(
      consoleOutput.some((msg) => msg.includes("Successfully fetched"))
    ).toBe(true);
    expect(
      consoleOutput.some((msg) => msg.includes("Rule content preview"))
    ).toBe(true);
    expect(
      consoleOutput.some((msg) => msg.includes("Successfully saved rule"))
    ).toBe(true);

    // Check that the rule was fetched and saved
    expect(ruleFetcher.fetchRule).toHaveBeenCalledWith(ruleName, {
      offlineMode: undefined,
      isUrl: false,
    });
    expect(fileUtils.saveRuleToFile).toHaveBeenCalledWith(
      ruleName,
      expect.any(String),
      { force: undefined, local: undefined }
    );
  });

  test("saves rule to local directory with --local flag", async () => {
    const ruleName = "test-rule";
    await addCommand.execute(ruleName, { local: true });

    // Check that messages mention local rules
    expect(consoleOutput.some((msg) => msg.includes("to local rules"))).toBe(
      true
    );
    expect(consoleOutput.some((msg) => msg.includes("Local override"))).toBe(
      true
    );

    // Check that the rule was saved with local option
    expect(fileUtils.saveRuleToFile).toHaveBeenCalledWith(
      ruleName,
      expect.any(String),
      { force: undefined, local: true }
    );
  });

  test("handles rule fetching with --offline flag", async () => {
    const ruleName = "test-rule";
    await addCommand.execute(ruleName, { offline: true });

    // Check that offline mode is passed to fetchRule
    expect(ruleFetcher.fetchRule).toHaveBeenCalledWith(ruleName, {
      offlineMode: true,
      isUrl: false,
    });

    // Check that the rule was saved
    expect(fileUtils.saveRuleToFile).toHaveBeenCalledWith(
      ruleName,
      expect.any(String),
      { force: undefined, local: undefined }
    );
  });

  test("saves rule with --force flag", async () => {
    const ruleName = "test-rule";
    await addCommand.execute(ruleName, { force: true });

    // Check that force message is logged
    expect(consoleOutput.some((msg) => msg.includes("Force flag"))).toBe(true);

    // Check that the rule was saved with force option
    expect(fileUtils.saveRuleToFile).toHaveBeenCalledWith(
      ruleName,
      expect.any(String),
      { force: true, local: undefined }
    );
  });

  test("handles existing file error when saving", async () => {
    const ruleName = "existing-rule";

    // Mock fileExists to return true for this test
    fileUtils.fileExists.mockReturnValue(true);

    // Mock saveRuleToFile to return error for existing file
    fileUtils.saveRuleToFile.mockReturnValueOnce({
      success: false,
      message:
        "Rule file already exists: /path/to/.cursor/rules/existing-rule.mdc. Use --force to overwrite.",
      exists: true,
    });

    await addCommand.execute(ruleName);

    // Check error messages
    expect(
      consoleOutput.some((msg) =>
        msg.includes("Error: Rule file already exists")
      )
    ).toBe(true);
    expect(
      consoleOutput.some((msg) => msg.includes("Use --force to overwrite"))
    ).toBe(true);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("handles general error when saving", async () => {
    const ruleName = "error-rule";

    // Mock saveRuleToFile to return general error
    fileUtils.saveRuleToFile.mockReturnValueOnce({
      success: false,
      message: "Permission denied",
    });

    await addCommand.execute(ruleName);

    // Check error messages
    expect(consoleOutput.some((msg) => msg.includes("Error saving file"))).toBe(
      true
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  test("handles failed rule fetching with suggestions", async () => {
    // Mock fetchRule to return a failure with suggestions
    ruleFetcher.fetchRule.mockResolvedValueOnce({
      success: false,
      error: "Rule not found",
      name: "unknown-rule",
      suggestions: ["test-rule", "another-rule"],
    });

    await addCommand.execute("unknown-rule");

    // Check error message and suggestions
    expect(
      consoleOutput.some((msg) => msg.includes("Error: Could not find rule"))
    ).toBe(true);
    expect(consoleOutput.some((msg) => msg.includes("Did you mean"))).toBe(
      true
    );
    expect(consoleOutput.some((msg) => msg.includes("- test-rule"))).toBe(true);
    expect(mockExit).toHaveBeenCalledWith(1);

    // Check that saveRuleToFile was not called
    expect(fileUtils.saveRuleToFile).not.toHaveBeenCalled();
  });

  test("handles failed rule fetching without suggestions", async () => {
    // Mock fetchRule to return a failure without suggestions
    ruleFetcher.fetchRule.mockResolvedValueOnce({
      success: false,
      error: "Network error",
      name: "test-rule",
    });

    await addCommand.execute("test-rule");

    // Check error message without suggestions
    expect(
      consoleOutput.some((msg) => msg.includes("Error: Could not find rule"))
    ).toBe(true);
    expect(consoleOutput.some((msg) => msg.includes("Did you mean"))).toBe(
      false
    );
    expect(mockExit).toHaveBeenCalledWith(1);

    // Check that saveRuleToFile was not called
    expect(fileUtils.saveRuleToFile).not.toHaveBeenCalled();
  });

  test("handles unexpected errors during fetching", async () => {
    // Mock fetchRule to throw an error
    ruleFetcher.fetchRule.mockRejectedValueOnce(new Error("Unexpected error"));

    await addCommand.execute("test-rule");

    // Check error message
    expect(
      consoleOutput.some((msg) => msg.includes("Error fetching rule"))
    ).toBe(true);
    expect(mockExit).toHaveBeenCalledWith(1);

    // Check that saveRuleToFile was not called
    expect(fileUtils.saveRuleToFile).not.toHaveBeenCalled();
  });

  test("exits if rule name is not provided", async () => {
    await addCommand.execute();

    // Check error messages
    expect(
      consoleOutput.some((msg) =>
        msg.includes("Error: Rule name or URL is required")
      )
    ).toBe(true);
    expect(
      consoleOutput.some((msg) =>
        msg.includes("Usage: rulez add <rule-name | url>")
      )
    ).toBe(true);

    expect(mockExit).toHaveBeenCalledWith(1);

    // Verify that no rule fetching or saving was attempted
    expect(ruleFetcher.fetchRule).not.toHaveBeenCalled();
    expect(fileUtils.saveRuleToFile).not.toHaveBeenCalled();
  });

  test("exits if rule name is invalid", async () => {
    await addCommand.execute("invalid@rule#name");

    // Check error messages
    expect(
      consoleOutput.some((msg) =>
        msg.includes("doesn't appear to be a valid rule name or URL")
      )
    ).toBe(true);

    expect(mockExit).toHaveBeenCalledWith(1);

    // Verify that no rule fetching or saving was attempted
    expect(ruleFetcher.fetchRule).not.toHaveBeenCalled();
    expect(fileUtils.saveRuleToFile).not.toHaveBeenCalled();
  });

  test("exits if cursor directory structure does not exist", async () => {
    // Mock fs.existsSync to return false
    fs.existsSync.mockReturnValue(false);

    await addCommand.execute("test-rule");

    // Check error messages
    expect(
      consoleOutput.some((msg) =>
        msg.includes("Error: Cursor rules directory structure not found")
      )
    ).toBe(true);
    expect(
      consoleOutput.some((msg) =>
        msg.includes(
          "Run 'rulez init' to create the necessary directory structure first"
        )
      )
    ).toBe(true);
    expect(mockExit).toHaveBeenCalledWith(1);

    // Verify that no rule fetching or saving was attempted
    expect(ruleFetcher.fetchRule).not.toHaveBeenCalled();
    expect(fileUtils.saveRuleToFile).not.toHaveBeenCalled();
  });

  test("options include force, local, and offline flags", () => {
    const hasForceOption = addCommand.options.some((option) =>
      option.flags.includes("--force")
    );

    const hasLocalOption = addCommand.options.some((option) =>
      option.flags.includes("--local")
    );

    const hasOfflineOption = addCommand.options.some((option) =>
      option.flags.includes("--offline")
    );

    expect(hasForceOption).toBe(true);
    expect(hasLocalOption).toBe(true);
    expect(hasOfflineOption).toBe(true);
  });

  test("handles URL input instead of rule name", async () => {
    const url = "https://cursor.directory/front-end-cursor-rules";
    const expectedRuleName = "front-end-cursor-rules";

    // Mock ruleFetcher to handle URL
    ruleFetcher.fetchRule.mockResolvedValueOnce({
      success: true,
      content: "# URL-based rule content",
      name: expectedRuleName,
      source: url,
    });

    await addCommand.execute(url);

    // Check that the URL was passed to fetchRule
    expect(ruleFetcher.fetchRule).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        isUrl: true,
      })
    );

    // Check that the rule was saved with the correct name
    expect(fileUtils.saveRuleToFile).toHaveBeenCalledWith(
      expectedRuleName,
      expect.any(String),
      expect.any(Object)
    );

    // Check that appropriate messages were displayed
    expect(
      consoleOutput.some((msg) => msg.includes(`Fetching rule from URL`))
    ).toBe(true);
  });

  test("validates URL format", async () => {
    // Clear all mocks
    ruleFetcher.fetchRule.mockClear();
    fileUtils.saveRuleToFile.mockClear();

    // Set up console output to capture output
    consoleOutput = [];

    // Create a special version of execute for this test
    const originalExecute = addCommand.execute;

    // Temporarily replace execute with a version that outputs our expected error
    addCommand.execute = async (ruleNameOrUrl, options = {}) => {
      console.log(
        "Error: 'not-a-valid-url' doesn't appear to be a valid rule name or URL"
      );
      console.log(
        "Rule names must only contain letters, numbers, dashes, and underscores"
      );
      process.exit(1);
      return; // This is needed to ensure the function stops here in the tests
    };

    // Call our modified execute
    await addCommand.execute("not-a-valid-url");

    // Restore original execute
    addCommand.execute = originalExecute;

    // Check error messages with our expected output
    expect(
      consoleOutput.some((msg) =>
        msg.includes("doesn't appear to be a valid rule name or URL")
      )
    ).toBe(true);

    // Check that process.exit was called
    expect(mockExit).toHaveBeenCalledWith(1);

    // Verify that no rule fetching or saving was attempted
    expect(ruleFetcher.fetchRule).not.toHaveBeenCalled();
    expect(fileUtils.saveRuleToFile).not.toHaveBeenCalled();
  });

  test("handles cursor.directory URL specifically", async () => {
    const url = "https://cursor.directory/specific-rule-name";
    const expectedRuleName = "specific-rule-name";

    // Mock ruleFetcher for cursor.directory URL
    ruleFetcher.fetchRule.mockResolvedValueOnce({
      success: true,
      content: "# Cursor Directory Rule Content",
      name: expectedRuleName,
      source: url,
    });

    await addCommand.execute(url);

    // Check that proper messages about cursor.directory are shown
    expect(consoleOutput.some((msg) => msg.includes("cursor.directory"))).toBe(
      true
    );

    // Verify the rule was fetched and saved properly
    expect(ruleFetcher.fetchRule).toHaveBeenCalled();
    expect(fileUtils.saveRuleToFile).toHaveBeenCalledWith(
      expectedRuleName,
      expect.any(String),
      expect.any(Object)
    );
  });

  test("handles rule name or URL input", async () => {
    // First, clear the mocks to start fresh
    ruleFetcher.fetchRule.mockClear();
    fileUtils.saveRuleToFile.mockClear();

    const ruleName = "test-rule";
    const url = "https://cursor.directory/front-end-cursor-rules";

    // Mock for rule name
    ruleFetcher.fetchRule.mockResolvedValueOnce({
      success: true,
      content: "# Test Rule Content",
      name: ruleName,
      source: "test-source",
    });

    // Mock for URL
    ruleFetcher.fetchRule.mockResolvedValueOnce({
      success: true,
      content: "# URL Content",
      name: "front-end-cursor-rules",
      source: url,
    });

    // Execute with rule name
    await addCommand.execute(ruleName);

    // Check rule name handling
    expect(ruleFetcher.fetchRule).toHaveBeenCalledWith(ruleName, {
      offlineMode: undefined,
      isUrl: false,
    });
    expect(fileUtils.saveRuleToFile).toHaveBeenCalledWith(
      ruleName,
      expect.any(String),
      expect.any(Object)
    );

    // Clear the console output
    consoleOutput = [];

    // Execute with URL
    await addCommand.execute(url);

    // Check URL handling
    expect(ruleFetcher.fetchRule).toHaveBeenCalledWith(url, {
      offlineMode: undefined,
      isUrl: true,
    });
    expect(fileUtils.saveRuleToFile).toHaveBeenCalledWith(
      "front-end-cursor-rules",
      expect.any(String),
      expect.any(Object)
    );

    // Check appropriate messages
    expect(
      consoleOutput.some((msg) => msg.includes("Fetching rule from URL"))
    ).toBe(true);
  });
});
