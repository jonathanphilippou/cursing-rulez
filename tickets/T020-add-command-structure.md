# T020: Implement "rulez add" command - Command structure and argument parsing

## Description

Implement the basic structure of the `rulez add` command, focusing on the command-line argument parsing and validation. This ticket will establish the foundation for the `add` command, which will later be extended to retrieve rules from the Cursor Directory and handle local overrides.

## Acceptance Criteria

- Command accepts a rule name argument as required input
- Command accepts a `--local` flag to specify adding to local overrides
- Command accepts a `--force` flag to allow overwriting existing files
- Command validates input arguments and provides helpful error messages
- Command structure is ready to be extended with actual rule retrieval logic

## Implementation Steps

1. Refine the existing stub implementation of the add command
2. Implement validation of the rule name argument
3. Add support for the `--local` flag to specify adding to local overrides
4. Add support for the `--force` flag for overwriting existing files
5. Implement error handling and help messages
6. Test the command structure with various inputs and edge cases

## Dependencies

- T002: Set up basic CLI framework (Node.js + Commander.js) (completed)

## Notes

This ticket only focuses on the command structure and argument parsing. The actual implementation of retrieving rules from Cursor Directory and creating rule files will be handled in subsequent tickets (T021 and T022).
