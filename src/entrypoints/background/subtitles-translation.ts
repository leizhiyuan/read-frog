import { normalizeLanguageConfig } from "@/utils/config/languages"
import { db } from "@/utils/db/dexie/db"
import { executeTranslate } from "@/utils/host/translate/execute-translate"
import { onMessage } from "@/utils/message"
import { createSubtitlesTranslationQueues } from "./translation-queues"

/** Register handlers synchronously while queue initialization runs in the background. */
export function setupSubtitlesTranslationHandlers(): void {
  const queuesPromise = createSubtitlesTranslationQueues()

  onMessage("enqueueSubtitlesTranslateRequest", async (message) => {
    const requestQueue = await queuesPromise
    const {
      data: { text, langConfig: sentLangConfig, providerConfig, scheduleAt, hash },
    } = message
    const langConfig = normalizeLanguageConfig(sentLangConfig)

    if (hash) {
      const cached = await db.translationCache.get(hash)
      if (cached) {
        return cached.translation
      }
    }

    const thunk = (signal?: AbortSignal) =>
      executeTranslate(text, langConfig, providerConfig, { signal })
    const result = await requestQueue.enqueue(thunk, scheduleAt, hash)

    if (result && hash) {
      await db.translationCache.put({
        key: hash,
        translation: result,
        createdAt: new Date(),
      })
    }

    return result
  })
}
