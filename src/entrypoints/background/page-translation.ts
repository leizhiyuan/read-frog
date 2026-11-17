import type TranslationCache from "@/utils/db/dexie/tables/translation-cache"
import { browser } from "#imports"
import { normalizeLanguageConfig } from "@/utils/config/languages"
import { db } from "@/utils/db/dexie/db"
import { executeTranslate } from "@/utils/host/translate/execute-translate"
import {
  assertHtmlAttributeMarkerIntegrity,
  hasHtmlAttributeMarkerProtocol,
  isHtmlAttributeMarkerIntegrityError,
} from "@/utils/host/translate/html-attribute-markers"
import {
  auditInlineAtomTokens,
  hasInlineAtomTokens,
} from "@/utils/host/translate/inline-atom-tokens"
import { createLogger } from "@/utils/logging/logger"
import { onMessage } from "@/utils/message"
import { TranslationCancelledError } from "@/utils/request/cancellation"
import { buildTranslationScopeKey, createWebPageTranslationQueues } from "./translation-queues"

const log = createLogger("background/page-translation")

async function getValidatedCachedTranslation(
  hash: string,
  sourceText: string,
  validateHtmlAttributeMarkers: boolean,
): Promise<TranslationCache | undefined> {
  const cached = await db.translationCache.get(hash)
  if (!cached) return undefined
  if (!validateHtmlAttributeMarkers) return cached

  try {
    assertHtmlAttributeMarkerIntegrity(sourceText, cached.translation)
    return cached
  } catch (error) {
    if (!isHtmlAttributeMarkerIntegrityError(error)) throw error

    await db.translationCache.delete(hash)
    log.warn("Deleted cached translation with invalid HTML attribute markers", { error })
    return undefined
  }
}

/** Register handlers synchronously while queue initialization runs in the background. */
export function setupPageTranslationHandlers(): void {
  const { queuesPromise, cancelledScopes } = createWebPageTranslationQueues()

  onMessage("enqueueTranslateRequest", async (message) => {
    const requestQueue = await queuesPromise
    const {
      data: {
        text,
        langConfig: sentLangConfig,
        providerConfig,
        scheduleAt,
        hash,
        textFormat,
        preserveLineBreaks,
        sessionId,
        forceRetranslation = false,
      },
    } = message
    const langConfig = normalizeLanguageConfig(sentLangConfig)
    const scope = buildTranslationScopeKey(message.sender, sessionId)

    const validateHtmlAttributeMarkers =
      textFormat === "html" && hasHtmlAttributeMarkerProtocol(text)
    if (validateHtmlAttributeMarkers) {
      assertHtmlAttributeMarkerIntegrity(text, text)
    }

    // Check cache first — unless the user asked for a fresh translation. The
    // existing entry is left untouched unless the fresh request succeeds below.
    if (hash && !forceRetranslation) {
      const cached = await getValidatedCachedTranslation(hash, text, validateHtmlAttributeMarkers)
      if (cached) {
        return cached.translation
      }
    }

    // The cache lookup above yielded — the session's cancel may have drained
    // the queues while this handler was suspended. Enqueueing now would park
    // an undrainable task on a dead scope, so abort instead.
    if (scope && cancelledScopes.has(scope)) {
      throw new TranslationCancelledError(scope)
    }

    const thunk = (signal?: AbortSignal) =>
      executeTranslate(text, langConfig, providerConfig, {
        textFormat,
        preserveLineBreaks,
        signal,
      })
    const result = await requestQueue.enqueue(thunk, scheduleAt, hash, scope ? [scope] : undefined)

    if (validateHtmlAttributeMarkers) {
      assertHtmlAttributeMarkerIntegrity(text, result)
    }

    // A response that dropped, invented or duplicated an inline-atom
    // placeholder is still rendered by the content script but must not be
    // persisted: the next visit deserves a fresh attempt.
    const inlineAtomTokensIntact =
      !hasInlineAtomTokens(text) || auditInlineAtomTokens(text, result).ok
    if (result && !inlineAtomTokensIntact) {
      log.warn("Inline atom placeholders were not preserved; result not cached")
    }

    if (result && hash && inlineAtomTokensIntact) {
      await db.translationCache.put({
        key: hash,
        translation: result,
        createdAt: new Date(),
      })
    }

    return result
  })

  onMessage("cancelPageTranslationRequests", async (message) => {
    const scope = buildTranslationScopeKey(message.sender, message.data.sessionId)
    if (!scope) return
    // Remember the scope BEFORE any await so enqueue handlers suspended on
    // the cache lookup refuse to enqueue after this drain.
    cancelledScopes.markScope(scope)
    const requestQueue = await queuesPromise
    const cancelledRequests = requestQueue.cancelByScope(scope)
    if (cancelledRequests > 0) {
      log.info("Cancelled page-translation requests", { count: cancelledRequests, scope })
    }
  })

  // A closed tab can never send its cancel message — sweep every scope the
  // tab ever registered (#1881).
  browser.tabs.onRemoved.addListener((tabId) => {
    const prefix = `${tabId}:`
    cancelledScopes.markPrefix(prefix)
    void queuesPromise.then((requestQueue) => {
      requestQueue.cancelWhere((scope) => scope.startsWith(prefix))
    })
  })
}
