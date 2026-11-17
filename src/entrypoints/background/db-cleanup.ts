import type { Table } from "dexie"
import { browser } from "#imports"
import { db } from "@/utils/db/dexie/db"
import { createLogger } from "@/utils/logging/logger"

const log = createLogger("background/db-cleanup")

export const CHECK_INTERVAL_MINUTES = 24 * 60

export const TRANSLATION_CACHE_CLEANUP_ALARM = "cache-cleanup"
export const TRANSLATION_CACHE_MAX_AGE_MINUTES = 7 * 24 * 60

export async function setUpDatabaseCleanup() {
  const cleanupJobs = new Map<string, () => Promise<void>>([
    [
      TRANSLATION_CACHE_CLEANUP_ALARM,
      createCacheCleanup({
        table: db.translationCache,
        maxAgeMinutes: TRANSLATION_CACHE_MAX_AGE_MINUTES,
        label: "Translation cache",
      }),
    ],
  ])

  // Register synchronously so alarms can wake the background during initialization.
  browser.alarms.onAlarm.addListener(async (alarm) => {
    await cleanupJobs.get(alarm.name)?.()
  })

  for (const name of cleanupJobs.keys()) {
    if (!(await browser.alarms.get(name))) {
      void browser.alarms.create(name, {
        delayInMinutes: 1,
        periodInMinutes: CHECK_INTERVAL_MINUTES,
      })
    }
  }
}

function createCacheCleanup({
  table,
  maxAgeMinutes,
  label,
}: {
  table: Pick<Table<{ createdAt: Date }>, "where">
  maxAgeMinutes: number
  label: string
}) {
  return async () => {
    try {
      const cutoffDate = new Date(Date.now() - maxAgeMinutes * 60 * 1000)
      const deletedCount = await table.where("createdAt").below(cutoffDate).delete()

      if (deletedCount > 0) {
        log.info("Deleted expired entries", { label, deletedCount })
      }
    } catch (error) {
      log.error("Failed to delete expired entries", { label, error })
    }
  }
}

export async function cleanupAllTranslationCache() {
  try {
    await db.translationCache.clear()
    log.info("Deleted all translation cache entries")
  } catch (error) {
    log.error("Failed to cleanup all cache", { error })
    throw error
  }
}
