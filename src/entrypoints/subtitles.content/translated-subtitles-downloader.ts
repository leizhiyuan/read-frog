import type { PlatformConfig } from "@/entrypoints/subtitles.content/platforms"
import type { Config } from "@/types/config/config"
import type { SubtitlesFetcher } from "@/utils/subtitles/fetchers/types"
import type { SubtitlesFragment } from "@/utils/subtitles/types"
import { isSameLanguage } from "@read-frog/definitions"
import { toastManager } from "@/components/ui/base-ui/toast"
import { getLocalConfig } from "@/utils/config/storage"
import { TRANSLATION_BATCH_SIZE } from "@/utils/constants/subtitles"
import { getSourceDocumentTitle } from "@/utils/content/document-title"
import { resolveLanguageCodeFromLocale } from "@/utils/content/page-language"
import { i18n } from "@/utils/i18n"
import { optimizeSubtitles } from "@/utils/subtitles/processor/optimizer"
import { translateSubtitles } from "@/utils/subtitles/processor/translator"
import { downloadSubtitlesAsSrt } from "@/utils/subtitles/srt"
import {
  subtitlesStore,
  TranslatedDownloadPhase,
  translatedSubtitlesDownloadStatusAtom,
} from "./atoms"

const SUCCESS_MESSAGE_DURATION_MS = 4000
const TRANSLATED_EXPORT_BATCH_CONCURRENCY = 2

export class TranslatedSubtitlesDownloader {
  private isDownloading = false
  private operationId = 0
  private successTimeout: ReturnType<typeof setTimeout> | null = null
  private snapshotFetcher: SubtitlesFetcher | null = null

  constructor(
    private getFetcher: () => SubtitlesFetcher,
    private config: PlatformConfig,
  ) {}

  private get fetcher(): SubtitlesFetcher {
    return this.snapshotFetcher ?? this.getFetcher()
  }

  download = async (): Promise<void> => {
    if (this.isDownloading) {
      return
    }

    this.clearSuccessTimeout()
    this.isDownloading = true
    this.snapshotFetcher = this.getFetcher()
    const operationId = ++this.operationId
    const pageTitle = getSourceDocumentTitle()
    const videoId = this.config.getVideoId?.()
    this.setStatus(TranslatedDownloadPhase.Checking, null)

    try {
      const configSnapshot = await getLocalConfig()
      this.assertActive(operationId)
      if (!configSnapshot) {
        throw new Error(i18n.t("subtitles.errors.translatedExportFailed"))
      }

      const sourceSubtitles = await this.fetcher.fetch()
      this.assertActive(operationId)
      if (sourceSubtitles.length === 0) {
        throw new Error(i18n.t("subtitles.errors.noSubtitlesFound"))
      }

      this.assertDifferentTargetLanguage(configSnapshot)
      this.setStatus(TranslatedDownloadPhase.Preparing, 0)

      const fragments = this.fetcher.isPreSegmented?.()
        ? [...sourceSubtitles]
        : optimizeSubtitles(sourceSubtitles, this.fetcher.getSourceLanguage())
      this.assertActive(operationId)

      const translatedSubtitles = await this.translateAll(fragments, operationId)
      this.assertActive(operationId)

      await downloadSubtitlesAsSrt({
        subtitles: translatedSubtitles.map(({ translation, ...fragment }) => ({
          ...fragment,
          text: translation ?? "",
        })),
        pageTitle,
        videoId,
        suffix: "translated",
      })
      this.assertActive(operationId)

      this.setStatus(TranslatedDownloadPhase.Complete, null)
      this.successTimeout = setTimeout(() => {
        if (!this.isActive(operationId)) {
          return
        }
        this.successTimeout = null
        this.setStatus(TranslatedDownloadPhase.Idle, null)
      }, SUCCESS_MESSAGE_DURATION_MS)
    } catch (error) {
      if (!this.isActive(operationId)) {
        return
      }
      toastManager.add({
        type: "error",
        title: error instanceof Error ? error.message : String(error),
      })
      this.setStatus(TranslatedDownloadPhase.Idle, null)
    } finally {
      if (this.isActive(operationId)) {
        this.isDownloading = false
        this.snapshotFetcher = null
      }
    }
  }

  dispose(): void {
    this.operationId++
    this.isDownloading = false
    this.snapshotFetcher = null
    this.clearSuccessTimeout()
    this.setStatus(TranslatedDownloadPhase.Idle, null)
  }

  private async translateAll(
    fragments: SubtitlesFragment[],
    operationId: number,
  ): Promise<SubtitlesFragment[]> {
    const batches = this.buildTranslationBatches(fragments)
    const translatedFragments: SubtitlesFragment[] = []
    let translatedCount = 0

    for (let index = 0; index < batches.length; index += TRANSLATED_EXPORT_BATCH_CONCURRENCY) {
      const batchWindow = batches.slice(index, index + TRANSLATED_EXPORT_BATCH_CONCURRENCY)
      const translatedBatchWindow = await Promise.all(
        batchWindow.map(async (batch) => {
          const translatedBatch = await translateSubtitles(batch)
          this.assertActive(operationId)
          if (
            translatedBatch.length !== batch.length ||
            this.hasIncompleteTranslatedFragments(translatedBatch)
          ) {
            throw new Error(i18n.t("subtitles.errors.translatedExportIncomplete"))
          }
          return translatedBatch
        }),
      )
      this.assertActive(operationId)
      for (const translatedBatch of translatedBatchWindow) {
        translatedFragments.push(...translatedBatch)
        translatedCount += translatedBatch.length
        this.setStatus(
          TranslatedDownloadPhase.Translating,
          Math.min(100, Math.round((translatedCount / fragments.length) * 100)),
        )
      }
    }

    if (
      translatedFragments.length !== fragments.length ||
      this.hasIncompleteTranslatedFragments(translatedFragments)
    ) {
      throw new Error(i18n.t("subtitles.errors.translatedExportIncomplete"))
    }

    return translatedFragments
  }

  private hasIncompleteTranslatedFragments(fragments: SubtitlesFragment[]): boolean {
    return fragments.some((fragment) => !fragment.translation?.trim())
  }

  private buildTranslationBatches(fragments: SubtitlesFragment[]): SubtitlesFragment[][] {
    const batches: SubtitlesFragment[][] = []

    for (let index = 0; index < fragments.length; index += TRANSLATION_BATCH_SIZE) {
      batches.push(fragments.slice(index, index + TRANSLATION_BATCH_SIZE))
    }

    return batches
  }

  private clearSuccessTimeout(): void {
    if (this.successTimeout !== null) {
      clearTimeout(this.successTimeout)
      this.successTimeout = null
    }
  }

  private setStatus(phase: TranslatedDownloadPhase, progress: number | null): void {
    subtitlesStore.set(translatedSubtitlesDownloadStatusAtom, { phase, progress })
  }

  private isActive(operationId: number): boolean {
    return operationId === this.operationId
  }

  private assertActive(operationId: number): void {
    if (!this.isActive(operationId)) {
      throw new Error("Translated subtitle download was disposed")
    }
  }

  private assertDifferentTargetLanguage(config: Config): void {
    const targetLanguage = config.language.targetCode
    const sourceLanguage = resolveLanguageCodeFromLocale(this.fetcher.getSourceLanguage())

    if (targetLanguage && sourceLanguage && isSameLanguage(sourceLanguage, targetLanguage)) {
      throw new Error(i18n.t("subtitles.errors.translatedExportSameLanguage"))
    }
  }
}
