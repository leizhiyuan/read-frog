import type { ProviderCapability } from "./provider-registry"
import type { ProvidersConfig } from "@/types/config/provider"
import { getProviderIdsForCapability } from "./provider-registry"

export function isProviderIdDurablyUnusable(
  _providerId: string,
  _capability: ProviderCapability,
  _status?: unknown,
): boolean {
  return false
}

export function getUsableProviderIdsForCapability(
  capability: ProviderCapability,
  providersConfig: ProvidersConfig,
  _status?: unknown,
): string[] {
  return getProviderIdsForCapability(capability, providersConfig, { requireEnable: true })
}
