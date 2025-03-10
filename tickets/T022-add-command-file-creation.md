# T022: Implement "rulez add" command - Rule file creation and conflict handling

## Description

Complete the `rulez add` command implementation by adding the ability to save fetched rule content to appropriate files in the correct directory. This includes handling conflicts when rules already exist and supporting both project-wide and local override files.

## Acceptance Criteria

- Command writes fetched rule content to `.cursor/rules` or `.cursor/local` depending on options
- Command creates files with proper `.mdc` extension in the correct directory
- Command handles existing files gracefully (respects `--force` flag)
- Command provides clear feedback on file creation or errors
- Command exits with appropriate exit codes on success or failure
- Command properly handles edge cases like permission issues or disk space problems

## Implementation Steps

1. Create a utility function to determine the appropriate target directory and filename
2. Implement rule file writing with error handling
3. Add conflict detection and resolution (skip or overwrite based on force flag)
4. Integrate the file creation into the add command
5. Add appropriate user feedback for the file creation step
6. Test the implementation with various scenarios (new rules, existing rules, local overrides)

## Dependencies

- T020: Implement "rulez add" command - Command structure and argument parsing (completed)
- T021: Implement "rulez add" command - Integration with remote rule source (Cursor Directory) (completed)

## Notes

This is the final step to complete the core functionality of the `add` command. After this ticket is implemented, users will be able to add rules from remote sources to their projects with a single command.
