# Cursing Rulez

A CLI tool for managing Cursor editor rules, similar to a package manager but specifically for Cursor rules.

## Overview

Cursing Rulez (`rulez`) is a command-line utility that simplifies the process of setting up, sharing, and managing [Cursor editor](https://cursor.sh/) rules across projects. It provides commands for initializing a project with a standard `.cursor` structure, adding community rules from Cursor Directory, and handling local overrides for individual developers.

### What Are Cursor Rules?

Cursor rules are configuration files that guide how the Cursor AI coding assistant behaves within a project. They act like custom system prompts, shaping AI responses to follow your project's conventions and coding style. Cursor supports two levels of rules:

- **Global rules** - Set by each user (via Cursor's settings) and apply to all projects
- **Project-specific rules** - Live in the code repository and apply only to that project

With Cursing Rulez, you can easily initialize, manage, and share project-specific rules while also supporting local developer customizations.

## Installation

```bash
# Install globally
npm install -g cursing-rulez

# Verify installation
rulez --version
```

## Usage

### Initialize a Project with Cursor Rules Structure

```bash
# Initialize the current directory with a Cursor rules structure
rulez init

# Force overwrite existing files (use with caution)
rulez init --force
```

This command creates:

- `.cursor/rules/` directory for shared project rules
- `.cursor/local/` directory for user-specific local overrides
- Updates `.gitignore` to exclude local overrides

### Add Rules from Cursor Directory

```bash
# Add a community rule to project rules
rulez add <rule-name>

# Example: Add Next.js best practices rule
rulez add nextjs-best-practices

# Add a rule directly from a cursor.directory URL
rulez add https://cursor.directory/front-end-cursor-rules

# Force overwrite if the rule already exists
rulez add react --force
```

### Add Local Override Rules

```bash
# Add a rule to local overrides (not tracked by git)
rulez add <rule-name> --local

# Example: Add a personal preference rule locally
rulez add my-style-preferences --local
```

## Command Reference

### `rulez init`

Initializes a project with the necessary structure for Cursor rules.

Options:

- `--force` - Overwrite existing files if they exist

### `rulez add <rule-name|url>`

Adds a rule from the Cursor Directory to your project.

Options:

- `--force` - Overwrite existing rule file if it exists
- `--local` - Add to local overrides instead of project rules
- `--offline` - Use simulated content when offline or for testing

You can provide either a rule name or a cursor.directory URL. For more details on using URLs, see [url-based-rules.md](docs/url-based-rules.md).

## Understanding Local Overrides

Project-specific rules in `.cursor/rules/` are meant to be shared and committed to version control. However, individual developers might want to customize their AI behavior without affecting teammates.

The `.cursor/local/` directory provides a place for personal rule files that aren't tracked by git. Developers can add their custom rules here using `rulez add --local`.

To apply these local overrides:

1. Add rules to `.cursor/local/` using `rulez add <rule-name> --local`
2. Consider copying the content of those rules into your global Cursor settings

## Project Structure

After initialization, your project will have this structure:

```
your-project/
├── .cursor/
│   ├── rules/        # Shared project rules (tracked by git)
│   │   └── *.mdc     # Individual rule files
│   └── local/        # Local overrides (not tracked by git)
│       └── *.mdc     # Personal rule files
└── .gitignore        # Updated to exclude .cursor/local/
```

## Troubleshooting

**Q: Rules aren't being applied in Cursor**  
A: Make sure your rule files have the `.mdc` extension and are placed in the correct directory.

**Q: My local overrides aren't working**  
A: Remember that local rules must be manually copied to your global Cursor settings or applied through Cursor's UI.

## Development Status

This project is currently under active development. See [tickets.md](tickets.md) for implementation progress.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
