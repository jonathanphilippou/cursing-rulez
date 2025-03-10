# T011: Implement "rulez init" command - Generate default rule files

## Description

Extend the `rulez init` command to generate default rule files in the `.cursor/rules` directory. These default files will provide a starting point for project-specific Cursor rules, ensuring that the AI has some baseline instructions to follow even before users add specific rules from the Cursor Directory.

## Acceptance Criteria

- Command creates at least one default rule file in `.cursor/rules`
- Default rule files should be in the correct Cursor `.mdc` format
- Default rules should be generic and appropriate for most projects
- Files are only created if they don't already exist (or if `--force` is used)
- Command provides feedback about which rule files were created

## Implementation Steps

1. Create a utility function to write file content
2. Define default rule file templates with sensible default content
3. Implement the file creation logic in the init command
4. Handle existing files gracefully (check before overwriting)
5. Add appropriate user feedback via console messages
6. Test the implementation with different scenarios (new project, existing project)

## Dependencies

- T010: Implement "rulez init" command - Basic directory structure creation (completed)

## Notes

The default rule files should be simple and generic enough to work for most projects, while still providing some value. They should explain the purpose of Cursor rules and provide a template that users can modify as needed.
