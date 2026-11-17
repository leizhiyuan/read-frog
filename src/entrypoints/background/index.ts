import "@/utils/zod-config"
import type { Config, UiLanguage } from "@/types/config/config"
import { browser, defineBackground } from "#imports"
import { storageAdapter } from "@/utils/atoms/storage-adapter"
import { selectFreshTranslateProviders } from "@/utils/config/default-translate-provider"
import { CONFIG_STORAGE_KEY } from "@/utils/constants/config"
import { initI18n, setUiLanguage } from "@/utils/i18n"
import { ensureInstalledAtRecorded } from "@/utils/install-time"
import { createLogger } from "@/utils/logging/logger"
import { setupBackgroundLogging } from "@/utils/logging/setup-background"
import { onMessage } from "@/utils/message"
import { openOptionsPage } from "@/utils/navigation"
import { ensureRemoteSiteRulesLoaded } from "@/utils/site-rules/active"
import { initializeActionIcons, registerActionIconListeners } from "./browser-action-icon"
import { ensureInitializedConfig, isFreshInstalledConfig } from "./config"
import { cleanupAllTranslationCache, setUpDatabaseCleanup } from "./db-cleanup"
import { setupFeatureUsedEventHandlers } from "./feature-used-event"
import { setupIframeInjection } from "./iframe-injection"
import { setupPageTranslationHandlers } from "./page-translation"
import { proxyFetch } from "./proxy-fetch"
import { setUpSiteRulesUpdate } from "./site-rules-update"
import { setupSubtitlesTranslationHandlers } from "./subtitles-translation"
import { translationMessage } from "./translation-signal"

const log = createLogger("background")

export default defineBackground({
  type: "module",
  main: () => {
    // First, so nothing below logs before the local log is there to keep it.
    setupBackgroundLogging()
    log.debug("Hello background!", { id: browser.runtime.id })

    browser.runtime.onInstalled.addListener(async () => {
      // First, and for every reason rather than just "install": this is the only place the
      // install time is ever recorded, and it must not be lost to a service worker dying
      // during the slower work below.
      await ensureInstalledAtRecorded()

      await ensureInitializedConfig()

      // Deliberately last: probing Google Translate can hang for seconds on networks that
      // block it, and nothing above should wait for that. Awaiting inside the listener
      // keeps the service worker alive until the probe settles. Guarded by the config
      // actually being new rather than by the install reason: reloading an unpacked
      // extension reports "install" while the developer's provider choice is still in
      // storage, and a config rebuilt from defaults after failing validation during an
      // update deserves the same provider selection a fresh install gets.
      if (await isFreshInstalledConfig()) {
        await selectFreshTranslateProviders()
      }
    })

    onMessage("openPage", async (message) => {
      const { url, active } = message.data
      log.debug("openPage", { url, active })
      await browser.tabs.create({ url, active: active ?? true })
    })

    onMessage("openOptionsPage", async (message) => {
      log.debug("openOptionsPage", { data: message.data })
      await openOptionsPage(message.data)
    })

    onMessage("clearAllTranslationRelatedCache", async () => {
      await cleanupAllTranslationCache()
    })

    setupFeatureUsedEventHandlers()
    translationMessage()
    registerActionIconListeners()

    // Initialize action icons asynchronously
    void initializeActionIcons()

    // Synchronous: all translation and summary handlers register in the first turn of
    // the SW so wake-triggering messages are never dropped during init.
    setupPageTranslationHandlers()
    setupSubtitlesTranslationHandlers()
    void setUpDatabaseCleanup()
    setUpSiteRulesUpdate()
    void ensureRemoteSiteRulesLoaded()

    // Start config and i18n initialization without delaying synchronous listener
    // registration. Consumers that materialize localized config-derived data await
    // this shared barrier before reading it.
    let currentUiLanguage: UiLanguage | undefined
    const backgroundReady = (async () => {
      const config = await ensureInitializedConfig()
      currentUiLanguage = config?.uiLanguage ?? "auto"
      await initI18n(currentUiLanguage)
    })()

    proxyFetch()

    // Setup on-demand iframe injection after page translation is enabled.
    setupIframeInjection()

    // Keep background-resolved strings in the selected language when it changes.
    storageAdapter.watch<Config>(CONFIG_STORAGE_KEY, (newConfig) => {
      void (async () => {
        await backgroundReady
        if (newConfig.uiLanguage === currentUiLanguage) return
        currentUiLanguage = newConfig.uiLanguage
        await setUiLanguage(newConfig.uiLanguage)
      })()
    })
  },
})
