import type { EntityTable } from "dexie"
import { upperCamelCase } from "case-anything"
import { Dexie } from "dexie"
import { APP_NAME } from "@/utils/constants/app"
import LogRecordEntry from "./tables/log-record"
import TranslationCache from "./tables/translation-cache"

export default class AppDB extends Dexie {
  translationCache!: EntityTable<TranslationCache, "key">

  logRecord!: EntityTable<LogRecordEntry, "id">

  constructor() {
    super(`${upperCamelCase(APP_NAME)}DB`)
    this.version(1).stores({
      translationCache: `
        key,
        translation,
        createdAt`,
    })
    // Historical versions are kept so an existing database upgrades in order;
    // v10 drops every store the removed AI features owned.
    this.version(2).stores({
      translationCache: `key, translation, createdAt`,
      batchRequestRecord: `key, createdAt, originalRequestCount, provider, model`,
    })
    this.version(3).stores({
      translationCache: `key, translation, createdAt`,
      batchRequestRecord: `key, createdAt, originalRequestCount, provider, model`,
      articleSummaryCache: `key, createdAt`,
    })
    this.version(4).stores({
      translationCache: `key, translation, createdAt`,
      batchRequestRecord: `key, createdAt, originalRequestCount, provider, model`,
      articleSummaryCache: `key, createdAt`,
      aiSegmentationCache: `key, createdAt`,
    })
    this.version(5).stores({
      translationCache: `key, translation, createdAt`,
      batchRequestRecord: `key, createdAt, originalRequestCount, provider, model`,
      articleSummaryCache: `key, createdAt`,
      aiSegmentationCache: `key, createdAt`,
      glossary: `id, enabled, createdAt`,
      glossaryTerm: `id, glossaryId, &[glossaryId+targetLang+matchKey], enabled, updatedAt`,
    })
    this.version(6).stores({
      translationCache: `key, translation, createdAt`,
      batchRequestRecord: `key, createdAt, originalRequestCount, provider, model`,
      articleSummaryCache: `key, createdAt`,
      aiSegmentationCache: `key, createdAt`,
      glossary: `id, enabled, createdAt`,
      glossaryTerm: `id, glossaryId, &[glossaryId+targetLang+matchKey], enabled, updatedAt`,
      glossarySyncSnapshot: `id`,
    })
    this.version(7).stores({
      translationCache: `key, translation, createdAt`,
      batchRequestRecord: `key, createdAt, originalRequestCount, provider, model`,
      articleSummaryCache: `key, createdAt`,
      aiSegmentationCache: `key, createdAt`,
      glossary: `id, enabled, createdAt`,
      glossaryTerm: `id, glossaryId, &[glossaryId+targetLang+matchKey], enabled, updatedAt`,
      glossarySyncSnapshot: `id`,
    })
    this.version(8).stores({
      translationCache: `key, translation, createdAt`,
      batchRequestRecord: `key, createdAt, originalRequestCount, provider, model`,
      articleSummaryCache: `key, createdAt`,
      aiSegmentationCache: `key, createdAt`,
      glossary: `id, enabled, createdAt`,
      glossaryTerm: `id, glossaryId, &[glossaryId+targetLang+matchKey], enabled, updatedAt`,
      glossarySyncSnapshot: `id`,
      logRecord: `++id`,
    })
    this.version(9).stores({
      translationCache: `key, translation, createdAt`,
      batchRequestRecord: `key, createdAt, originalRequestCount, provider, model`,
      articleSummaryCache: `key, createdAt`,
      aiSegmentationCache: `key, createdAt`,
      logRecord: `++id`,
    })
    // The extension now keeps only the translation cache and the local log.
    // Omitting a store from a version's set deletes it.
    this.version(10).stores({
      translationCache: `key, translation, createdAt`,
      logRecord: `++id`,
    })
    this.translationCache.mapToClass(TranslationCache)
    this.logRecord.mapToClass(LogRecordEntry)
  }
}
