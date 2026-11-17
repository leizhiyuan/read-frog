import type { ProviderConfig, ProvidersConfig } from "@/types/config/provider"
import type { FeatureKey } from "@/utils/constants/feature-providers"
import { isTranslateProvider } from "@/types/config/provider"

/** Every provider slot now runs the same kind of provider: a translation API. */
export type ProviderCapability = FeatureKey

export interface LocalProviderRef<T extends ProviderConfig = ProviderConfig> {
  kind: "local"
  config: T
  id: string
  name: string
}

export type ResolvedProviderRef<T extends ProviderConfig = ProviderConfig> = LocalProviderRef<T>

export type ProviderConfigForCapability = ProviderConfig
export type ProviderRefForCapability = ResolvedProviderRef

export function doesProviderSupportsCapability(
  _capability: ProviderCapability,
  providersConfig: ProvidersConfig,
  providerId: string,
  options: { requireEnable?: boolean } = {},
): boolean {
  const provider = providersConfig.find((item) => item.id === providerId)
  if (!provider || !isTranslateProvider(provider.provider)) return false
  return options.requireEnable ? provider.enabled : true
}

export function getProviderIdsForCapability(
  capability: ProviderCapability,
  providersConfig: ProvidersConfig,
  options: { requireEnable?: boolean } = {},
): string[] {
  return providersConfig
    .filter(
      (provider) =>
        isTranslateProvider(provider.provider) && (!options.requireEnable || provider.enabled),
    )
    .map((provider) => provider.id)
    .filter((id) => doesProviderSupportsCapability(capability, providersConfig, id, options))
}

export function getSelectableProvidersForCapability(
  _capability: ProviderCapability,
  providersConfig: ProvidersConfig,
): ProviderConfig[] {
  return providersConfig.filter((provider) => isTranslateProvider(provider.provider))
}

export function getSystemProviderIdsForCapability(_capability: ProviderCapability): string[] {
  return []
}

export function resolveProviderRefForCapability<T extends ProviderConfig>(
  _capability: ProviderCapability,
  providersConfig: ProvidersConfig,
  providerId: string,
): LocalProviderRef<T> | null {
  const provider = providersConfig.find((item) => item.id === providerId)
  if (!provider || !isTranslateProvider(provider.provider)) return null
  return {
    kind: "local",
    config: provider as T,
    id: provider.id,
    name: provider.name,
  }
}
