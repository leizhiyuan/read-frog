import type { Config } from "@/types/config/config"
import type { TranslateProviderConfig } from "@/types/config/provider"
import type { SubtitlesFragment } from "@/utils/subtitles/types"
import { getLocalConfig } from "@/utils/config/storage"
import { Sha256Hex } from "@/utils/hash"
import { sendMessage } from "@/utils/message"

/** Per-request context retained for call-site compatibility. */
export interface SubtitlesVideoContext {
  videoTitle?: string
  subtitlesTextContent?: string
}

async function translateFragment(
  fragment: SubtitlesFragment,
  config: Config,
  providerConfig: TranslateProviderConfig,
): Promise<SubtitlesFragment> {
  const hash = Sha256Hex(
    fragment.text,
    providerConfig.id,
    config.language.sourceCode,
    config.language.targetCode,
    "videoSubtitles",
  )
  const translation = await sendMessage("enqueueSubtitlesTranslateRequest", {
    text: fragment.text,
    langConfig: config.language,
    providerConfig,
    scheduleAt: Date.now(),
    hash,
  })

  return { ...fragment, translation }
}

/** Translate one batch of cues through the background request queue. */
export async function translateSubtitles(
  fragments: SubtitlesFragment[],
  _context?: SubtitlesVideoContext,
): Promise<SubtitlesFragment[]> {
  const config = await getLocalConfig()
  if (!config) {
    return fragments.map((fragment) => ({ ...fragment, translation: "" }))
  }

  const providerConfig = config.providersConfig.find(
    (provider) => provider.id === config.videoSubtitles.providerId,
  )
  if (!providerConfig) {
    throw new Error(`No subtitle translation provider for id "${config.videoSubtitles.providerId}"`)
  }

  return Promise.all(
    fragments.map((fragment) => translateFragment(fragment, config, providerConfig)),
  )
}
