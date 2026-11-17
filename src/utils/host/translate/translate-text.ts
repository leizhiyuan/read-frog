import type { LanguageTag, LangLevel } from "@read-frog/definitions"
import type { ParagraphDiagnosis } from "./paragraph-diagnosis"
import type { Config } from "@/types/config/config"
import type { TranslateProviderConfig } from "@/types/config/provider"
import type { TranslationTextFormat } from "@/types/config/translate"
import { isSameLanguage } from "@read-frog/definitions"
import { toastManager } from "@/components/ui/base-ui/toast"
import { isAPIProviderConfig } from "@/types/config/provider"
import { detectLanguage } from "@/utils/content/language"
import { i18n } from "@/utils/i18n"
import { createLogger } from "@/utils/logging/logger"
import { TranslationCancelledError } from "@/utils/request/cancellation"
import { Sha256Hex } from "../../hash"
import { sendMessage } from "../../message"
import { getInMemoryTranslation, storeInMemoryTranslation } from "./in-memory-translation-cache"
import { prepareTranslationText } from "./text-preparation"
import { getPageTranslationSessionId } from "./translation-session"

const log = createLogger("host/translate/translate-text")

/**
 * Minimum text length before a skip decision is attempted at all. Deliberately
 * below the general threshold, to catch short phrases like "Bonjour!" or
 * "こんにちは".
 */
export const MIN_LENGTH_FOR_SKIP_LANGUAGE_DETECTION = 10

/** Check if text should be skipped based on language detection. */
export async function shouldSkipByLanguage(
  text: string,
  skipLanguages: LanguageTag[],
): Promise<boolean> {
  const detectedLang = await detectLanguage(text, {
    minLength: MIN_LENGTH_FOR_SKIP_LANGUAGE_DETECTION,
  })

  if (!detectedLang) {
    return false
  }

  return skipLanguages.some((language) => isSameLanguage(language, detectedLang))
}

export function normalizePromptContextValue(
  value: string | null | undefined,
): string | null | undefined {
  if (value === null || value === undefined) {
    return value
  }
  return value.trim() === "" ? null : value
}

export interface TranslateTextOptions {
  text: string
  langConfig: {
    sourceCode: LanguageTag | "auto"
    targetCode: LanguageTag
    level: LangLevel
  }
  providerConfig: TranslateProviderConfig
  extraHashTags?: string[]
  textFormat?: TranslationTextFormat
  // Source line breaks are semantic — see the enqueueTranslateRequest field.
  preserveLineBreaks?: boolean
  // Page-translation session id used for cancellation scoping. Deliberately
  // NOT part of the cache hash — cache identity must not vary per session.
  sessionId?: string
  forceRetranslation?: boolean
  /** Page translation: told when the answer is empty, and why. */
  diagnosis?: ParagraphDiagnosis
}

/**
 * Core translation function — pure, zero config fetching.
 * All dependencies must be provided explicitly.
 */
export async function translateTextCore(options: TranslateTextOptions): Promise<string> {
  const {
    text,
    langConfig,
    providerConfig,
    extraHashTags = [],
    textFormat = "plain",
    preserveLineBreaks = false,
    sessionId,
    forceRetranslation = false,
    diagnosis,
  } = options

  const preparedText = prepareTranslationText(text)
  if (preparedText === "") {
    diagnosis?.untranslated("noProse")
    return ""
  }

  // Early cancellation gate: a session stopped while this paragraph was still
  // preparing must not fire a request that will only be cancelled below.
  if (sessionId !== undefined && getPageTranslationSessionId() !== sessionId) {
    throw new TranslationCancelledError(sessionId)
  }

  const hashComponents = [
    preparedText,
    providerConfig.id,
    providerConfig.provider,
    langConfig.sourceCode,
    langConfig.targetCode,
    `textFormat:${textFormat}`,
  ]
  if (preserveLineBreaks) {
    hashComponents.push("preserveLineBreaks:true")
  }
  hashComponents.push(...extraHashTags)

  // Final gate before dispatch: if the page-translation session that owned
  // this request has ended (or been replaced) while we were preparing it,
  // abort instead of enqueueing.
  if (sessionId !== undefined && getPageTranslationSessionId() !== sessionId) {
    throw new TranslationCancelledError(sessionId)
  }

  const hash = Sha256Hex(...hashComponents)

  // In-tab memory tier over the background cache, same hash identity.
  if (sessionId !== undefined && !forceRetranslation) {
    const memoryHit = getInMemoryTranslation(hash)
    if (memoryHit !== undefined) {
      return toDisplayedResult(memoryHit, diagnosis)
    }
  }

  const result = await sendMessage("enqueueTranslateRequest", {
    text: preparedText,
    langConfig,
    providerConfig,
    scheduleAt: Date.now(),
    hash,
    textFormat,
    preserveLineBreaks,
    sessionId,
    forceRetranslation,
  })
  if (sessionId !== undefined) {
    // Raw result, sentinel included, so a "no translation needed" verdict is
    // remembered too; the mapping below stays the single mapping point.
    storeInMemoryTranslation(hash, result)
  }
  return toDisplayedResult(result, diagnosis)
}

/** The one place the "no translation needed" sentinel becomes "". */
function toDisplayedResult(result: string, diagnosis: ParagraphDiagnosis | undefined): string {
  if (!result.trim()) diagnosis?.untranslated("emptyResult")
  return result
}

export function validateTranslationConfigAndToast(
  config: Pick<Config, "providersConfig" | "pageTranslation" | "language">,
): boolean {
  const { providersConfig, pageTranslation: translateConfig, language: languageConfig } = config
  const provider = providersConfig.find((item) => item.id === translateConfig.providerId)
  if (!provider) {
    return false
  }

  if (
    languageConfig.sourceCode !== "auto" &&
    isSameLanguage(languageConfig.sourceCode, languageConfig.targetCode)
  ) {
    toastManager.add({ type: "error", title: i18n.t("translation.sameLanguage") })
    log.info("Page translation not started: source and target language are the same")
    return false
  }

  // check if the API key is configured
  if (isAPIProviderConfig(provider) && !provider.apiKey?.trim() && provider.provider !== "deeplx") {
    toastManager.add({ type: "error", title: i18n.t("noAPIKeyConfig.warning") })
    log.info("Page translation not started: the provider has no API key")
    return false
  }

  return true
}
