import { i18n } from "@/utils/i18n"
import { PageLayout } from "../../components/page-layout"
import { PageTranslationShortcut } from "./page-translation-shortcut"
import { SubtitlesToggleShortcut } from "./subtitles-toggle-shortcut"
import { TranslationModeShortcut } from "./translation-mode-shortcut"

/** Every key combination the extension listens for on a page. */
export function ShortcutsPage() {
  return (
    <PageLayout
      title={i18n.t("options.shortcuts.title")}
      description={i18n.t("options.shortcuts.pageDescription")}
      innerClassName="flex flex-col gap-6"
    >
      <PageTranslationShortcut />
      <TranslationModeShortcut />
      <SubtitlesToggleShortcut />
    </PageLayout>
  )
}
