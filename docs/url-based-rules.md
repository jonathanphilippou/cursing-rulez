# Adding Rules from cursor.directory URLs

The Cursing Rulez tool supports adding rules directly from [cursor.directory](https://cursor.directory) URLs. This feature allows you to easily import rules you discover while browsing the Cursor Directory website.

## Usage

```bash
rulez add <cursor.directory-url>
```

### Examples

```bash
# Add a front-end rule set from cursor.directory
rulez add https://cursor.directory/front-end-cursor-rules

# Add with options
rulez add https://cursor.directory/react --local --force
```

## How It Works

When you provide a URL from cursor.directory, the tool:

1. Recognizes the URL format
2. Extracts the rule name from the URL path
3. Fetches the content from the cursor.directory page
4. Saves the rule to your local project

## Options

The same options available for rule names work with URLs:

- `--local` - Save to local overrides instead of project rules
- `--force` - Overwrite existing files if they exist
- `--offline` - Use simulated content (for testing/development)

## Troubleshooting

### URL Not Recognized

If the URL isn't recognized, check that:

- It starts with `https://` or `http://`
- It's a valid cursor.directory URL
- The rule name is in the URL path

### Content Not Found

If the rule content can't be extracted from the page:

- Verify the URL is correct
- Check if the page structure has changed
- Try adding the rule by name instead

## Implementation Details

This feature works by:

1. Detecting if the input is a URL
2. Using specialized scraping for cursor.directory pages
3. Extracting rule content from the page
4. Saving the content with the correct rule name

For more technical details, see the source code in:

- `src/commands/add.js`
- `src/utils/rule-fetcher.js`
