export const ROUTE_DEFS = [
  { path: "/" },
  { path: "/preference" },
  { path: "/shortcuts" },
  { path: "/api-providers" },
  { path: "/page-translation" },
  { path: "/video-subtitles" },
  { path: "/input-translation" },

  // Detail pages drilled into from a `ConfigNavItem`. They own no sidebar entry — the
  // sidebar lists its links itself — but route exactly like any other page.
  { path: "/page-translation/custom-css" },
  { path: "/page-translation/translation-control" },
  { path: "/page-translation/translation-control/auto-translate-websites" },
  { path: "/page-translation/translation-control/never-auto-translate-websites" },
  { path: "/page-translation/translation-control/site-rules" },
  { path: "/video-subtitles/sites" },
  { path: "/video-subtitles/style" },
  { path: "/video-subtitles/style/custom-css" },
] as const
