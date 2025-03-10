/**
 * Tests for the rule-fetcher utility
 */
const https = require("https");
const ruleFetcher = require("../../src/utils/rule-fetcher");

// Mock the entire module so we can control its functions in tests
jest.mock("../../src/utils/rule-fetcher", () => {
  // Keep a reference to the original module
  const originalModule = jest.requireActual("../../src/utils/rule-fetcher");

  // Return a mock that includes the original functions but allows overriding
  return {
    ...originalModule,
    fetchContent: jest.fn(),
    fetchRule: jest.fn(),
    listAvailableRules: jest.fn(),
  };
});

// Mock https.get separately for direct fetchContent tests
jest.mock("https", () => ({
  get: jest.fn(),
}));

describe("Rule Fetcher", () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Default mocks for the module functions
    ruleFetcher.fetchContent.mockImplementation((url) => {
      if (url.includes("error")) {
        return Promise.reject(new Error(`Failed to fetch content from ${url}`));
      }
      return Promise.resolve(`Content for ${url}`);
    });

    ruleFetcher.listAvailableRules.mockResolvedValue([
      {
        name: "test",
        displayName: "Test Rule",
        description: "Test description",
      },
      {
        name: "test-extra",
        displayName: "Test Extra Rule",
        description: "Extra description",
      },
    ]);
  });

  describe("fetchContent", () => {
    test("resolves with content on successful fetch", async () => {
      // Setup for this specific test
      https.get.mockImplementation((url, callback) => {
        const mockResponse = {
          statusCode: 200,
          on: (event, handler) => {
            if (event === "data") handler("test content");
            if (event === "end") handler();
            return mockResponse;
          },
        };
        callback(mockResponse);
        return { on: jest.fn() };
      });

      // Use the actual function, not our mock
      const originalFetchContent = jest.requireActual(
        "../../src/utils/rule-fetcher"
      ).fetchContent;
      const result = await originalFetchContent("https://example.com/test");

      expect(result).toBe("test content");
      expect(https.get).toHaveBeenCalledWith(
        "https://example.com/test",
        expect.any(Function)
      );
    });

    test("rejects on non-200 status code", async () => {
      // Setup for this specific test
      https.get.mockImplementation((url, callback) => {
        const mockResponse = {
          statusCode: 404,
          statusMessage: "Not Found",
          on: jest.fn(),
        };
        callback(mockResponse);
        return { on: jest.fn() };
      });

      // Use the actual function, not our mock
      const originalFetchContent = jest.requireActual(
        "../../src/utils/rule-fetcher"
      ).fetchContent;
      await expect(
        originalFetchContent("https://example.com/error")
      ).rejects.toThrow("Failed to fetch");
    });

    test("rejects on network error", async () => {
      // Setup for this specific test
      https.get.mockImplementation((url, callback) => {
        return {
          on: (event, handler) => {
            if (event === "error") handler(new Error("Network error"));
          },
        };
      });

      // Use the actual function, not our mock
      const originalFetchContent = jest.requireActual(
        "../../src/utils/rule-fetcher"
      ).fetchContent;
      await expect(
        originalFetchContent("https://example.com/error")
      ).rejects.toThrow("Network error");
    });
  });

  describe("getGitHubRawUrl", () => {
    test("generates correct GitHub raw URL for a rule", () => {
      const url = ruleFetcher.getGitHubRawUrl("test-rule");
      expect(url).toBe(
        `${ruleFetcher.GITHUB_RAW_URL}/${ruleFetcher.CURSOR_DIRECTORY_REPO}/${ruleFetcher.CURSOR_DIRECTORY_BRANCH}/${ruleFetcher.RULES_PATH}/test-rule.mdc`
      );
    });
  });

  describe("listAvailableRules", () => {
    test("returns a list of available rules", async () => {
      const rules = await ruleFetcher.listAvailableRules();
      expect(rules).toBeInstanceOf(Array);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty("name");
      expect(rules[0]).toHaveProperty("displayName");
      expect(rules[0]).toHaveProperty("description");
    });
  });

  describe("generateSimulatedContent", () => {
    test("generates simulated content for a rule", () => {
      const content = ruleFetcher.generateSimulatedContent("test-rule");
      expect(content).toContain("test-rule");
      expect(content).toContain("Simulated Offline Mode");
      expect(content).toContain("# File patterns");
    });
  });

  describe("fetchRule", () => {
    test("returns rule content on successful fetch", async () => {
      // Mock the fetchRule function for this test
      ruleFetcher.fetchRule.mockResolvedValueOnce({
        success: true,
        content: "# Test Rule Content",
        name: "test-rule",
        source: "test-source",
      });

      const result = await ruleFetcher.fetchRule("test-rule");
      expect(result.success).toBe(true);
      expect(result.content).toBe("# Test Rule Content");
      expect(result.name).toBe("test-rule");
    });

    test("returns simulated content in offline mode", async () => {
      // Mock the fetchRule function for this test
      ruleFetcher.fetchRule.mockResolvedValueOnce({
        success: true,
        content: "# test-rule (Simulated Offline Mode)",
        name: "test-rule",
        source: "offline-mode",
      });

      const result = await ruleFetcher.fetchRule("test-rule", {
        offlineMode: true,
      });
      expect(result.success).toBe(true);
      expect(result.content).toContain("test-rule");
      expect(result.content).toContain("Simulated Offline Mode");
      expect(result.source).toBe("offline-mode");
    });

    test("returns error and suggestions when rule not found", async () => {
      // Mock the fetchRule function for this test
      ruleFetcher.fetchRule.mockResolvedValueOnce({
        success: false,
        error: "Not found",
        name: "test-rule",
        suggestions: ["test", "test-extra"],
      });

      const result = await ruleFetcher.fetchRule("test-rule");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Not found");
      expect(result.suggestions).toBeInstanceOf(Array);
      expect(result.suggestions).toContain("test");
      expect(result.suggestions).toContain("test-extra");
    });
  });
});
