# T010: Implement "rulez init" command - Basic directory structure creation

## Description

Implement the core functionality of the `rulez init` command to create the basic directory structure for Cursor rules in a project. This includes creating the `.cursor/rules` and `.cursor/local` directories.

## Acceptance Criteria

- Command creates `.cursor` directory if it doesn't exist
- Command creates `.cursor/rules` subdirectory for shared rules
- Command creates `.cursor/local` subdirectory for local overrides
- Command is idempotent (can be run multiple times without error)
- Command respects the `--force` flag for handling existing directories
- Command provides appropriate feedback to the user about what was created

## Implementation Steps

1. Create a utility function to check if directories exist
2. Create a utility function to create directories
3. Implement the directory creation logic in the init command
4. Handle errors gracefully (e.g., permission issues)
5. Add appropriate user feedback via console messages
6. Test the implementation on both new and existing directories

## Dependencies

- T001: Initialize project repository and basic directory structure (completed)
- T002: Set up basic CLI framework (Node.js + Commander.js) (completed)
- T003: Create test framework setup (completed)

## Notes

This ticket only covers creating the directory structure. Adding default rule files and updating the .gitignore will be handled in separate tickets (T011 and T012 respectively).
