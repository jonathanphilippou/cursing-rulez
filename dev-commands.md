# Development Commands Reference

This document contains commonly used commands during development for quick reference.

## Project Setup

```bash
# Initialize npm project
npm init -y

# Install dependencies
npm install commander chalk inquirer

# Install dev dependencies
npm install --save-dev jest eslint prettier
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- <test-file-name>

# Run tests with coverage
npm test -- --coverage
```

## Development

```bash
# Run the CLI locally during development
node ./src/index.js <command>
```

## Building and Packaging

```bash
# Build the project
# Commands will be added when we implement this step
```
