/**
 * File utility functions for Cursing Rulez
 */
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

/**
 * Check if a directory exists
 * @param {string} dirPath - Path to check
 * @returns {boolean} True if directory exists, false otherwise
 */
function directoryExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file exists, false otherwise
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Create a directory if it doesn't exist
 * @param {string} dirPath - Path to create
 * @param {boolean} force - Whether to recreate if it exists but isn't a directory
 * @returns {Object} Result with success flag and message
 */
function createDirectory(dirPath, force = false) {
  try {
    // If path exists but is not a directory
    if (fs.existsSync(dirPath) && !fs.statSync(dirPath).isDirectory()) {
      if (force) {
        fs.unlinkSync(dirPath);
      } else {
        return {
          success: false,
          message: `Path exists but is not a directory: ${dirPath}. Use --force to overwrite.`,
        };
      }
    }

    // Create the directory if it doesn't exist
    if (!directoryExists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      return {
        success: true,
        message: `Created directory: ${dirPath}`,
        created: true,
      };
    }

    return {
      success: true,
      message: `Directory already exists: ${dirPath}`,
      created: false,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create directory: ${dirPath}. Error: ${error.message}`,
      error,
    };
  }
}

/**
 * Write content to a file
 * @param {string} filePath - Path of the file to write
 * @param {string} content - Content to write to the file
 * @param {boolean} force - Whether to overwrite existing file
 * @returns {Object} Result with success flag and message
 */
function writeFile(filePath, content, force = false) {
  try {
    // Check if file already exists
    if (fileExists(filePath) && !force) {
      return {
        success: true,
        message: `File already exists: ${filePath}`,
        created: false,
      };
    }

    // Ensure the parent directory exists
    const parentDir = path.dirname(filePath);
    const dirResult = createDirectory(parentDir);
    if (!dirResult.success) {
      return dirResult;
    }

    // Write the file
    fs.writeFileSync(filePath, content);
    return {
      success: true,
      message: `Created file: ${filePath}`,
      created: true,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to write file: ${filePath}. Error: ${error.message}`,
      error,
    };
  }
}

/**
 * Check if a line or pattern is already in a file
 * @param {string} filePath - Path to the file
 * @param {string} pattern - Pattern to check for
 * @returns {boolean} True if pattern is found, false otherwise
 */
function isPatternInFile(filePath, pattern) {
  if (!fileExists(filePath)) {
    return false;
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

    // Escape the pattern for use in regex
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Check for exact match or a match with trailing comment
    const regex = new RegExp(`^${escapedPattern}(\\s*#.*)?$`);

    return lines.some((line) => regex.test(line.trim()));
  } catch (error) {
    return false;
  }
}

/**
 * Ensure patterns are in the .gitignore file
 * @param {string[]} patterns - Patterns to add to .gitignore
 * @param {boolean} force - Whether to force update if the file doesn't exist
 * @returns {Object} Result with success flag, messages, and added patterns
 */
function updateGitignore(patterns, force = false) {
  const results = {
    success: true,
    messages: [],
    added: [],
  };

  const gitignorePath = path.join(process.cwd(), ".gitignore");

  // If .gitignore doesn't exist, create it
  if (!fileExists(gitignorePath)) {
    const result = writeFile(gitignorePath, patterns.join("\n") + "\n", force);
    results.messages.push(result.message);

    if (!result.success) {
      results.success = false;
      return results;
    }

    patterns.forEach((pattern) => results.added.push(pattern));
    results.messages.push(
      `Added ${patterns.length} pattern(s) to new .gitignore`
    );
    return results;
  }

  // If .gitignore exists, read it and check for patterns
  try {
    let content = fs.readFileSync(gitignorePath, "utf8");
    let modified = false;

    // Make sure content ends with a newline
    if (content.length > 0 && !content.endsWith("\n")) {
      content += "\n";
      modified = true;
    }

    // Add each pattern that's not already there
    for (const pattern of patterns) {
      if (!isPatternInFile(gitignorePath, pattern)) {
        content += pattern + "\n";
        results.added.push(pattern);
        modified = true;
      }
    }

    // If we modified the content, write it back
    if (modified) {
      fs.writeFileSync(gitignorePath, content);
      results.messages.push(
        `Updated .gitignore with ${results.added.length} new pattern(s)`
      );
    } else {
      results.messages.push("No changes needed to .gitignore");
    }

    return results;
  } catch (error) {
    results.success = false;
    results.messages.push(`Failed to update .gitignore: ${error.message}`);
    return results;
  }
}

