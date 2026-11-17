import { describe, expect, it } from "vitest"
import { DEFAULT_CONFIG } from "@/utils/constants/config"
import { mergeWithArrayOverwrite } from "../config"

describe("mergeWithArrayOverwrite", () => {
  it("should overwrite arrays and merge objects in complex config scenarios", () => {
    const config = {
      language: DEFAULT_CONFIG.language,
      pageTranslation: {
        ...DEFAULT_CONFIG.pageTranslation,
        page: {
          ...DEFAULT_CONFIG.pageTranslation.page,
          autoTranslatePatterns: ["old.com"],
          autoTranslateLanguages: ["eng"],
        },
      },
      siteControl: {
        ...DEFAULT_CONFIG.siteControl,
        blacklistPatterns: ["gmail.com"],
      },
    }

    const patch = {
      language: { targetCode: "jpn" },
      pageTranslation: {
        page: {
          autoTranslatePatterns: ["new.com", "test.org"],
          autoTranslateLanguages: [],
        },
        mode: "replace",
      },
      siteControl: {
        blacklistPatterns: ["youtube.com"],
      },
    }

    const result = mergeWithArrayOverwrite(config, patch)

    // Arrays should be completely replaced
    expect(result.pageTranslation.page.autoTranslatePatterns).toEqual(["new.com", "test.org"])
    expect(result.pageTranslation.page.autoTranslateLanguages).toEqual([])
    expect(result.siteControl.blacklistPatterns).toEqual(["youtube.com"])

    expect(result.pageTranslation.mode).toBe("replace")
    expect(result.siteControl.mode).toBe("blacklist")

    // Ensure immutability
    expect(result).not.toBe(config)
    expect(result.pageTranslation.page.autoTranslatePatterns).not.toBe(
      config.pageTranslation.page.autoTranslatePatterns,
    )
  })

  it("should handle edge cases and type conversions", () => {
    // Array to non-array conversion
    expect(mergeWithArrayOverwrite({ arr: [1, 2] }, { arr: "string" })).toEqual({ arr: "string" })

    // Non-array to array conversion
    expect(mergeWithArrayOverwrite({ val: "text" }, { val: ["a", "b"] })).toEqual({
      val: ["a", "b"],
    })

    // Empty array overwrite
    expect(mergeWithArrayOverwrite({ items: ["x"] }, { items: [] })).toEqual({ items: [] })

    // Null/undefined handling
    expect(mergeWithArrayOverwrite({ a: null }, { a: 1, b: undefined })).toEqual({
      a: 1,
      b: undefined,
    })
  })
})
