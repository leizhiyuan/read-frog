export const NON_API_TRANSLATE_PROVIDERS = ["google-translate", "microsoft-translate"] as const

export const NON_API_TRANSLATE_PROVIDERS_MAP: Record<
  (typeof NON_API_TRANSLATE_PROVIDERS)[number],
  string
> = {
  "google-translate": "Google Translate",
  "microsoft-translate": "Microsoft Translator",
}

export const PURE_TRANSLATE_PROVIDERS = [
  "google-translate",
  "microsoft-translate",
  "deeplx",
  "deepl",
] as const
