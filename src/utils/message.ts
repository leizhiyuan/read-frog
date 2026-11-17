import type { LanguageTag } from "@read-frog/definitions"
import type { FeatureUsageContext, FeatureUsedEventProperties } from "@/types/analytics"
import type { Config } from "@/types/config/config"
import type { TranslateProviderConfig } from "@/types/config/provider"
import type { TranslationTextFormat } from "@/types/config/translate"
import type { ProxyRequest, ProxyResponse } from "@/types/proxy-fetch"
import type { LogRecord } from "@/utils/logging/logger"
import type { ForwardingLogContext } from "@/utils/logging/stored-record"
import { defineExtensionMessaging } from "@webext-core/messaging"

interface ProtocolMap {
  // navigation
  openPage: (data: { url: string; active?: boolean }) => void
  openOptionsPage: (data?: { route?: `/${string}` }) => void
  // config
  getInitialConfig: () => Config | null
  // translation state
  getEnablePageTranslationByTabId: (data: { tabId: number }) => boolean | undefined
  getEnablePageTranslationFromContentScript: () => Promise<boolean>
  tryToSetEnablePageTranslationByTabId: (data: {
    tabId: number
    enabled: boolean
    analyticsContext?: FeatureUsageContext<"page_translation">
  }) => void
  tryToSetEnablePageTranslationOnContentScript: (data: {
    enabled: boolean
    analyticsContext?: FeatureUsageContext<"page_translation">
  }) => void
  setAndNotifyPageTranslationStateChangedByManager: (data: {
    enabled: boolean
    url?: string
    userInitiated?: boolean
  }) => void
  notifyTranslationStateChanged: (data: { enabled: boolean }) => void
  ensureIframeHostContentInjected: (data: { tabId?: number }) => void
  injectCurrentIframesAfterTopFrameNodeTranslation: () => void
  activateSameOriginIframeSelectionRuntime: () => boolean
  // The url of the tab a frame is in: a frame can't read it when the page
  // around it is on another site.
  getSenderTabUrl: () => string | null
  reportDetectedPageLanguage: (data: {
    detectedCodeOrUnd: LanguageTag | "und"
    url: string
  }) => void
  refreshDetectedPageLanguage: () => void
  getDetectedCode: () => LanguageTag
  detectedPageLanguageChanged: (data: { detectedCode: LanguageTag }) => void
  // ask host to start page translation
  askManagerToTogglePageTranslation: (data: {
    enabled: boolean
    analyticsContext?: FeatureUsageContext<"page_translation">
  }) => void
  // analytics
  trackFeatureUsedEvent: (data: FeatureUsedEventProperties) => void
  // request
  enqueueTranslateRequest: (data: {
    text: string
    langConfig: Config["language"]
    providerConfig: TranslateProviderConfig
    scheduleAt: number
    hash: string
    textFormat?: TranslationTextFormat
    // Source line breaks are semantic (newline-preserving container or typed
    // input); providers whose transport collapses "\n" must protect them.
    preserveLineBreaks?: boolean
    // Page-translation session this request belongs to; scopes the request
    // for cancelPageTranslationRequests. Absent for non-page requests
    // (input translation), which are never cancellable.
    sessionId?: string
    forceRetranslation?: boolean
  }) => Promise<string>
  // Drain queued/in-flight page-translation requests of one session (#1881).
  // The background composes the scope as `${sender.tab.id}:${sessionId}`, so a
  // tab can only ever cancel its own requests.
  cancelPageTranslationRequests: (data: { sessionId: string }) => void
  enqueueSubtitlesTranslateRequest: (data: {
    text: string
    langConfig: Config["language"]
    providerConfig: TranslateProviderConfig
    scheduleAt: number
    hash: string
  }) => Promise<string>
  // network proxy
  backgroundFetch: (data: ProxyRequest) => Promise<ProxyResponse>
  // local log — the background owns it; every other context hands it its
  // records (utils/logging/sinks/forward.ts)
  storeLogRecords: (data: { context: ForwardingLogContext; records: LogRecord[] }) => void
  // cache management
  clearAllTranslationRelatedCache: () => Promise<void>
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>()
