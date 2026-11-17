import {
  NON_API_TRANSLATE_PROVIDERS,
  NON_API_TRANSLATE_PROVIDERS_MAP,
  PURE_TRANSLATE_PROVIDERS,
} from "@/utils/constants/models"

// Re-export for external consumers.
export { NON_API_TRANSLATE_PROVIDERS, NON_API_TRANSLATE_PROVIDERS_MAP, PURE_TRANSLATE_PROVIDERS }

/* ──────────────────────────────
  Derived provider names
  ────────────────────────────── */

// The translation providers the extension can call. Everything else — LLM
// providers, hosted AI, prompt-driven translation — has been removed.
export const TRANSLATE_PROVIDER_TYPES = [
  "google-translate",
  "microsoft-translate",
  "deeplx",
  "deepl",
] as const satisfies Readonly<(typeof PURE_TRANSLATE_PROVIDERS)[number][]>
export type TranslateProviderTypes = (typeof TRANSLATE_PROVIDER_TYPES)[number]
export function isTranslateProvider(provider: string): provider is TranslateProviderTypes {
  return TRANSLATE_PROVIDER_TYPES.includes(provider)
}

export const API_PROVIDER_TYPES = ["deeplx", "deepl"] as const
export type APIProviderTypes = (typeof API_PROVIDER_TYPES)[number]
export function isAPIProvider(provider: string): provider is APIProviderTypes {
  return API_PROVIDER_TYPES.includes(provider)
}

export const PURE_API_PROVIDER_TYPES = ["deeplx", "deepl"] as const satisfies Readonly<
  Exclude<APIProviderTypes, never>[]
>
export type PureAPIProviderTypes = (typeof PURE_API_PROVIDER_TYPES)[number]
export function isPureAPIProvider(provider: string): provider is PureAPIProviderTypes {
  return PURE_API_PROVIDER_TYPES.includes(provider)
}

export type NonAPIProviderTypes = (typeof NON_API_TRANSLATE_PROVIDERS)[number]
export function isNonAPIProvider(provider: string): provider is NonAPIProviderTypes {
  return NON_API_TRANSLATE_PROVIDERS.includes(provider)
}

export function isPureTranslateProvider(provider: string): boolean {
  return PURE_TRANSLATE_PROVIDERS.includes(provider as (typeof PURE_TRANSLATE_PROVIDERS)[number])
}

// All provider names, in the order the settings page lists them.
export const ALL_PROVIDER_TYPES = [
  "google-translate",
  "microsoft-translate",
  "deeplx",
  "deepl",
] as const satisfies Readonly<TranslateProviderTypes[]>
export type AllProviderTypes = (typeof ALL_PROVIDER_TYPES)[number]

export interface ProviderSponsorConfig {
  sponsoring: boolean
  referUrl: string
  badgeI18nKey?: string
  ctaI18nKey?: string
}
