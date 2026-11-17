import type {
  AnalyticsBackendKind,
  AnalyticsProvider,
  FeatureProviderAnalytics,
} from "@/types/analytics"
import type { ProviderConfig } from "@/types/config/provider"
import { ANALYTICS_PROVIDER } from "@/types/analytics"
import { ALL_PROVIDER_TYPES } from "@/types/config/provider"

const VALID_BACKEND_KINDS = new Set<AnalyticsBackendKind>(["llm", "non_llm", "unknown"])
const VALID_CANONICAL_PROVIDERS = new Set<string>(ALL_PROVIDER_TYPES)

export const UNKNOWN_FEATURE_PROVIDER: FeatureProviderAnalytics = {
  provider: ANALYTICS_PROVIDER.UNKNOWN,
  backend_kind: "unknown",
}

export function classifyProviderConfig(
  providerConfig: ProviderConfig | null | undefined,
): FeatureProviderAnalytics {
  if (!providerConfig) return UNKNOWN_FEATURE_PROVIDER

  return {
    provider: providerConfig.provider,
    backend_kind: "non_llm",
  }
}

/** Every provider left is a direct translation API. */
export const classifyResolvedProvider = classifyProviderConfig

export function normalizeFeatureProviderAnalytics(
  provider: unknown,
  backendKind: unknown,
): FeatureProviderAnalytics {
  if (
    typeof provider !== "string" ||
    !VALID_BACKEND_KINDS.has(backendKind as AnalyticsBackendKind)
  ) {
    return UNKNOWN_FEATURE_PROVIDER
  }

  if (provider === ANALYTICS_PROVIDER.UNKNOWN && backendKind === "unknown") {
    return UNKNOWN_FEATURE_PROVIDER
  }
  if (VALID_CANONICAL_PROVIDERS.has(provider) && backendKind === "non_llm") {
    return {
      provider: provider as AnalyticsProvider,
      backend_kind: "non_llm",
    }
  }

  return UNKNOWN_FEATURE_PROVIDER
}
