import type { GeneratedI18nStructure } from "#i18n"

type I18nKey = keyof GeneratedI18nStructure

export interface SearchItem {
  sectionId: string
  route: string
  titleKey: string
  descriptionKey?: string
  pageKey: string
}

type SearchItemDefinition = Omit<SearchItem, "titleKey" | "descriptionKey" | "pageKey"> & {
  titleKey: I18nKey
  descriptionKey?: I18nKey
  pageKey: I18nKey
}

export const SEARCH_ITEMS: SearchItem[] = (
  [
    // Preference page
    {
      sectionId: "theme",
      route: "/preference",
      titleKey: "options.preference.appearanceAndLanguage.title",
      descriptionKey: "options.preference.appearanceAndLanguage.theme.description",
      pageKey: "options.preference.title",
    },
    {
      sectionId: "interface-language",
      route: "/preference",
      titleKey: "options.preference.appearanceAndLanguage.interfaceLanguage.title",
      descriptionKey: "options.preference.appearanceAndLanguage.interfaceLanguage.description",
      pageKey: "options.preference.title",
    },
    {
      sectionId: "translation-source-language",
      route: "/preference",
      titleKey: "options.preference.translationLanguage.sourceCode.title",
      descriptionKey: "options.preference.translationLanguage.sourceCode.description",
      pageKey: "options.preference.title",
    },
    {
      sectionId: "translation-target-language",
      route: "/preference",
      titleKey: "options.preference.translationLanguage.targetCode.title",
      descriptionKey: "options.preference.translationLanguage.targetCode.description",
      pageKey: "options.preference.title",
    },
    {
      sectionId: "reset-config",
      route: "/preference",
      titleKey: "options.preference.config.reset.title",
      descriptionKey: "options.preference.config.reset.description",
      pageKey: "options.preference.title",
    },

    // Page translation
    {
      sectionId: "translation-mode",
      route: "/page-translation",
      titleKey: "options.translation.preference.translationMode.title",
      descriptionKey: "options.translation.preference.translationMode.description",
      pageKey: "options.translation.title",
    },
    {
      sectionId: "translate-range",
      route: "/page-translation",
      titleKey: "options.translation.preference.translateRange.title",
      descriptionKey: "options.translation.preference.translateRange.description",
      pageKey: "options.translation.title",
    },
    {
      sectionId: "translate-title",
      route: "/page-translation",
      titleKey: "options.translation.preference.translateTitle.title",
      descriptionKey: "options.translation.preference.translateTitle.description",
      pageKey: "options.translation.title",
    },
    {
      sectionId: "translation-style",
      route: "/page-translation",
      titleKey: "options.translation.translationStyle.title",
      descriptionKey: "options.translation.translationStyle.description",
      pageKey: "options.translation.title",
    },
    {
      sectionId: "translation-control",
      route: "/page-translation",
      titleKey: "options.translation.translationControl.title",
      descriptionKey: "options.translation.translationControl.description",
      pageKey: "options.translation.title",
    },
    {
      sectionId: "auto-translate-languages",
      route: "/page-translation/translation-control",
      titleKey: "options.translation.translationControl.autoTranslateLanguages.title",
      pageKey: "options.translation.translationControl.title",
    },
    {
      sectionId: "skip-languages",
      route: "/page-translation/translation-control",
      titleKey: "options.translation.translationControl.skipLanguages.title",
      pageKey: "options.translation.translationControl.title",
    },
    {
      sectionId: "small-paragraph-filter",
      route: "/page-translation/translation-control",
      titleKey: "options.translation.translationControl.smallParagraphFilter.title",
      pageKey: "options.translation.translationControl.title",
    },
    {
      sectionId: "site-rules",
      route: "/page-translation/translation-control/site-rules",
      titleKey: "options.siteRules.title",
      descriptionKey: "options.siteRules.description",
      pageKey: "options.translation.title",
    },
    {
      sectionId: "cache",
      route: "/page-translation",
      titleKey: "options.translation.cache.title",
      descriptionKey: "options.translation.cache.clearCache.description",
      pageKey: "options.translation.title",
    },

    // Video subtitles
    {
      sectionId: "subtitles-pause-on-hover",
      route: "/video-subtitles",
      titleKey: "options.videoSubtitles.preference.pauseOnHover.title",
      descriptionKey: "options.videoSubtitles.preference.pauseOnHover.description",
      pageKey: "options.videoSubtitles.title",
    },
    {
      sectionId: "subtitles-style",
      route: "/video-subtitles",
      titleKey: "options.videoSubtitles.style.title",
      pageKey: "options.videoSubtitles.title",
    },

    // Input translation
    {
      sectionId: "input-translation-languages",
      route: "/input-translation",
      titleKey: "options.inputTranslation.languages.title",
      pageKey: "options.inputTranslation.title",
    },
    {
      sectionId: "input-translation-cycle",
      route: "/input-translation",
      titleKey: "options.inputTranslation.languages.cycle.title",
      descriptionKey: "options.inputTranslation.languages.cycle.description",
      pageKey: "options.inputTranslation.title",
    },
  ] satisfies SearchItemDefinition[]
).map(({ titleKey, descriptionKey, pageKey, ...rest }) => ({
  ...rest,
  titleKey,
  ...(descriptionKey ? { descriptionKey } : {}),
  pageKey,
}))
