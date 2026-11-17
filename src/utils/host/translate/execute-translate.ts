import type { Config } from "@/types/config/config"
import type { TranslateProviderConfig } from "@/types/config/provider"
import type { TranslationTextFormat } from "@/types/config/translate"
import { isNonAPIProvider, isPureAPIProvider } from "@/types/config/provider"
import { deeplTranslate } from "./api/deepl"
import { deeplxTranslate } from "./api/deeplx"
import { googleTranslate } from "./api/google"
import {
  toGoogleLanguageCode,
  toGoogleSourceCode,
  toMicrosoftLanguageCode,
  toMicrosoftSourceCode,
} from "./api/language-codes"
import { microsoftTranslate } from "./api/microsoft"
import { prepareTranslationText } from "./text-preparation"
import { normalizeTranslationOutput } from "./translation-output-normalization"

export async function executeTranslate(
  text: string,
  langConfig: Config["language"],
  providerConfig: TranslateProviderConfig,
  options?: {
    textFormat?: TranslationTextFormat
    preserveLineBreaks?: boolean
    signal?: AbortSignal
  },
) {
  const preparedText = prepareTranslationText(text)
  if (preparedText === "") {
    return ""
  }

  const { provider } = providerConfig
  let translatedText: string

  if (isNonAPIProvider(provider)) {
    const google = provider === "google-translate"
    const sourceLang = (google ? toGoogleSourceCode : toMicrosoftSourceCode)(langConfig.sourceCode)
    const targetLang = (google ? toGoogleLanguageCode : toMicrosoftLanguageCode)(
      langConfig.targetCode,
    )
    if (provider === "google-translate") {
      translatedText = await googleTranslate(preparedText, sourceLang, targetLang, {
        textFormat: options?.textFormat,
        preserveLineBreaks: options?.preserveLineBreaks,
        signal: options?.signal,
      })
    } else {
      translatedText = await microsoftTranslate(preparedText, sourceLang, targetLang, {
        textFormat: options?.textFormat,
        signal: options?.signal,
      })
    }
  } else if (isPureAPIProvider(provider)) {
    const { sourceCode, targetCode } = langConfig
    if (provider === "deeplx") {
      translatedText = await deeplxTranslate(preparedText, sourceCode, targetCode, providerConfig, {
        textFormat: options?.textFormat,
        signal: options?.signal,
      })
    } else {
      translatedText = await deeplTranslate(
        text,
        sourceCode,
        targetCode,
        providerConfig as Extract<TranslateProviderConfig, { provider: "deepl" }>,
        { textFormat: options?.textFormat, signal: options?.signal },
      )
    }
  } else {
    throw new Error(`Unknown provider: ${String(provider)}`)
  }

  return normalizeTranslationOutput(providerConfig, translatedText).trim()
}