/**
 * Create the directory structure for Cursor rules
 * @param {boolean} force - Whether to force creation if something exists but is not a directory
 * @param {string} basePath - Optional base path for the cursor directory (defaults to process.cwd())
 * @returns {Object} Result with success flag and messages
 */
function createCursorDirectoryStructure(force = false, basePath) {
  const results = {
    success: true,
    messages: [],
    created: [],
  };

  // Define the directories to create
  const actualBasePath = basePath || process.cwd();
  const cursorsDir = path.join(actualBasePath, ".cursor");
  const rulesDir = path.join(cursorsDir, "rules");
  const localDir = path.join(cursorsDir, "local");

  const directories = [
    { path: cursorsDir, description: "main Cursor rules" },
    { path: rulesDir, description: "shared project rules" },
    { path: localDir, description: "local override rules" },
  ];

  // Create each directory
  for (const dir of directories) {
    const result = createDirectory(dir.path, force);

    if (!result.success) {
      results.success = false;
      results.messages.push(result.message);
      return results;
    }

    results.messages.push(result.message);
    if (result.created) {
      results.created.push(dir.path);
    }
  }

  return results;
}

/**
 * Default rule file templates
 */
const DEFAULT_RULE_TEMPLATES = {
  "default.mdc": `# Cursor Default Rule

You are an expert AI coding assistant for this project. Follow these general guidelines:

1. Write clean, maintainable code that follows best practices for the language or framework being used.
2. Favor clarity over cleverness in your code suggestions.
3. When explaining code, be concise but informative.
4. Include helpful comments in code where appropriate.
5. Respect the existing code style and patterns in the project.
6. Consider performance implications of your suggestions.
7. When giving multiple options, explain the trade-offs.

# File patterns: **/*.*
`,

  "code-style.mdc": `# Code Style Guidelines

When working with code in this project, follow these style guidelines:

1. Use consistent indentation (2 spaces recommended).
2. Use meaningful variable and function names.
3. Add appropriate comments for complex logic.
4. Keep functions focused on a single responsibility.
5. Follow DRY (Don't Repeat Yourself) principles.
6. Write unit tests for new functionality when applicable.
7. Document public APIs and important functions.

# File patterns: **/*.js, **/*.ts, **/*.jsx, **/*.tsx
`,

  "readme-template.mdc": `# Documentation Template Rule

This rule provides guidance for creating and updating documentation files:

1. README.md should include:
   - Project title and description
   - Installation instructions
   - Usage examples
   - Configuration options
   - Contributing guidelines (if applicable)
   - License information

2. Documentation should be clear, concise, and helpful for both new and experienced users.
3. Use proper Markdown formatting for headings, code blocks, lists, etc.
4. Include screenshots or diagrams when they help explain concepts.

# File patterns: **/*.md
`,
};

/**
 * Create default rule files in the Cursor rules directory
 * @param {boolean} force - Whether to force creation even if files exist
 * @param {string} basePath - Optional base path for the cursor directory
 * @returns {Object} Result with success flag and messages
 */
