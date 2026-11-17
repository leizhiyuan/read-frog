import type { Config } from "@/types/config/config"
import type {
  APIProviderConfig,
  ProviderConfig,
  ProvidersConfig,
  TranslateProviderConfig,
} from "@/types/config/provider"
import type { FeatureKey } from "@/utils/constants/feature-providers"
import { isAPIProviderConfig, isTranslateProviderConfig } from "@/types/config/provider"
import { FEATURE_KEYS, FEATURE_PROVIDER_DEFS } from "@/utils/constants/feature-providers"
import { getUsableProviderIdsForCapability } from "@/utils/providers/provider-availability"

export function getProviderConfigById<T extends ProviderConfig>(
  providersConfig: T[],
  providerId: string,
): T | undefined {
  return providersConfig.find((p) => p.id === providerId)
}

export function getAPIProvidersConfig(providersConfig: ProvidersConfig): APIProviderConfig[] {
  return providersConfig.filter(isAPIProviderConfig)
}

export function getTranslateProvidersConfig(
  providersConfig: ProvidersConfig,
): TranslateProviderConfig[] {
  return providersConfig.filter(isTranslateProviderConfig)
}

export function filterEnabledProvidersConfig(providersConfig: ProvidersConfig): ProvidersConfig {
  return providersConfig.filter((p) => p.enabled)
}

/**
 * Compute fallback provider assignments when a provider is deleted.
 * For each feature using the deleted provider, picks the first remaining
 * provider that can actually run it.
 */
export function computeProviderFallbacksAfterDeletion(
  deletedProviderId: string,
  config: Config,
  remainingProviders: ProvidersConfig,
): Partial<Record<FeatureKey, string>> {
  const updates: Partial<Record<FeatureKey, string>> = {}
  for (const key of FEATURE_KEYS) {
    const def = FEATURE_PROVIDER_DEFS[key]
    const currentId = def.getProviderId(config)
    if (currentId !== deletedProviderId) continue
    const fallbackProviderId = getUsableProviderIdsForCapability(key, remainingProviders)[0]
    if (fallbackProviderId) updates[key] = fallbackProviderId
  }
  return updates
}

/**
 * The first feature that would be left with no enabled provider that can run
 * it, or null when every feature keeps a working one.
 */
export function findFeatureMissingProvider(remainingProviders: ProvidersConfig): FeatureKey | null {
  for (const key of FEATURE_KEYS) {
    if (!getUsableProviderIdsForCapability(key, remainingProviders)[0]) {
      return key
    }
  }
  return null
}
