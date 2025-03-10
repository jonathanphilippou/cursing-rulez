/**
 * Tests for file utility functions
 */
const fs = require("fs");
const path = require("path");
const {
  directoryExists,
  fileExists,
  createDirectory,
  writeFile,
  isPatternInFile,
  updateGitignore,
  updateGitignoreForCursor,
  createCursorDirectoryStructure,
  createDefaultRuleFiles,
  getRuleFilePath,
  saveRuleToFile,
  DEFAULT_RULE_TEMPLATES,
  GITIGNORE_PATTERNS,
} = require("../../src/utils/file-utils");

// Use a temp directory for testing
const TEST_DIR = path.join(process.cwd(), "tests", "temp");

describe("File Utils", () => {
  // Create and clean up temp directory for each test
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe("directoryExists", () => {
    test("returns true for existing directory", () => {
      expect(directoryExists(TEST_DIR)).toBe(true);
    });

    test("returns false for non-existent path", () => {
      const nonExistentDir = path.join(TEST_DIR, "non-existent");
      expect(directoryExists(nonExistentDir)).toBe(false);
    });

    test("returns false for file path", () => {
      const filePath = path.join(TEST_DIR, "test-file.txt");
      fs.writeFileSync(filePath, "test content");
      expect(directoryExists(filePath)).toBe(false);
    });
  });

  describe("fileExists", () => {
    test("returns true for existing file", () => {
      const filePath = path.join(TEST_DIR, "test-file.txt");
      fs.writeFileSync(filePath, "test content");
      expect(fileExists(filePath)).toBe(true);
    });

    test("returns false for non-existent path", () => {
      const nonExistentFile = path.join(TEST_DIR, "non-existent.txt");
      expect(fileExists(nonExistentFile)).toBe(false);
    });

    test("returns false for directory path", () => {
      expect(fileExists(TEST_DIR)).toBe(false);
    });
  });

  describe("createDirectory", () => {
    test("creates a directory if it does not exist", () => {
      const newDir = path.join(TEST_DIR, "new-dir");
      const result = createDirectory(newDir);

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(fs.existsSync(newDir)).toBe(true);
    });

    test("returns success but not created for existing directory", () => {
      const existingDir = path.join(TEST_DIR, "existing-dir");
      fs.mkdirSync(existingDir);

      const result = createDirectory(existingDir);
      expect(result.success).toBe(true);
      expect(result.created).toBe(false);
    });

    test("returns failure for path that exists as a file without force", () => {
      const filePath = path.join(TEST_DIR, "test-file.txt");
      fs.writeFileSync(filePath, "test content");

      const result = createDirectory(filePath);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Use --force to overwrite");
    });

    test("replaces file with directory when using force flag", () => {
      const filePath = path.join(TEST_DIR, "to-be-replaced.txt");
      fs.writeFileSync(filePath, "test content");

      const result = createDirectory(filePath, true);
      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.statSync(filePath).isDirectory()).toBe(true);
    });
  });

  describe("writeFile", () => {
    test("creates a file with the specified content", () => {
      const filePath = path.join(TEST_DIR, "test-file.txt");
      const content = "test content";
      const result = writeFile(filePath, content);

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, "utf8")).toBe(content);
    });

    test("returns success but not created for existing file without force", () => {
      const filePath = path.join(TEST_DIR, "existing-file.txt");
      const originalContent = "original content";
      fs.writeFileSync(filePath, originalContent);

      const result = writeFile(filePath, "new content");
      expect(result.success).toBe(true);
      expect(result.created).toBe(false);
      expect(fs.readFileSync(filePath, "utf8")).toBe(originalContent); // Content should not change
    });

    test("overwrites existing file when using force flag", () => {
      const filePath = path.join(TEST_DIR, "to-be-overwritten.txt");
      fs.writeFileSync(filePath, "original content");

      const newContent = "new content";
      const result = writeFile(filePath, newContent, true);
      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(fs.readFileSync(filePath, "utf8")).toBe(newContent);
    });

    test("creates parent directories if they don't exist", () => {
      const nestedFilePath = path.join(
        TEST_DIR,
        "nested",
        "dir",
        "test-file.txt"
      );
      const content = "test content";
      const result = writeFile(nestedFilePath, content);

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);
      expect(fs.existsSync(nestedFilePath)).toBe(true);
      expect(fs.readFileSync(nestedFilePath, "utf8")).toBe(content);
    });
  });

  describe("isPatternInFile", () => {
    const gitignorePath = path.join(TEST_DIR, ".gitignore");

    beforeEach(() => {
      // Create a sample .gitignore file
      const content = `
# Node modules
node_modules/
npm-debug.log

# Build output
dist/
build/

# Editor configs
.vscode/
.idea/
      `.trim();

      fs.writeFileSync(gitignorePath, content);
    });

    test("returns true if pattern exists in file", () => {
      expect(isPatternInFile(gitignorePath, "node_modules/")).toBe(true);
      expect(isPatternInFile(gitignorePath, "dist/")).toBe(true);
    });

    test("returns false if pattern doesn't exist in file", () => {
      expect(isPatternInFile(gitignorePath, ".DS_Store")).toBe(false);
      expect(isPatternInFile(gitignorePath, "coverage/")).toBe(false);
    });

    test("returns false if file doesn't exist", () => {
      const nonExistentFile = path.join(TEST_DIR, "non-existent.txt");
      expect(isPatternInFile(nonExistentFile, "anything")).toBe(false);
    });

    test("matches pattern with trailing comment", () => {
      const fileWithComments = path.join(TEST_DIR, "with-comments.txt");
      fs.writeFileSync(
        fileWithComments,
        "node_modules/ # Dependency directory\n"
      );

      expect(isPatternInFile(fileWithComments, "node_modules/")).toBe(true);
    });
  });

  describe("updateGitignore", () => {
    // Save original process.cwd and mock it to point to our test directory
    const originalCwd = process.cwd;

    beforeEach(() => {
      process.cwd = jest.fn().mockReturnValue(TEST_DIR);
    });

    afterEach(() => {
      process.cwd = originalCwd;
    });

    test("creates new .gitignore with patterns if it doesn't exist", () => {
      const patterns = ["node_modules/", "dist/", ".env"];
      const result = updateGitignore(patterns);

      expect(result.success).toBe(true);
      expect(result.added.length).toBe(patterns.length);

      const gitignorePath = path.join(TEST_DIR, ".gitignore");
      expect(fs.existsSync(gitignorePath)).toBe(true);

      const content = fs.readFileSync(gitignorePath, "utf8");
      patterns.forEach((pattern) => {
        expect(content).toContain(pattern);
      });
    });

    test("adds missing patterns to existing .gitignore", () => {
      // Create a gitignore with some patterns
      const gitignorePath = path.join(TEST_DIR, ".gitignore");
      fs.writeFileSync(gitignorePath, "node_modules/\ndist/\n");

      // Add some new patterns
      const newPatterns = [".env", "coverage/", "node_modules/"]; // One duplicate
      const result = updateGitignore(newPatterns);

      expect(result.success).toBe(true);
      expect(result.added.length).toBe(2); // Only new patterns

      const content = fs.readFileSync(gitignorePath, "utf8");
      expect(content).toContain("node_modules/");
      expect(content).toContain("dist/");
      expect(content).toContain(".env");
      expect(content).toContain("coverage/");
    });

    test("doesn't modify .gitignore if all patterns already exist", () => {
      // Create a gitignore with patterns
      const gitignorePath = path.join(TEST_DIR, ".gitignore");
      const original = "node_modules/\ndist/\n.env\n";
      fs.writeFileSync(gitignorePath, original);

      // Try to add the same patterns
      const result = updateGitignore(["node_modules/", "dist/", ".env"]);

      expect(result.success).toBe(true);
      expect(result.added.length).toBe(0); // No new patterns
      expect(result.messages).toContain("No changes needed to .gitignore");

      // Content should be unchanged
      const content = fs.readFileSync(gitignorePath, "utf8");
      expect(content).toBe(original);
    });

    test("adds newline to end of file if missing", () => {
      // Create a gitignore without trailing newline
      const gitignorePath = path.join(TEST_DIR, ".gitignore");
      fs.writeFileSync(gitignorePath, "node_modules/\ndist/", {
        encoding: "utf8",
      });

      // Add a new pattern
      const result = updateGitignore([".env"]);

      expect(result.success).toBe(true);

      // Should have added newline before adding pattern
      const content = fs.readFileSync(gitignorePath, "utf8");
      expect(content).toBe("node_modules/\ndist/\n.env\n");
    });
  });

  describe("updateGitignoreForCursor", () => {
    // Save original process.cwd and mock it to point to our test directory
    const originalCwd = process.cwd;

    beforeEach(() => {
      process.cwd = jest.fn().mockReturnValue(TEST_DIR);
    });

    afterEach(() => {
      process.cwd = originalCwd;
    });

    test("adds cursor-specific patterns to .gitignore", () => {
      const result = updateGitignoreForCursor();

      expect(result.success).toBe(true);
      expect(result.added.length).toBe(GITIGNORE_PATTERNS.length);

      const gitignorePath = path.join(TEST_DIR, ".gitignore");
      const content = fs.readFileSync(gitignorePath, "utf8");

      GITIGNORE_PATTERNS.forEach((pattern) => {
        expect(content).toContain(pattern);
      });
    });

    test("works with existing .gitignore", () => {
      // Create a gitignore with some other patterns
      const gitignorePath = path.join(TEST_DIR, ".gitignore");
      fs.writeFileSync(gitignorePath, "node_modules/\ndist/\n");

      const result = updateGitignoreForCursor();

      expect(result.success).toBe(true);

      const content = fs.readFileSync(gitignorePath, "utf8");
      expect(content).toContain("node_modules/");
      expect(content).toContain("dist/");
      GITIGNORE_PATTERNS.forEach((pattern) => {
        expect(content).toContain(pattern);
      });
    });
  });

  describe("createCursorDirectoryStructure", () => {
    // Save original process.cwd and mock it to point to our test directory
    const originalCwd = process.cwd;

    beforeEach(() => {
      process.cwd = jest.fn().mockReturnValue(TEST_DIR);
    });

    afterEach(() => {
      process.cwd = originalCwd;
    });

    test("creates all required cursor directories", () => {
      const result = createCursorDirectoryStructure();

      expect(result.success).toBe(true);
      expect(result.created.length).toBe(3); // .cursor, rules, local

      expect(fs.existsSync(path.join(TEST_DIR, ".cursor"))).toBe(true);
      expect(fs.existsSync(path.join(TEST_DIR, ".cursor", "rules"))).toBe(true);
      expect(fs.existsSync(path.join(TEST_DIR, ".cursor", "local"))).toBe(true);
    });

    test("succeeds but reports no creation when directories already exist", () => {
      // Create the directories first
      fs.mkdirSync(path.join(TEST_DIR, ".cursor"));
      fs.mkdirSync(path.join(TEST_DIR, ".cursor", "rules"));
      fs.mkdirSync(path.join(TEST_DIR, ".cursor", "local"));

      const result = createCursorDirectoryStructure();

      expect(result.success).toBe(true);
      expect(result.created.length).toBe(0); // None were created
    });

    test("handles mixed case of existing and new directories", () => {
      // Create only the main directory
      fs.mkdirSync(path.join(TEST_DIR, ".cursor"));

      const result = createCursorDirectoryStructure();

      expect(result.success).toBe(true);
      expect(result.created.length).toBe(2); // Only rules and local were created
      expect(fs.existsSync(path.join(TEST_DIR, ".cursor", "rules"))).toBe(true);
      expect(fs.existsSync(path.join(TEST_DIR, ".cursor", "local"))).toBe(true);
    });
  });

  describe("createDefaultRuleFiles", () => {
    // Save original process.cwd and mock it to point to our test directory
    const originalCwd = process.cwd;

    beforeEach(() => {
      process.cwd = jest.fn().mockReturnValue(TEST_DIR);
      // Create the necessary directories
      fs.mkdirSync(path.join(TEST_DIR, ".cursor"), { recursive: true });
      fs.mkdirSync(path.join(TEST_DIR, ".cursor", "rules"), {
        recursive: true,
      });
    });

    afterEach(() => {
      process.cwd = originalCwd;
    });

    test("creates all default rule files", () => {
      const result = createDefaultRuleFiles();

      expect(result.success).toBe(true);
      expect(result.created.length).toBe(
        Object.keys(DEFAULT_RULE_TEMPLATES).length
      );

      // Check that each default template file exists and has the correct content
      for (const [filename, content] of Object.entries(
        DEFAULT_RULE_TEMPLATES
      )) {
        const filePath = path.join(TEST_DIR, ".cursor", "rules", filename);
        expect(fs.existsSync(filePath)).toBe(true);
        expect(fs.readFileSync(filePath, "utf8")).toBe(content);
      }
    });

    test("doesn't overwrite existing rule files without force flag", () => {
      // Create a file that exists in the templates
      const existingFile = path.join(
        TEST_DIR,
        ".cursor",
        "rules",
        "default.mdc"
      );
      const customContent = "Custom rule content that shouldn't be overwritten";
      fs.writeFileSync(existingFile, customContent);

      const result = createDefaultRuleFiles();

      expect(result.success).toBe(true);
      expect(result.created.length).toBe(
        Object.keys(DEFAULT_RULE_TEMPLATES).length - 1
      ); // All except the existing file
      expect(fs.readFileSync(existingFile, "utf8")).toBe(customContent); // Original content preserved
    });

    test("overwrites existing rule files with force flag", () => {
      // Create a file that exists in the templates
      const existingFile = path.join(
        TEST_DIR,
        ".cursor",
        "rules",
        "default.mdc"
      );
      fs.writeFileSync(
        existingFile,
        "Custom rule content that should be overwritten"
      );

      const result = createDefaultRuleFiles(true);

      expect(result.success).toBe(true);
      expect(result.created.length).toBe(
        Object.keys(DEFAULT_RULE_TEMPLATES).length
      );
      expect(fs.readFileSync(existingFile, "utf8")).toBe(
        DEFAULT_RULE_TEMPLATES["default.mdc"]
      );
    });
  });

  describe("getRuleFilePath", () => {
    // Save original process.cwd and mock it to point to our test directory
    const originalCwd = process.cwd;

    beforeEach(() => {
      process.cwd = jest.fn().mockReturnValue(TEST_DIR);
      // Create the necessary directories
      fs.mkdirSync(path.join(TEST_DIR, ".cursor", "rules"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(TEST_DIR, ".cursor", "local"), {
        recursive: true,
      });
    });

    afterEach(() => {
      process.cwd = originalCwd;
    });

    test("returns correct path for a rule in project rules directory", () => {
      const result = getRuleFilePath("test-rule");

      expect(result.path).toBe(
        path.join(TEST_DIR, ".cursor", "rules", "test-rule.mdc")
      );
      expect(result.baseDir).toBe(path.join(TEST_DIR, ".cursor", "rules"));
      expect(result.exists).toBe(false);
    });

    test("returns correct path for a rule in local overrides directory", () => {
      const result = getRuleFilePath("test-rule", { local: true });

      expect(result.path).toBe(
        path.join(TEST_DIR, ".cursor", "local", "test-rule.mdc")
      );
      expect(result.baseDir).toBe(path.join(TEST_DIR, ".cursor", "local"));
      expect(result.exists).toBe(false);
    });

    test("doesn't append .mdc extension if already present", () => {
      const result = getRuleFilePath("test-rule.mdc");

      expect(result.path).toBe(
        path.join(TEST_DIR, ".cursor", "rules", "test-rule.mdc")
      );
    });

    test("correctly detects existing files", () => {
      // Create a file
      const filePath = path.join(
        TEST_DIR,
        ".cursor",
        "rules",
        "existing-rule.mdc"
      );
      fs.writeFileSync(filePath, "test content");

      const result = getRuleFilePath("existing-rule");

      expect(result.exists).toBe(true);
    });
  });

  describe("saveRuleToFile", () => {
    // Save original process.cwd and mock it to point to our test directory
    const originalCwd = process.cwd;

    beforeEach(() => {
      process.cwd = jest.fn().mockReturnValue(TEST_DIR);
      // Create the necessary directories
      fs.mkdirSync(path.join(TEST_DIR, ".cursor", "rules"), {
        recursive: true,
      });
      fs.mkdirSync(path.join(TEST_DIR, ".cursor", "local"), {
        recursive: true,
      });
    });

    afterEach(() => {
      process.cwd = originalCwd;
    });

    test("saves rule content to a new file", () => {
      const ruleName = "test-rule";
      const content = "# Test Rule Content";

      const result = saveRuleToFile(ruleName, content);

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);

      const filePath = path.join(TEST_DIR, ".cursor", "rules", "test-rule.mdc");
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, "utf8")).toBe(content);
    });

    test("saves rule to local directory when local option is true", () => {
      const ruleName = "local-rule";
      const content = "# Local Rule Content";

      const result = saveRuleToFile(ruleName, content, { local: true });

      expect(result.success).toBe(true);

      const filePath = path.join(
        TEST_DIR,
        ".cursor",
        "local",
        "local-rule.mdc"
      );
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, "utf8")).toBe(content);
    });

    test("fails if file exists and force is not set", () => {
      // Create an existing file
      const filePath = path.join(
        TEST_DIR,
        ".cursor",
        "rules",
        "existing-rule.mdc"
      );
      const originalContent = "Original content";
      fs.writeFileSync(filePath, originalContent);

      const result = saveRuleToFile("existing-rule", "New content");

      expect(result.success).toBe(false);
      expect(result.exists).toBe(true);
      expect(result.message).toContain("already exists");

      // Content should not be changed
      expect(fs.readFileSync(filePath, "utf8")).toBe(originalContent);
    });

    test("overwrites existing file when force is true", () => {
      // Create an existing file
      const filePath = path.join(
        TEST_DIR,
        ".cursor",
        "rules",
        "existing-rule.mdc"
      );
      fs.writeFileSync(filePath, "Original content");

      const newContent = "New content";
      const result = saveRuleToFile("existing-rule", newContent, {
        force: true,
      });

      expect(result.success).toBe(true);
      expect(result.created).toBe(true);

      // Content should be updated
      expect(fs.readFileSync(filePath, "utf8")).toBe(newContent);
    });

    test("returns error if directory creation fails", () => {
      // Mock createDirectory to fail
      const originalCreateDirectory = createDirectory;
      global.createDirectory = jest.fn().mockReturnValue({
        success: false,
        message: "Failed to create directory",
      });

      const result = saveRuleToFile("test-rule", "content");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to create directory");

      // Restore original function
      global.createDirectory = originalCreateDirectory;
    });
  });
});
