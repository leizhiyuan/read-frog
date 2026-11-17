import type { LanguageTag } from "@read-frog/definitions"
import { getLanguageDisplayName, getLanguageEndonym } from "@read-frog/definitions"
import { getUiLocale } from "@/utils/i18n"

// Names come from @read-frog/definitions' table for the interface language, so
// no locale file has to list every language and every browser shows the same
// names.
export function getLanguageName(code: LanguageTag) {
  return getLanguageDisplayName(code, getUiLocale())
}

export function getLanguageLabel(code: LanguageTag) {
  return `${getLanguageName(code)} (${getLanguageEndonym(code)})`
}
