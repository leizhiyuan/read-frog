import type { LanguageTag } from "@read-frog/definitions"
import { resolveLanguage } from "@read-frog/definitions"
import { franc } from "franc"
import { createLogger } from "@/utils/logging/logger"

const log = createLogger("content/language")

const DEFAULT_MIN_LENGTH = 10

export type DetectionSource = "franc" | "fallback"

export interface DetectLanguageOptions {
  /** Minimum text length to attempt detection (default: 10) */
  minLength?: number
}

export interface DetectLanguageResult {
  code: LanguageTag | "und"
  source: DetectionSource
}

/** Detect language of text using franc. */
export async function detectLanguageWithSource(
  text: string,
  options?: DetectLanguageOptions,
): Promise<DetectLanguageResult> {
  const trimmedText = text.trim()
  const minLength = options?.minLength ?? DEFAULT_MIN_LENGTH

  if (trimmedText.length < minLength) {
    return { code: "und", source: "fallback" }
  }

  const francResult = franc(trimmedText)
  if (francResult === "und") {
    return { code: "und", source: "fallback" }
  }

  // franc answers in ISO 639-3 (`cmn`, `por`, `als`). This is the only place
  // that code is read; from here on the language is a BCP 47 tag.
  const francLanguage = resolveLanguage(francResult)
  if (!francLanguage) {
    log.warn("franc returned a language with no BCP 47 mapping", { francResult })
    return { code: "und", source: "fallback" }
  }

  return { code: francLanguage, source: "franc" }
}

/** Detect language of text using franc. */
export async function detectLanguage(
  text: string,
  options?: DetectLanguageOptions,
): Promise<LanguageTag | null> {
  const result = await detectLanguageWithSource(text, options)
  return result.code === "und" ? null : result.code
}
