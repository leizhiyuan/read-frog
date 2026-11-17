import { langLevel } from "@read-frog/definitions"
import { z } from "zod"
import { FEATURE_KEYS, FEATURE_PROVIDER_DEFS } from "@/utils/constants/feature-providers"
import {
  doesProviderSupportsCapability,
  getProviderIdsForCapability,
} from "@/utils/providers/provider-registry"
import { storedLanguageTagSchema } from "./language-tag"
import { providersConfigSchema } from "./provider"
import { siteRulesConfigSchema } from "./site-rules"
import { videoSubtitlesSchema } from "./subtitles"
import { translateConfigSchema } from "./translate"

// Language schema
const languageSchema = z.object({
  sourceCode: storedLanguageTagSchema.or(z.literal("auto")),
  targetCode: storedLanguageTagSchema,
  level: langLevel,
})

// input translation language selector: 'sourceCode', 'targetCode', or fixed language code
const inputTranslationLangSchema = z.union([
  z.literal("sourceCode"),
  z.literal("targetCode"),
  storedLanguageTagSchema,
])

// input translation schema (triple-space trigger)
const inputTranslationSchema = z.object({
  enabled: z.boolean(),
  providerId: z.string().nonempty(),
  fromLang: inputTranslationLangSchema,
  toLang: inputTranslationLangSchema,
  enableCycle: z.boolean(),
  timeThreshold: z.number().min(100).max(1000),
})

// Export types for use in components
export type InputTranslationLang = z.infer<typeof inputTranslationLangSchema>

// site control schema
const siteControlSchema = z.object({
  mode: z.enum(["blacklist", "whitelist"]),
  blacklistPatterns: z.array(z.string()),
  whitelistPatterns: z.array(z.string()),
})

// Interface language for the extension UI, independent of the browser language.
// "auto" follows the browser UI language; explicit values are the supported locales.
// MUST stay in sync with SUPPORTED_UI_LOCALES in `@/utils/i18n/resources` and `src/locales/`.
// `.default("auto")` is load-bearing: it lets configs stored before this field existed still
// parse successfully, avoiding the destructive fallback-to-DEFAULT_CONFIG path in
// `writeConfigAtom` / `initializeConfig` during the upgrade window.
const uiLanguageSchema = z
  .enum(["auto", "az", "en", "es", "ja", "ko", "ru", "tr", "vi", "zh-CN", "zh-TW"])
  .default("auto")
export type UiLanguage = z.infer<typeof uiLanguageSchema>

// Complete config schema
export const configSchema = z
  .object({
    language: languageSchema,
    providersConfig: providersConfigSchema,
    pageTranslation: translateConfigSchema,
    inputTranslation: inputTranslationSchema,
    videoSubtitles: videoSubtitlesSchema,
    siteControl: siteControlSchema,
    siteRules: siteRulesConfigSchema,
    uiLanguage: uiLanguageSchema,
  })
  .superRefine((data, ctx) => {
    for (const featureKey of FEATURE_KEYS) {
      const def = FEATURE_PROVIDER_DEFS[featureKey]
      const providerId = def.getProviderId(data)

      if (
        !doesProviderSupportsCapability(featureKey, data.providersConfig, providerId, {
          requireEnable: true,
        })
      ) {
        ctx.addIssue({
          code: "invalid_value",
          values: getProviderIdsForCapability(featureKey, data.providersConfig, {
            requireEnable: true,
          }),
          message: `Invalid provider id "${providerId}".`,
          path: [...def.configPath],
        })
        continue
      }
    }
  })

export type Config = z.infer<typeof configSchema>
