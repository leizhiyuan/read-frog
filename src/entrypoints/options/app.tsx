import type { ComponentType } from "react"
import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router"
import { ROUTE_DEFS } from "./app-sidebar/nav-items"

type RoutePath = (typeof ROUTE_DEFS)[number]["path"]

const PreferencePage = lazy(() =>
  import("./pages/preference").then((module) => ({ default: module.PreferencePage })),
)
const ShortcutsPage = lazy(() =>
  import("./pages/shortcuts").then((module) => ({ default: module.ShortcutsPage })),
)
const ApiProvidersPage = lazy(() =>
  import("./pages/api-providers").then((module) => ({ default: module.ApiProvidersPage })),
)
const TranslationPage = lazy(() =>
  import("./pages/translation").then((module) => ({ default: module.TranslationPage })),
)
const VideoSubtitlesPage = lazy(() =>
  import("./pages/video-subtitles").then((module) => ({ default: module.VideoSubtitlesPage })),
)
const InputTranslationPage = lazy(() =>
  import("./pages/input-translation").then((module) => ({ default: module.InputTranslationPage })),
)
const CustomCssPage = lazy(() =>
  import("./pages/translation/translation-style/custom-css").then((module) => ({
    default: module.CustomCssPage,
  })),
)
const AutoTranslateWebsitesPage = lazy(() =>
  import("./pages/translation/translation-control/website-patterns-page").then((module) => ({
    default: module.AutoTranslateWebsitesPage,
  })),
)
const NeverAutoTranslateWebsitesPage = lazy(() =>
  import("./pages/translation/translation-control/website-patterns-page").then((module) => ({
    default: module.NeverAutoTranslateWebsitesPage,
  })),
)
const TranslationControlPage = lazy(() =>
  import("./pages/translation/translation-control/control-page").then((module) => ({
    default: module.TranslationControlPage,
  })),
)
const SiteRulesPage = lazy(() =>
  import("./pages/translation/translation-control/site-rules").then((module) => ({
    default: module.SiteRulesPage,
  })),
)
const SubtitlesCustomCssPage = lazy(() =>
  import("./pages/video-subtitles/subtitles-style/custom-css").then((module) => ({
    default: module.SubtitlesCustomCssPage,
  })),
)
const SubtitlesSitesPage = lazy(() =>
  import("./pages/video-subtitles/preference/sites-page").then((module) => ({
    default: module.SubtitlesSitesPage,
  })),
)
const SubtitlesStylePage = lazy(() =>
  import("./pages/video-subtitles/subtitles-style/style-editor").then((module) => ({
    default: module.SubtitlesStylePage,
  })),
)
const ROUTE_COMPONENTS: Record<RoutePath, ComponentType> = {
  "/": ApiProvidersPage,
  "/preference": PreferencePage,
  "/shortcuts": ShortcutsPage,
  "/api-providers": ApiProvidersPage,
  "/page-translation": TranslationPage,
  "/video-subtitles": VideoSubtitlesPage,
  "/input-translation": InputTranslationPage,
  "/page-translation/custom-css": CustomCssPage,
  "/page-translation/translation-control": TranslationControlPage,
  "/page-translation/translation-control/auto-translate-websites": AutoTranslateWebsitesPage,
  "/page-translation/translation-control/never-auto-translate-websites":
    NeverAutoTranslateWebsitesPage,
  "/page-translation/translation-control/site-rules": SiteRulesPage,
  "/video-subtitles/sites": SubtitlesSitesPage,
  "/video-subtitles/style": SubtitlesStylePage,
  "/video-subtitles/style/custom-css": SubtitlesCustomCssPage,
}

function RouteLoadingFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
      Loading settings...
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {ROUTE_DEFS.map(({ path }) => {
          const Component = ROUTE_COMPONENTS[path]
          return <Route key={path} path={path} element={<Component />} />
        })}
      </Routes>
    </Suspense>
  )
}
