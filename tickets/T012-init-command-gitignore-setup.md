# T012: Implement "rulez init" command - Setup .gitignore configuration

## Description

Extend the `rulez init` command to update the project's `.gitignore` file to exclude the local overrides directory (`.cursor/local` and `.cursor-local.config`) from version control. This ensures that individual developers can have their own local rule overrides without affecting the shared project rules.

## Acceptance Criteria

- Command checks for an existing `.gitignore` file in the project root
- If no `.gitignore` exists, creates one with entries for local overrides
- If `.gitignore` exists, adds entries only if they're not already present
- Entries should include `.cursor/local/` and `.cursor-local.config`
- Command provides feedback about the `.gitignore` updates
- Command respects the `--force` flag for handling existing entries

## Implementation Steps

1. Create a utility function to check if a path is already in `.gitignore`
2. Create a utility function to update or create a `.gitignore` file
3. Implement the `.gitignore` update logic in the init command
4. Handle errors gracefully (e.g., permission issues)
5. Add appropriate user feedback via console messages
6. Test the implementation with different scenarios (new project, existing project, already configured project)

## Dependencies

- T010: Implement "rulez init" command - Basic directory structure creation (completed)
- T011: Implement "rulez init" command - Generate default rule files (completed)

## Notes

This is the final step to complete the `rulez init` command's implementation, ensuring that local overrides are properly handled by version control.
