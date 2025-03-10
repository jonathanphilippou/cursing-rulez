/**
 * Tests for the init command
 */
const fs = require("fs");
const path = require("path");

// Mock the file utils module before requiring the init command
jest.mock("../../src/utils/file-utils", () => ({
  createCursorDirectoryStructure: jest.fn(),
  createDefaultRuleFiles: jest.fn(),
  updateGitignoreForCursor: jest.fn(),
}));

const fileUtils = require("../../src/utils/file-utils");
const initCommand = require("../../src/commands/init");

describe("Init Command", () => {
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

    // Clear the mocks before each test
    fileUtils.createCursorDirectoryStructure.mockClear();
    fileUtils.createDefaultRuleFiles.mockClear();
    fileUtils.updateGitignoreForCursor.mockClear();
  });

  afterEach(() => {
    // Restore console.log
    console.log = originalLog;
    mockExit.mockClear();
  });

  test("exports correct command structure", () => {
    expect(initCommand).toHaveProperty("command");
    expect(initCommand).toHaveProperty("description");
    expect(initCommand).toHaveProperty("options");
    expect(initCommand).toHaveProperty("execute");
    expect(typeof initCommand.execute).toBe("function");
  });

  test("options include force flag", () => {
    const hasForceOption = initCommand.options.some((option) =>
      option.flags.includes("--force")
    );

    expect(hasForceOption).toBe(true);
  });

  test("execute function creates directory structure, rule files, and updates gitignore", () => {
    // Mock successful directory creation
    fileUtils.createCursorDirectoryStructure.mockReturnValue({
      success: true,
      messages: [
        "Created directory: /path/to/.cursor",
        "Created directory: /path/to/.cursor/rules",
        "Created directory: /path/to/.cursor/local",
      ],
      created: [
        "/path/to/.cursor",
        "/path/to/.cursor/rules",
        "/path/to/.cursor/local",
      ],
    });

    // Mock successful rule file creation
    fileUtils.createDefaultRuleFiles.mockReturnValue({
      success: true,
      messages: [
        "Created file: /path/to/.cursor/rules/default.mdc",
        "Created file: /path/to/.cursor/rules/code-style.mdc",
      ],
      created: [
        "/path/to/.cursor/rules/default.mdc",
        "/path/to/.cursor/rules/code-style.mdc",
      ],
    });

    // Mock successful gitignore update
    fileUtils.updateGitignoreForCursor.mockReturnValue({
      success: true,
      messages: ["Updated .gitignore with 2 new pattern(s)"],
      added: [".cursor/local/", ".cursor-local.config"],
    });

    // Execute the command
    initCommand.execute();

    // Verify the functions were called correctly
    expect(fileUtils.createCursorDirectoryStructure).toHaveBeenCalledWith(
      undefined
    );
    expect(fileUtils.createDefaultRuleFiles).toHaveBeenCalledWith(undefined);
    expect(fileUtils.updateGitignoreForCursor).toHaveBeenCalledWith(undefined);

    // Check output messages for directories
    expect(
      consoleOutput.some((msg) =>
        msg.includes("Created the following directories")
      )
    ).toBe(true);

    // Check output messages for rule files
    expect(
      consoleOutput.some((msg) => msg.includes("Generating default rule files"))
    ).toBe(true);
    expect(
      consoleOutput.some((msg) =>
        msg.includes("Created the following rule files")
      )
    ).toBe(true);

    // Check output messages for gitignore update
    expect(
      consoleOutput.some((msg) => msg.includes("Updating .gitignore"))
    ).toBe(true);
    expect(
      consoleOutput.some((msg) => msg.includes("Added the following patterns"))
    ).toBe(true);

    // Check final success message
    expect(
      consoleOutput.some((msg) => msg.includes("initialized successfully"))
    ).toBe(true);
    expect(mockExit).not.toHaveBeenCalled();
  });

  test("execute function logs when everything already exists", () => {
    // Mock no new directories created
    fileUtils.createCursorDirectoryStructure.mockReturnValue({
      success: true,
      messages: [
        "Directory already exists: /path/to/.cursor",
        "Directory already exists: /path/to/.cursor/rules",
        "Directory already exists: /path/to/.cursor/local",
      ],
      created: [],
    });

    // Mock no new files created
    fileUtils.createDefaultRuleFiles.mockReturnValue({
      success: true,
      messages: [
        "File already exists: /path/to/.cursor/rules/default.mdc",
        "File already exists: /path/to/.cursor/rules/code-style.mdc",
      ],
      created: [],
    });

    // Mock no gitignore changes needed
    fileUtils.updateGitignoreForCursor.mockReturnValue({
      success: true,
      messages: ["No changes needed to .gitignore"],
      added: [],
    });

    // Execute the command
    initCommand.execute();

    // Check output messages
    expect(
      consoleOutput.some((msg) =>
        msg.includes("All required directories already exist")
      )
    ).toBe(true);
    expect(
      consoleOutput.some((msg) =>
        msg.includes("All default rule files already exist")
      )
    ).toBe(true);
    expect(
      consoleOutput.some((msg) =>
        msg.includes("All required patterns already in .gitignore")
      )
    ).toBe(true);
    expect(
      consoleOutput.some((msg) => msg.includes("initialized successfully"))
    ).toBe(true);
    expect(mockExit).not.toHaveBeenCalled();
  });

  test("execute function passes force flag to all operations", () => {
    // Mock successful operations
    fileUtils.createCursorDirectoryStructure.mockReturnValue({
      success: true,
      messages: [],
      created: [],
    });

    fileUtils.createDefaultRuleFiles.mockReturnValue({
      success: true,
      messages: [],
      created: [],
    });

    fileUtils.updateGitignoreForCursor.mockReturnValue({
      success: true,
      messages: [],
      added: [],
    });

    // Execute the command with force option
    initCommand.execute({ force: true });

    // Verify the functions were called with force flag
    expect(fileUtils.createCursorDirectoryStructure).toHaveBeenCalledWith(true);
    expect(fileUtils.createDefaultRuleFiles).toHaveBeenCalledWith(true);
    expect(fileUtils.updateGitignoreForCursor).toHaveBeenCalledWith(true);
  });

  test("execute function handles directory creation errors", () => {
    // Mock an error during directory creation
    fileUtils.createCursorDirectoryStructure.mockReturnValue({
      success: false,
      messages: [
        "Failed to create directory: /path/to/.cursor. Error: permission denied",
      ],
      created: [], // Add the created property to fix the error
    });

    // Execute the command
    initCommand.execute();

    // Check error messages and exit
    expect(
      consoleOutput.some((msg) => msg.includes("Error initializing"))
    ).toBe(true);
    expect(mockExit).toHaveBeenCalledWith(1);

    // File creation and gitignore update should not be called if directory creation fails
    expect(fileUtils.createDefaultRuleFiles).not.toHaveBeenCalled();
    expect(fileUtils.updateGitignoreForCursor).not.toHaveBeenCalled();
  });

  test("execute function handles file creation errors", () => {
    // Mock successful directory creation
    fileUtils.createCursorDirectoryStructure.mockReturnValue({
      success: true,
      messages: [],
      created: [],
    });

    // Mock an error during file creation
    fileUtils.createDefaultRuleFiles.mockReturnValue({
      success: false,
      messages: [
        "Failed to create file: /path/to/.cursor/rules/default.mdc. Error: permission denied",
      ],
      created: [],
    });

    // Execute the command
    initCommand.execute();

    // Check error messages and exit
    expect(
      consoleOutput.some((msg) =>
        msg.includes("Error creating default rule files")
      )
    ).toBe(true);
    expect(mockExit).toHaveBeenCalledWith(1);

    // Gitignore update should not be called if file creation fails
    expect(fileUtils.updateGitignoreForCursor).not.toHaveBeenCalled();
  });

  test("execute function handles gitignore update errors", () => {
    // Mock successful directory creation
    fileUtils.createCursorDirectoryStructure.mockReturnValue({
      success: true,
      messages: [],
      created: [],
    });

    // Mock successful rule file creation
    fileUtils.createDefaultRuleFiles.mockReturnValue({
      success: true,
      messages: [],
      created: [],
    });

    // Mock an error during gitignore update
    fileUtils.updateGitignoreForCursor.mockReturnValue({
      success: false,
      messages: ["Failed to update .gitignore: Error: permission denied"],
      added: [],
    });

    // Execute the command
    initCommand.execute();

    // Check error messages and exit
    expect(
      consoleOutput.some((msg) => msg.includes("Error updating .gitignore"))
    ).toBe(true);
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
