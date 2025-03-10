# T002: Set up basic CLI framework (Node.js + Commander.js)

## Description

Set up the core CLI framework for "Cursing Rulez" using Commander.js to handle command-line parsing and execution. This ticket establishes the foundation for all CLI commands that will be implemented in later tickets.

## Acceptance Criteria

- Install necessary dependencies (Commander.js, chalk for styling, etc.)
- Create a basic CLI structure that can parse commands and options
- Set up stub handlers for main commands (`init`, `add`)
- Ensure the CLI displays proper help information
- CLI should run without errors when invoked with no arguments

## Implementation Steps

1. Install required dependencies
2. Set up the main CLI structure in index.js
3. Create basic command files in the src/commands directory
4. Set up proper error handling for invalid commands
5. Implement version and help display
6. Test basic CLI invocation to ensure it works

## Dependencies

- T001: Initialize project repository and basic directory structure (completed)

## Notes

We're only implementing the command structure at this stage, not the actual functionality of the commands.
