import { z } from "zod"
import {
  DEFAULT_REQUEST_TIMEOUT_MS,
  MAX_PRELOAD_MARGIN,
  MAX_PRELOAD_THRESHOLD,
  MAX_REQUEST_TIMEOUT_MS,
  MIN_CHARACTERS_PER_NODE,
  MIN_PRELOAD_MARGIN,
  MIN_PRELOAD_THRESHOLD,
  MIN_REQUEST_TIMEOUT_MS,
  MIN_TRANSLATE_CAPACITY,
  MIN_TRANSLATE_RATE,
  MIN_WORDS_PER_NODE,
} from "@/utils/constants/translate"
import { TRANSLATION_NODE_STYLE } from "@/utils/constants/translation-node-style"
import { storedLanguageTagSchema } from "./language-tag"
import { shortcutSchema } from "./shortcut"

export const requestQueueConfigSchema = z.object({
  capacity: z.number().gte(MIN_TRANSLATE_CAPACITY),
  rate: z.number().gte(MIN_TRANSLATE_RATE),
  // Milliseconds, as the request queue takes it; the options page shows seconds,
  // so the messages do too. `.default()` lets config stored before v125 parse in
  // UI contexts that load before the migration runs.
  timeoutMs: z
    .number()
    .gte(
      MIN_REQUEST_TIMEOUT_MS,
      `Request timeout must be at least ${MIN_REQUEST_TIMEOUT_MS / 1000} seconds`,
    )
    .lte(
      MAX_REQUEST_TIMEOUT_MS,
      `Request timeout must be at most ${MAX_REQUEST_TIMEOUT_MS / 1000} seconds`,
    )
    .default(DEFAULT_REQUEST_TIMEOUT_MS),
})

export const TRANSLATION_MODES = ["bilingual", "translationOnly"] as const
export const translationModeSchema = z.enum(TRANSLATION_MODES)

export const pageTranslateRangeSchema = z.enum(["main", "all"])
export type PageTranslateRange = z.infer<typeof pageTranslateRangeSchema>

export const preloadConfigSchema = z.object({
  margin: z.number().min(MIN_PRELOAD_MARGIN).max(MAX_PRELOAD_MARGIN),
  threshold: z.number().min(MIN_PRELOAD_THRESHOLD).max(MAX_PRELOAD_THRESHOLD),
})
export type PreloadConfig = z.infer<typeof preloadConfigSchema>

// Translation node style preset (excluding 'custom' - controlled by isCustom flag)
export const translationNodeStylePresetSchema = z.enum(TRANSLATION_NODE_STYLE)
export type TranslationNodeStylePreset = z.infer<typeof translationNodeStylePresetSchema>

export const MAX_CUSTOM_CSS_LENGTH = 8192

// Translation node style configuration
export const translationNodeStyleConfigSchema = z.object({
  preset: translationNodeStylePresetSchema,
  isCustom: z.boolean(),
  customCSS: z.string().max(MAX_CUSTOM_CSS_LENGTH, "Custom CSS cannot exceed 8KB").nullable(),
})

export type TranslationNodeStyleConfig = z.infer<typeof translationNodeStyleConfigSchema>

export const translateConfigSchema = z.object({
  providerId: z.string().nonempty(),
  mode: translationModeSchema,
  modeShortcut: shortcutSchema,
  page: z.object({
    range: pageTranslateRangeSchema,
    // Whether the browser tab title is translated along with the page. Only
    // decides what the tab shows: prompts and cache keys always use the page's
    // own title, so switching it never invalidates cached translations.
    // `.default()` for the same reason as `node.forceRetranslation`: pre-v109
    // config must still parse in UI contexts that load before the migration.
    translateTitle: z.boolean().default(true),
    autoTranslatePatterns: z.array(z.string()),
    neverAutoTranslatePatterns: z.array(z.string()),
    autoTranslateLanguages: z.array(storedLanguageTagSchema),
    shortcut: shortcutSchema,
    preload: preloadConfigSchema,
    minCharactersPerNode: z.number().min(MIN_CHARACTERS_PER_NODE),
    minWordsPerNode: z.number().min(MIN_WORDS_PER_NODE),
    enableTargetLanguageSkip: z.boolean(),
    skipLanguages: z.array(storedLanguageTagSchema),
  }),
  requestQueueConfig: requestQueueConfigSchema,
  translationNodeStyle: translationNodeStyleConfigSchema,
})

export type RequestQueueConfig = z.infer<typeof requestQueueConfigSchema>

// How the source text sent to a translation provider should be interpreted:
// "plain" for plain text (the default), "html" for markup-bearing strings such
// as the outerHTML fragments produced by translationOnly page mode.
export type TranslationTextFormat = "plain" | "html"
export type TranslateConfig = z.infer<typeof translateConfigSchema>
export type TranslationMode = z.infer<typeof translationModeSchema>
