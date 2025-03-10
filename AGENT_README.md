# Agent Workflow Guide for Cursing Rulez

This document outlines the structured workflow for AI agents working on the Cursing Rulez project. Follow this guide to maintain consistent development practices and ensure high-quality code contributions.

## Overview Algorithm

When tackling tasks in this project, follow this general algorithm:

1. **Understand the current state** - Examine codebase structure and existing functionality
2. **Design high-level approach** - Create a conceptual design for the feature/fix
3. **Break down into tickets** - Create small, manageable tickets for implementation
4. **Prioritize tickets** - Determine logical implementation order
5. **For each ticket:**
   - Write tests first (TDD approach)
   - Implement functionality to pass tests
   - Document code and features
   - Make atomic git commits
6. **Update documentation** - Ensure docs reflect new functionality
7. **Verify completion** - Mark tickets as complete in tickets.md

## Project Organization

### Codebase Structure

```
cursing-rulez/
├── src/                # Source code
│   ├── commands/       # CLI command implementations
│   ├── utils/          # Shared utilities
│   └── index.js        # Entry point
├── tests/              # Test files
│   ├── commands/       # Command tests
│   └── utils/          # Utility tests
├── docs/               # Documentation
├── .cursor/            # Cursor rules
├── tickets.md          # Project tickets tracker
└── tickets/            # Detailed ticket descriptions
```

### Tickets System

This project uses a tickets system to track and manage development tasks. Tickets provide structure and ensure all required features are implemented.

#### Ticket Lifecycle

1. **Creation** - New tickets are added to `tickets.md` with format: `- [ ] T###: Brief description`
2. **Detailing** - Create a detailed ticket file in `tickets/` directory (e.g., `tickets/T001-feature-name.md`)
3. **Implementation** - Follow TDD approach to implement the ticket
4. **Completion** - Mark as complete in `tickets.md`: `- [x] T###: Brief description`

#### Ticket File Structure

```markdown
# T###: Ticket Title

## Description

Detailed description of the feature or issue.

## Acceptance Criteria

- List of requirements to consider the ticket complete

## Implementation Steps

1. Step-by-step implementation guide
2. ...

## Dependencies

- List of prerequisite tickets

## Notes

Additional information
```

## Test-Driven Development (TDD)

This project follows a strict TDD approach:

1. **Write tests first** - Before implementing functionality, write tests that define expected behavior
2. **Run tests (they should fail)** - Verify that tests correctly fail when functionality isn't present
3. **Implement functionality** - Write the minimum code needed to pass tests
4. **Run tests again (they should pass)** - Verify implementation works as expected
5. **Refactor** - Clean up code while ensuring tests still pass

### Running Tests

Use the following commands to run tests:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/path/to/test.js

# Run tests with coverage reporting
npm test -- --coverage
```

## Git Workflow

Follow these practices for git commits:

1. **Create feature branches** - For each ticket, create a branch: `git checkout -b feature/T###-brief-description`
2. **Make atomic commits** - Each commit should represent a single logical change
3. **Descriptive commit messages** - Format: `T###: Brief description of changes`
4. **Commit after each passing test** - When a test passes, commit the changes
5. **Merge when complete** - When ticket is complete, merge to master: `git checkout master && git merge feature/T###-brief-description`

## Documentation Practices

Documentation is crucial for project maintainability:

1. **Code comments** - Document complex logic and function purposes
2. **JSDoc annotations** - Use JSDoc for all functions and classes
3. **Update README.md** - Keep main documentation current
4. **Document conventions** - Add new conventions to this guide
5. **Create user guides** - Add user-facing documentation in `docs/`

### Critical Information to Document

- CLI command usage examples
- Project setup instructions
- Testing procedures
- Common workflows
- Configuration options

## High-Level Design Process

When implementing new features:

1. **Understand requirements** - Clearly define what the feature should accomplish
2. **System design** - Create a high-level design of components and interactions
3. **Interface design** - Define function signatures and module interfaces
4. **Dependency analysis** - Identify impacts on existing code
5. **Implementation strategy** - Determine approach and break into tickets

## Example Workflow for a Feature

Let's walk through implementing a feature like "Add support for cursor.directory URLs":

1. **High-level design**:

   - Enhance `add` command to recognize URLs
   - Create utilities to parse URLs and extract rule information
   - Implement scraper for cursor.directory pages
   - Update rule-fetcher to support URL-based fetching

2. **Break into tickets**:

   - T101: URL parameter support in Add command
   - T102: URL parser utility
   - T103: Cursor.directory scraper implementation
   - T104: Multi-source rule fetcher enhancement

3. **For ticket T101**:

   - Write tests for URL parameter handling
   - Implement URL detection in add command
   - Update command interface
   - Document new functionality
   - Commit changes: `T101: Add URL parameter support to add command`

4. **Continue with remaining tickets...**

## Common Commands & Operations

### Testing Project

```bash
# Run all tests
npm test

# Run specific tests
npm test -- tests/commands/add.test.js
```

### CLI Testing

```bash
# Initialize a test project
mkdir -p ~/test-project && cd ~/test-project
node /path/to/cursing-rulez/src/index.js init

# Add a rule by name
node /path/to/cursing-rulez/src/index.js add rule-name

# Add a rule by URL
node /path/to/cursing-rulez/src/index.js add https://cursor.directory/rule-name
```

### Development

```bash
# Install dependencies
npm install

# Link for local development
npm link

# Use linked CLI
rulez --help
```

## Conclusion

Following this structured workflow ensures consistent, high-quality contributions to the Cursing Rulez project. This document should evolve as the project grows—if you discover new patterns or best practices, please update this guide accordingly.

Remember: document extensively, test thoroughly, and commit regularly.
