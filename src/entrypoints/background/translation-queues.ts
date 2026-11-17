import type { Config } from "@/types/config/config"
import type { RequestQueueConfig } from "@/types/config/translate"
import { storage } from "#imports"
import { CONFIG_STORAGE_KEY, DEFAULT_CONFIG } from "@/utils/constants/config"
import { createLogger } from "@/utils/logging/logger"
import { CancelledScopeRegistry } from "@/utils/request/cancellation"
import { RequestQueue } from "@/utils/request/request-queue"
import { ensureInitializedConfig } from "./config"

const log = createLogger("background/translation-queues")

/**
 * Compose the cancellation scope from the message sender and the content
 * script's session id. Building it background-side from `sender.tab.id` makes
 * cross-tab cancellation impossible by construction.
 */
export function buildTranslationScopeKey(
  sender: { tab?: { id?: number } } | undefined,
  sessionId: string | undefined,
): string | undefined {
  const tabId = sender?.tab?.id
  return typeof tabId === "number" && sessionId ? `${tabId}:${sessionId}` : undefined
}

interface TranslationQueueSetupConfig {
  requestQueueConfig: RequestQueueConfig
  queueName: "webpage" | "subtitles"
  // "default" means the user's stored config could not be loaded — the queue
  // is running on DEFAULT_CONFIG values, NOT what the options page shows.
  configSource: "user" | "default"
}

async function createTranslationQueue(config: TranslationQueueSetupConfig) {
  const { rate, capacity, timeoutMs } = config.requestQueueConfig
  const queueLog = log.with({ queue: config.queueName })

  queueLog.debug("Queue initialized", {
    rate,
    capacity,
    timeoutMs,
    configSource: config.configSource,
  })
  if (config.configSource === "default") {
    queueLog.error("Queue running on the default config: the user config was unavailable at init")
  }

  return new RequestQueue({
    rate,
    capacity,
    timeoutMs,
    maxRetries: 2,
    baseRetryDelayMs: 1_000,
  })
}

async function loadQueueSetupConfig(
  queueName: "webpage" | "subtitles",
  selectConfig: (config: Config) => RequestQueueConfig,
): Promise<{ requestQueueConfig: RequestQueueConfig; configSource: "user" | "default" }> {
  let config: Config | null = null
  try {
    config = await ensureInitializedConfig()
  } catch (error) {
    log.error("Failed to load the config for a queue", { queue: queueName, error })
  }
  return {
    requestQueueConfig: selectConfig(config ?? DEFAULT_CONFIG),
    configSource: config ? "user" : "default",
  }
}

/** Re-apply queue config from storage on every persisted change. */
function watchQueueConfig(
  queueName: "webpage" | "subtitles",
  queuesPromise: Promise<RequestQueue>,
  selectConfig: (config: Config) => RequestQueueConfig,
) {
  let lastAppliedJson: string | null = null
  storage.watch<Config>(`local:${CONFIG_STORAGE_KEY}`, (newConfig) => {
    if (!newConfig) return
    void queuesPromise.then((requestQueue) => {
      try {
        const selected = selectConfig(newConfig)
        const json = JSON.stringify(selected)
        if (json === lastAppliedJson) return
        requestQueue.setQueueOptions(selected)
        lastAppliedJson = json
        log.debug("Queue config updated", { queue: queueName, selected })
      } catch (error) {
        log.error("Failed to apply a queue config change", { queue: queueName, error })
      }
    })
  })
}

const selectWebPageQueueConfig = (config: Config) => config.pageTranslation.requestQueueConfig
const selectSubtitlesQueueConfig = (config: Config) => config.videoSubtitles.requestQueueConfig

export function createWebPageTranslationQueues() {
  // Scopes whose cancel already drained the queues. Consulted by the enqueue
  // handler after its cache-lookup await, where a request lives in no
  // cancellable structure yet (#1881).
  const cancelledScopes = new CancelledScopeRegistry()

  const queuesPromise = loadQueueSetupConfig("webpage", selectWebPageQueueConfig).then(
    ({ requestQueueConfig, configSource }) =>
      createTranslationQueue({
        requestQueueConfig,
        queueName: "webpage",
        configSource,
      }),
  )

  watchQueueConfig("webpage", queuesPromise, selectWebPageQueueConfig)

  return { queuesPromise, cancelledScopes }
}

/** Create subtitle translation queue and watch its configuration. */
export function createSubtitlesTranslationQueues() {
  const queuesPromise = loadQueueSetupConfig("subtitles", selectSubtitlesQueueConfig).then(
    ({ requestQueueConfig, configSource }) =>
      createTranslationQueue({
        requestQueueConfig,
        queueName: "subtitles",
        configSource,
      }),
  )

  watchQueueConfig("subtitles", queuesPromise, selectSubtitlesQueueConfig)

  return queuesPromise
}
