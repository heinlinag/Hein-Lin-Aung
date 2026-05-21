import { describe, it, expect } from "vitest";

describe("Search Case Conversion", () => {
  describe("Production Order Search", () => {
    it("should convert lowercase to uppercase", () => {
      const input = "b-905";
      expect(input.toUpperCase()).toBe("B-905");
    });

    it("should convert single lowercase letter to uppercase", () => {
      const input = "a";
      expect(input.toUpperCase()).toBe("A");
    });

    it("should handle mixed case", () => {
      const input = "Ba-175";
      expect(input.toUpperCase()).toBe("BA-175");
    });

    it("should preserve already uppercase input", () => {
      const input = "B-905";
      expect(input.toUpperCase()).toBe("B-905");
    });

    it("should handle empty string", () => {
      const input = "";
      expect(input.toUpperCase()).toBe("");
    });

    it("should handle numeric only input", () => {
      const input = "123456";
      expect(input.toUpperCase()).toBe("123456");
    });

    it("should handle special characters", () => {
      const input = "b-905-x";
      expect(input.toUpperCase()).toBe("B-905-X");
    });
  });

  describe("BQ Comment Search", () => {
    it("should convert lowercase BQ comment to uppercase", () => {
      const input = "lr140mp100mp100mp100lr140";
      expect(input.toUpperCase()).toBe("LR140MP100MP100MP100LR140");
    });

    it("should convert single lowercase letter BQ to uppercase", () => {
      const input = "l";
      expect(input.toUpperCase()).toBe("L");
    });

    it("should handle mixed case BQ comment", () => {
      const input = "Lr140Mp100";
      expect(input.toUpperCase()).toBe("LR140MP100");
    });

    it("should preserve already uppercase BQ comment", () => {
      const input = "LR140MP100MP100MP100LR140";
      expect(input.toUpperCase()).toBe("LR140MP100MP100MP100LR140");
    });

    it("should handle empty BQ string", () => {
      const input = "";
      expect(input.toUpperCase()).toBe("");
    });

    it("should handle numeric only BQ", () => {
      const input = "140100100100140";
      expect(input.toUpperCase()).toBe("140100100100140");
    });
  });

  describe("Case Conversion Edge Cases", () => {
    it("should handle whitespace", () => {
      const input = "b-905 ";
      expect(input.toUpperCase()).toBe("B-905 ");
    });

    it("should handle multiple spaces", () => {
      const input = "b  905";
      expect(input.toUpperCase()).toBe("B  905");
    });

    it("should handle tabs and newlines", () => {
      const input = "b\t905\nb";
      expect(input.toUpperCase()).toBe("B\t905\nB");
    });

    it("should handle unicode characters", () => {
      const input = "café";
      expect(input.toUpperCase()).toBe("CAFÉ");
    });

    it("should handle very long input", () => {
      const input = "a".repeat(1000);
      expect(input.toUpperCase()).toBe("A".repeat(1000));
    });

    it("should handle alternating case", () => {
      const input = "aAbBcC";
      expect(input.toUpperCase()).toBe("AABBCC");
    });
  });

  describe("Search Matching with Case Conversion", () => {
    it("should match lowercase search with uppercase data", () => {
      const searchTerm = "b-905".toUpperCase();
      const data = "B-905";
      expect(data.includes(searchTerm)).toBe(true);
    });

    it("should match uppercase search with uppercase data", () => {
      const searchTerm = "B-905".toUpperCase();
      const data = "B-905";
      expect(data.includes(searchTerm)).toBe(true);
    });

    it("should match partial lowercase search", () => {
      const searchTerm = "b-9".toUpperCase();
      const data = "B-905";
      expect(data.includes(searchTerm)).toBe(true);
    });

    it("should not match unrelated search", () => {
      const searchTerm = "a-1".toUpperCase();
      const data = "B-905";
      expect(data.includes(searchTerm)).toBe(false);
    });

    it("should match BQ comment with case conversion", () => {
      const searchTerm = "lr140".toUpperCase();
      const data = "LR140MP100MP100MP100LR140";
      expect(data.includes(searchTerm)).toBe(true);
    });
  });
});
