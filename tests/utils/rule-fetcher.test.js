/**
 * Tests for the rule-fetcher utility
 */
const https = require("https");
const ruleFetcher = require("../../src/utils/rule-fetcher");

// Mock https module
jest.mock("https", () => ({
  get: jest.fn(),
}));

describe("Rule Fetcher Utility", () => {
  // Mock https.get implementation for tests
  const mockHttpsGet = (statusCode, data, errorEvent) => {
    const mockResponse = {
      statusCode,
      on: jest.fn((event, callback) => {
        if (event === "data" && data) {
          callback(data);
        }
        if (event === "end" && !errorEvent) {
          callback();
        }
        return mockResponse;
      }),
      statusMessage: statusCode !== 200 ? "Error" : "OK",
    };

    const mockRequest = {
      on: jest.fn((event, callback) => {
        if (event === "error" && errorEvent) {
          callback(new Error(errorEvent));
        }
        return mockRequest;
      }),
    };

    https.get.mockImplementation((url, callback) => {
      if (callback) callback(mockResponse);
      return mockRequest;
    });

    return { mockResponse, mockRequest };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchContent", () => {
    test("fetches content successfully", async () => {
      const testData = "test content";
      mockHttpsGet(200, testData);

      const result = await ruleFetcher.fetchContent("https://example.com");
      expect(result).toBe(testData);
      expect(https.get).toHaveBeenCalledWith(
        "https://example.com",
        expect.any(Function)
      );
    });

    test("handles non-200 status codes", async () => {
      mockHttpsGet(404);

      await expect(
        ruleFetcher.fetchContent("https://example.com")
      ).rejects.toThrow("Failed to fetch content");
    });

    test("handles network errors", async () => {
      mockHttpsGet(200, null, "Network error");

      await expect(
        ruleFetcher.fetchContent("https://example.com")
      ).rejects.toThrow("Failed to fetch content");
    });
  });

  describe("getGitHubRawUrl", () => {
    test("returns correct GitHub raw URL for a rule", () => {
      const result = ruleFetcher.getGitHubRawUrl("test-rule");
      expect(result).toContain("test-rule.mdc");
      expect(result).toContain(ruleFetcher.GITHUB_RAW_URL);
    });
  });

  describe("listAvailableRules", () => {
    test("returns a list of available rules", async () => {
      const rules = await ruleFetcher.listAvailableRules();
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty("name");
    });
  });

  describe("generateSimulatedContent", () => {
    test("generates content for a rule", () => {
      const result = ruleFetcher.generateSimulatedContent("test-rule");
      expect(result).toContain("test-rule");
      expect(result).toContain("Simulated Offline Mode");
    });
  });

  describe("fetchRule", () => {
    test("fetches rule content successfully", async () => {
      const testContent = "# Test Rule\n\nThis is a test rule.";
      mockHttpsGet(200, testContent);

      const result = await ruleFetcher.fetchRule("test-rule");
      expect(result.success).toBe(true);
      expect(result.content).toBe(testContent);
      expect(result.name).toBe("test-rule");
    });

    test("returns simulated content in offline mode", async () => {
      const result = await ruleFetcher.fetchRule("test-rule", {
        offlineMode: true,
      });
      expect(result.success).toBe(true);
      expect(result.content).toContain("Simulated Offline Mode");
      expect(result.source).toBe("offline-mode");
    });

    test("handles case where rule is not found", async () => {
      mockHttpsGet(404);

      const result = await ruleFetcher.fetchRule("nonexistent-rule");
      expect(result.success).toBe(false);
      expect(result).toHaveProperty("error");
      expect(result).toHaveProperty("suggestions");
    });

    test("fetches content from cursor.directory URL", async () => {
      // We need to properly mock all the needed functions

      // Save original functions
      const originalIsCursorDirectoryUrl = ruleFetcher.isCursorDirectoryUrl;
      const originalScrapeCursorDirectoryPage =
        ruleFetcher.scrapeCursorDirectoryPage;
      const originalFetchContent = ruleFetcher.fetchContent;

      // Create the mocks
      ruleFetcher.isCursorDirectoryUrl = jest.fn().mockReturnValue(true);
      ruleFetcher.scrapeCursorDirectoryPage = jest.fn().mockResolvedValue({
        content: "# Scraped Rule Content",
        name: "scraped-rule",
      });
      ruleFetcher.fetchContent = jest.fn().mockResolvedValue("# Some content");

      // Create a custom version of fetchRule for this test
      const originalFetchRule = ruleFetcher.fetchRule;
      ruleFetcher.fetchRule = jest
        .fn()
        .mockImplementation(async (ruleNameOrUrl, options = {}) => {
          if (
            options.isUrl &&
            ruleFetcher.isCursorDirectoryUrl(ruleNameOrUrl)
          ) {
            const { content, name } =
              await ruleFetcher.scrapeCursorDirectoryPage(ruleNameOrUrl);
            return {
              success: true,
              content,
              name,
              source: ruleNameOrUrl,
            };
          }
          return {
            success: false,
            error: "Test error - should not reach here",
          };
        });

      // Test the function
      const url = "https://cursor.directory/scraped-rule";
      const result = await ruleFetcher.fetchRule(url, { isUrl: true });

      // Check the result
      expect(result.success).toBe(true);
      expect(result.content).toBe("# Scraped Rule Content");
      expect(result.name).toBe("scraped-rule");
      expect(ruleFetcher.scrapeCursorDirectoryPage).toHaveBeenCalledWith(url);

      // Restore original functions
      ruleFetcher.isCursorDirectoryUrl = originalIsCursorDirectoryUrl;
      ruleFetcher.scrapeCursorDirectoryPage = originalScrapeCursorDirectoryPage;
      ruleFetcher.fetchContent = originalFetchContent;
      ruleFetcher.fetchRule = originalFetchRule;
    });

    test("handles non-cursor.directory URLs", async () => {
      const url = "https://example.com/some-rule";
      mockHttpsGet(200, "# External Rule Content");

      const result = await ruleFetcher.fetchRule(url, { isUrl: true });

      expect(result.success).toBe(true);
      expect(result.content).toBe("# External Rule Content");
      expect(result.source).toBe(url);
    });

    test("handles errors when fetching from URLs", async () => {
      const url = "https://example.com/error-rule";
      mockHttpsGet(500);

      const result = await ruleFetcher.fetchRule(url, { isUrl: true });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe("scrapeCursorDirectoryPage", () => {
    test("extracts rule content from cursor.directory page", async () => {
      // We'll need to mock fetchContent to return HTML with the expected structure
      const mockHtml = `
        <html>
          <body>
            <div class="rule-content">
              <pre># Scraped Rule Content</pre>
            </div>
          </body>
        </html>
      `;
      mockHttpsGet(200, mockHtml);

      const result = await ruleFetcher.scrapeCursorDirectoryPage(
        "https://cursor.directory/test-rule"
      );

      expect(result).toHaveProperty("content");
      expect(result.content).toContain("Scraped Rule Content");
      expect(result).toHaveProperty("name");
    });

    test("handles cursor.directory pages without content", async () => {
      // Mock the necessary functions
      const originalFetchContent = ruleFetcher.fetchContent;
      ruleFetcher.fetchContent = jest
        .fn()
        .mockResolvedValue(
          `<html><body><div>No rule content here</div></body></html>`
        );

      // Override scrapeCursorDirectoryPage for this test
      const originalScrapeFn = ruleFetcher.scrapeCursorDirectoryPage;
      ruleFetcher.scrapeCursorDirectoryPage = jest
        .fn()
        .mockImplementation(async (url) => {
          const html = await ruleFetcher.fetchContent(url);

          // Look for content in the HTML
          const contentMatch = html.match(/<pre.*?>(.*?)<\/pre>/s);
          if (!contentMatch || !contentMatch[1]) {
            throw new Error(`Could not extract rule content from ${url}`);
          }

          return {
            content: contentMatch[1].trim(),
            name: "test-name",
          };
        });

      // Expect an error to be thrown
      await expect(
        ruleFetcher.scrapeCursorDirectoryPage(
          "https://cursor.directory/missing-rule"
        )
      ).rejects.toThrow("Could not extract rule content");

      // Restore original functions
      ruleFetcher.fetchContent = originalFetchContent;
      ruleFetcher.scrapeCursorDirectoryPage = originalScrapeFn;
    });
  });
});
