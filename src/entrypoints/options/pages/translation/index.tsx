import { i18n } from "@/utils/i18n"
import { PageLayout } from "../../components/page-layout"
import { CacheSection } from "./cache"
import { PreferenceSection } from "./preference"
import { TranslationControlSection } from "./translation-control"
import { TranslationStyleSection } from "./translation-style"

export function TranslationPage() {
  return (
    <PageLayout
      title={i18n.t("options.translation.title")}
      description={i18n.t("options.translation.pageDescription")}
      innerClassName="flex flex-col gap-10"
    >
      <PreferenceSection />
      <TranslationStyleSection />
      <TranslationControlSection />
      <CacheSection />
    </PageLayout>
  )
}
