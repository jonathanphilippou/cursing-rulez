# T100: Implement cursor.directory URL Support

## Description

Add support for adding rules directly from cursor.directory URLs. This enhancement will allow users to browse the Cursor Directory website, find rules they like, and add them to their project by simply copying and pasting the URL into the `rulez add` command.

## Acceptance Criteria

- The `add` command accepts a cursor.directory URL as input
- The URL is parsed to extract the rule name
- Content is fetched from the cursor.directory page
- The rule is saved with the correct name and content
- All existing options (`--local`, `--force`, `--offline`) work with URLs
- Appropriate error handling for invalid URLs or pages without rule content
- User feedback provides clear information about the URL handling process

## Implementation Steps

1. Enhance the `add` command to recognize and validate URLs
2. Create utility functions to parse cursor.directory URLs
3. Implement a scraper to extract rule content from cursor.directory pages
4. Update the rule-fetcher to handle different input types (name or URL)
5. Add comprehensive tests for URL handling
6. Update documentation to explain the new functionality

## Dependencies

- T020: Implement "rulez add" command - Command structure and argument parsing (completed)
- T021: Implement "rulez add" command - Integration with remote rule source (completed)
- T022: Implement "rulez add" command - Rule file creation and conflict handling (completed)

## Notes

The cursor.directory website structure might change over time, so the scraper implementation should be designed to be adaptable. If possible, we should look for stable HTML elements or patterns to extract the content from.
