import type { Config } from "@/types/config/config"
import type { PageTranslateRange } from "@/types/config/translate"
import {
  buildDefaultProviderConfigList,
  DEFAULT_PROVIDER_CONFIG_LIST,
  MICROSOFT_TRANSLATE_PROVIDER_ID,
} from "./providers"
import {
  DEFAULT_BACKGROUND_OPACITY,
  DEFAULT_DISPLAY_MODE,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SCALE,
  DEFAULT_FONT_WEIGHT,
  DEFAULT_SUBTITLE_COLOR,
  DEFAULT_SUBTITLE_POSITION,
  DEFAULT_SUBTITLES_TOGGLE_SHORTCUT_KEY,
  DEFAULT_TRANSLATION_POSITION,
} from "./subtitles"
import {
  DEFAULT_AUTO_TRANSLATE_SHORTCUT_KEY,
  DEFAULT_MIN_CHARACTERS_PER_NODE,
  DEFAULT_MIN_WORDS_PER_NODE,
  DEFAULT_PRELOAD_MARGIN,
  DEFAULT_PRELOAD_THRESHOLD,
  DEFAULT_REQUEST_CAPACITY,
  DEFAULT_REQUEST_RATE,
  DEFAULT_REQUEST_TIMEOUT_MS,
  DEFAULT_TRANSLATION_MODE_SHORTCUT_KEY,
} from "./translate"
import { TRANSLATION_NODE_STYLE_ON_INSTALLED } from "./translation-node-style"

export { CONFIG_STORAGE_KEY } from "./config-storage-key"
export const LAST_SYNCED_CONFIG_STORAGE_KEY = "lastSyncedConfig"

export const THEME_STORAGE_KEY = "theme"
export const DEFAULT_DETECTED_CODE = "en" as const
export const CONFIG_SCHEMA_VERSION = 126

export const DEFAULT_CONFIG: Config = {
  language: {
    sourceCode: "auto",
    targetCode: "zh-Hans",
    level: "intermediate",
  },
  providersConfig: DEFAULT_PROVIDER_CONFIG_LIST,
  pageTranslation: {
    providerId: MICROSOFT_TRANSLATE_PROVIDER_ID,
    mode: "bilingual",
    modeShortcut: DEFAULT_TRANSLATION_MODE_SHORTCUT_KEY,
    page: {
      range: "all",
      translateTitle: true,
      autoTranslatePatterns: ["*.news.ycombinator.com"],
      neverAutoTranslatePatterns: [],
      autoTranslateLanguages: [],
      shortcut: DEFAULT_AUTO_TRANSLATE_SHORTCUT_KEY,
      preload: {
        margin: DEFAULT_PRELOAD_MARGIN,
        threshold: DEFAULT_PRELOAD_THRESHOLD,
      },
      minCharactersPerNode: DEFAULT_MIN_CHARACTERS_PER_NODE,
      minWordsPerNode: DEFAULT_MIN_WORDS_PER_NODE,
      enableTargetLanguageSkip: true,
      skipLanguages: [],
    },
    requestQueueConfig: {
      capacity: DEFAULT_REQUEST_CAPACITY,
      rate: DEFAULT_REQUEST_RATE,
      timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    },
    translationNodeStyle: {
      preset: TRANSLATION_NODE_STYLE_ON_INSTALLED,
      isCustom: false,
      customCSS: null,
    },
  },
  inputTranslation: {
    enabled: true,
    providerId: MICROSOFT_TRANSLATE_PROVIDER_ID,
    fromLang: "targetCode",
    toLang: "sourceCode",
    enableCycle: false,
    timeThreshold: 300,
  },
  videoSubtitles: {
    platforms: {
      youtube: "manual",
      xcom: "manual",
      netflix: "manual",
      bilibili: "manual",
      udemy: "manual",
      edx: "manual",
    },
    toggleShortcut: DEFAULT_SUBTITLES_TOGGLE_SHORTCUT_KEY,
    providerId: MICROSOFT_TRANSLATE_PROVIDER_ID,
    style: {
      displayMode: DEFAULT_DISPLAY_MODE,
      translationPosition: DEFAULT_TRANSLATION_POSITION,
      main: {
        fontFamily: DEFAULT_FONT_FAMILY,
        fontScale: DEFAULT_FONT_SCALE,
        color: DEFAULT_SUBTITLE_COLOR,
        fontWeight: DEFAULT_FONT_WEIGHT,
      },
      translation: {
        fontFamily: DEFAULT_FONT_FAMILY,
        fontScale: DEFAULT_FONT_SCALE,
        color: DEFAULT_SUBTITLE_COLOR,
        fontWeight: DEFAULT_FONT_WEIGHT,
      },
      container: {
        backgroundOpacity: DEFAULT_BACKGROUND_OPACITY,
      },
      customCSS: null,
    },
    pauseOnHover: false,
    requestQueueConfig: {
      capacity: DEFAULT_REQUEST_CAPACITY,
      rate: DEFAULT_REQUEST_RATE,
      timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS,
    },
    position: DEFAULT_SUBTITLE_POSITION,
  },
  siteControl: {
    mode: "blacklist",
    blacklistPatterns: [],
    whitelistPatterns: [],
  },
  siteRules: {
    userRules: [],
    disabledBuiltInRules: [],
  },
  uiLanguage: "auto",
}

/**
 * Translate features start on Microsoft Translate, which is reachable everywhere; a fresh
 * install is moved onto Google Translate afterwards where that endpoint answers — see
 * `selectFreshTranslateProviders`.
 */
export function buildFreshDefaultConfig(): Config {
  return {
    ...DEFAULT_CONFIG,
    providersConfig: buildDefaultProviderConfigList(),
  }
}

export const PAGE_TRANSLATE_RANGE_ITEMS: Record<PageTranslateRange, { label: string }> = {
  main: { label: "Main" },
  all: { label: "All" },
}
