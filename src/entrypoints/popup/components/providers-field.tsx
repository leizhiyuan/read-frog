import { useAtomValue, useSetAtom } from "jotai"
import { HelpTooltip } from "@/components/help-tooltip"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/base-ui/select"
import { configAtom, configFieldsAtomMap, writeConfigAtom } from "@/utils/atoms/config"
import {
  buildFeatureProviderPatch,
  FEATURE_PROVIDER_DEFS,
  getFeatureLabelI18nKey,
} from "@/utils/constants/feature-providers"
import { i18n } from "@/utils/i18n"

export default function ProvidersField() {
  const config = useAtomValue(configAtom)
  const providersConfig = useAtomValue(configFieldsAtomMap.providersConfig)
  const setConfig = useSetAtom(writeConfigAtom)
  const providers = providersConfig.filter((provider) => provider.enabled)

  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-center gap-1.5 text-[13px] font-medium">
        {i18n.t("popup.providers.title")}
        <HelpTooltip>{i18n.t("popup.providers.description")}</HelpTooltip>
      </span>
      {(["pageTranslation", "videoSubtitles", "inputTranslation"] as const).map((featureKey) => (
        <div key={featureKey} className="flex items-center justify-between gap-2">
          <span className="text-[13px] text-muted-foreground">
            {i18n.t(getFeatureLabelI18nKey(featureKey))}
          </span>
          <Select
            value={FEATURE_PROVIDER_DEFS[featureKey].getProviderId(config)}
            onValueChange={(providerId) => {
              if (!providerId) return
              void setConfig(buildFeatureProviderPatch({ [featureKey]: providerId }))
            }}
          >
            <SelectTrigger size="sm" className="max-w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  )
}