function createDefaultRuleFiles(force = false, basePath) {
  const results = {
    success: true,
    messages: [],
    created: [],
  };

  // Define the rule files to create
  const actualBasePath = basePath || process.cwd();
  const rulesDir = path.join(actualBasePath, ".cursor", "rules");

  // Ensure the rules directory exists
  const dirResult = createDirectory(rulesDir);
  if (!dirResult.success) {
    results.success = false;
    results.messages.push(dirResult.message);
    return results;
  }

  // Create each default rule file
  for (const [filename, content] of Object.entries(DEFAULT_RULE_TEMPLATES)) {
    const filePath = path.join(rulesDir, filename);
    const result = writeFile(filePath, content, force);

    results.messages.push(result.message);
    if (!result.success) {
      results.success = false;
      return results;
    }

    if (result.created) {
      results.created.push(filePath);
    }
  }

  return results;
}

/**
 * Patterns to add to .gitignore
 */
const GITIGNORE_PATTERNS = [".cursor/local/", ".cursor-local.config"];

/**
 * Update .gitignore to exclude local overrides from version control
 * @param {boolean} force - Whether to force update if the file doesn't exist
 * @returns {Object} Result with success flag, messages, and added patterns
 */
function updateGitignoreForCursor(force = false) {
  return updateGitignore(GITIGNORE_PATTERNS, force);
}

/**
 * Get the path for a rule file
 * @param {string} ruleName - Name of the rule
 * @param {Object} options - Options for the file creation
 * @param {string} options.basePath - Optional base path for the cursor directory (defaults to process.cwd())
 * @param {boolean} options.local - Whether to use the local rules directory
 * @returns {Object} Object with target path and status
 */
function getRuleFilePath(ruleName, options = {}) {
  // Determine the base directory
  const basePath = options.basePath || process.cwd();
  const cursorDir = path.join(basePath, ".cursor");
  const baseDir = options.local
    ? path.join(cursorDir, "local")
    : path.join(cursorDir, "rules");

  // Ensure the rule name has the correct extension
  const fileName = ruleName.endsWith(".mdc") ? ruleName : `${ruleName}.mdc`;

  // Build the full file path
  const filePath = path.join(baseDir, fileName);

  return {
    path: filePath,
    exists: fileExists(filePath),
    baseDir,
  };
}

/**
 * Save a rule to a file
 * @param {string} ruleName - Name of the rule
 * @param {string} content - Content of the rule
 * @param {Object} options - Options for saving (force, local, basePath)
 * @param {boolean} options.force - Whether to overwrite existing files
 * @param {boolean} options.local - Whether to save to the local rules directory
 * @param {string} options.basePath - Optional base path for the cursor directory
 * @returns {Object} Result with success flag and messages
 */
function saveRuleToFile(ruleName, content, options = {}) {
  // Get the target file path
  const {
    path: filePath,
    exists,
    baseDir,
  } = getRuleFilePath(ruleName, options);

  // Make sure the directory exists
  const dirResult = createDirectory(baseDir);
  if (!dirResult.success) {
    return {
      success: false,
      message: dirResult.message,
    };
  }

  // Check for existing file if not forcing
  if (exists && !options.force) {
    return {
      success: false,
      message: `Rule file already exists: ${filePath}. Use --force to overwrite.`,
      exists: true,
    };
  }

  // Write the file
  const result = writeFile(filePath, content, options.force);
  return {
    success: result.success,
    message: result.message,
    created: result.created,
    path: filePath,
  };
}

/**
 * Check if the Cursor rules directory structure exists
 * @param {string} basePath - Optional base path for the cursor directory
 * @returns {boolean} True if the directory structure exists, false otherwise
 */
function checkCursorRulesDirectoryExists(basePath) {
  const actualBasePath = basePath || process.cwd();
  const cursorsDir = path.join(actualBasePath, ".cursor");
  const rulesDir = path.join(cursorsDir, "rules");

  return directoryExists(cursorsDir) && directoryExists(rulesDir);
}

module.exports = {
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
  checkCursorRulesDirectoryExists,
};
