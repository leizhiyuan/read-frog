import type { Config } from "@/types/config/config"
import { i18n } from "@/utils/i18n"
import { isSameShortcut } from "@/utils/shortcut"

/** One recorded key combination on the Shortcuts page, by the id of its row. */
export interface ShortcutBinding {
  id: string
  title: string
  shortcut: string
}

/**
 * Every key combination Read Frog listens for on a page. They all hear the same
 * keystrokes, so two of them on one key would both run.
 */
export function getShortcutBindings(config: Config): ShortcutBinding[] {
  return [
    {
      id: "page-translation-shortcut",
      title: i18n.t("options.shortcuts.pageTranslation.title"),
      shortcut: config.pageTranslation.page.shortcut,
    },
    {
      id: "translation-mode-shortcut",
      title: i18n.t("options.shortcuts.translationMode.title"),
      shortcut: config.pageTranslation.modeShortcut,
    },
    {
      id: "subtitles-toggle-shortcut",
      title: i18n.t("options.shortcuts.subtitlesToggle.title"),
      shortcut: config.videoSubtitles.toggleShortcut,
    },
  ]
}

/** The other binding already on these keys, if one is. */
export function findShortcutOwner(
  bindings: ShortcutBinding[],
  id: string,
  shortcut: string,
): ShortcutBinding | undefined {
  return bindings.find((binding) => binding.id !== id && isSameShortcut(binding.shortcut, shortcut))
}
