import type { LanguageTag } from "@read-frog/definitions"
import type { ParagraphDiagnosis } from "./paragraph-diagnosis"
import type { Config, InputTranslationLang } from "@/types/config/config"
import type { TranslateProviderConfig } from "@/types/config/provider"
import type { TranslationTextFormat } from "@/types/config/translate"
import { getDetectedCodeFromStorage, getFinalSourceCode } from "@/utils/config/languages"
import { createLogger } from "@/utils/logging/logger"
import { getLocalConfig } from "../../config/storage"
import { shouldSkipAsTargetLanguage } from "./target-language-skip"
import { prepareTranslationText } from "./text-preparation"
import {
  MIN_LENGTH_FOR_SKIP_LANGUAGE_DETECTION,
  shouldSkipByLanguage,
  translateTextCore,
} from "./translate-text"
import { getPageTranslationSessionId } from "./translation-session"

const log = createLogger("host/translate/translate-variants")

async function getConfigOrThrow(): Promise<Config> {
  const config = await getLocalConfig()
  if (!config) {
    throw new Error("No global config when translate text")
  }
  return config
}

function getProviderOrThrow(config: Config, providerId: string): TranslateProviderConfig {
  const provider = config.providersConfig.find((item) => item.id === providerId)
  if (!provider) {
    throw new Error(`No translation provider for id "${providerId}"`)
  }
  return provider
}

async function translateTextUsingPageConfig(
  config: Config,
  text: string,
  options: {
    extraHashTags?: string[]
    textFormat?: TranslationTextFormat
    preserveLineBreaks?: boolean
    sessionId?: string
    forceRetranslation?: boolean
    diagnosis?: ParagraphDiagnosis
  } = {},
): Promise<string> {
  const { diagnosis } = options
  const preparedText = prepareTranslationText(text)
  if (preparedText === "") {
    diagnosis?.untranslated("noProse")
    return ""
  }

  const providerConfig = getProviderOrThrow(config, config.pageTranslation.providerId)

  // Backstop only: the page modes hoist this check before DOM insertion, but
  // other callers (e.g. the page title) still rely on it here.
  if (await shouldSkipAsTargetLanguage(preparedText, config)) {
    log.debug("Skipped: already in the target language", { text: preparedText })
    diagnosis?.untranslated("targetLanguage")
    return ""
  }

  // Skip translation if text is in skipLanguages list (page translation only)
  const { skipLanguages } = config.pageTranslation.page
  if (skipLanguages.length > 0 && preparedText.length >= MIN_LENGTH_FOR_SKIP_LANGUAGE_DETECTION) {
    const shouldSkip = await shouldSkipByLanguage(preparedText, skipLanguages)
    if (shouldSkip) {
      log.debug("Skipped: in a language set to skip", { text: preparedText })
      diagnosis?.untranslated("skipLanguage")
      return ""
    }
  }

  return translateTextCore({
    text: preparedText,
    langConfig: config.language,
    providerConfig,
    extraHashTags: options.extraHashTags,
    textFormat: options.textFormat,
    preserveLineBreaks: options.preserveLineBreaks,
    sessionId: options.sessionId,
    forceRetranslation: options.forceRetranslation,
    diagnosis,
  })
}

export interface PageTranslationRequestOptions {
  preserveLineBreaks?: boolean
  forceRetranslation?: boolean
  /** Told why the answer is empty, by whichever step made it so. */
  diagnosis?: ParagraphDiagnosis
}

/** Page translation — uses the page translation provider. */
export async function translateTextForPage(
  text: string,
  textFormat: TranslationTextFormat = "plain",
  options?: PageTranslationRequestOptions,
): Promise<string> {
  // Capture the session id synchronously at pipeline entry. Reading it later
  // could see null if the user cancelled mid-request.
  const sessionId = getPageTranslationSessionId() ?? undefined
  const config = await getConfigOrThrow()

  return translateTextUsingPageConfig(config, text, {
    textFormat,
    preserveLineBreaks: options?.preserveLineBreaks,
    sessionId,
    forceRetranslation: options?.forceRetranslation,
    diagnosis: options?.diagnosis,
  })
}

/** Page title translation — uses page translation settings. */
export async function translateTextForPageTitle(text: string): Promise<string> {
  const sessionId = getPageTranslationSessionId() ?? undefined
  const config = await getConfigOrThrow()

  return translateTextUsingPageConfig(config, text, {
    extraHashTags: ["pageTitleTranslation"],
    sessionId,
  })
}

async function resolveInputLang(
  lang: InputTranslationLang,
  globalLangConfig: Config["language"],
): Promise<LanguageTag> {
  if (lang === "sourceCode") {
    const detectedCode = await getDetectedCodeFromStorage()
    return getFinalSourceCode(globalLangConfig.sourceCode, detectedCode)
  }
  if (lang === "targetCode") {
    return globalLangConfig.targetCode
  }
  return lang
}

/** Input translation — uses the input translation provider. */
export async function translateTextForInput(
  text: string,
  fromLang: InputTranslationLang,
  toLang: InputTranslationLang,
  onTargetLanguageResolved?: (targetLanguage: LanguageTag) => void,
): Promise<string> {
  const config = await getConfigOrThrow()
  const providerConfig = getProviderOrThrow(config, config.inputTranslation.providerId)

  const resolvedFromLang = await resolveInputLang(fromLang, config.language)
  const resolvedToLang = await resolveInputLang(toLang, config.language)
  onTargetLanguageResolved?.(resolvedToLang)

  if (resolvedFromLang === resolvedToLang) {
    return ""
  }

  return translateTextCore({
    text,
    langConfig: {
      sourceCode: resolvedFromLang,
      targetCode: resolvedToLang,
      level: config.language.level,
    },
    extraHashTags: [`inputTranslation:${fromLang}->${toLang}`],
    providerConfig,
    // User-typed newlines are always meaningful.
    preserveLineBreaks: true,
  })
}
