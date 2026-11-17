import type { Config } from "@/types/config/config"
import type { ProviderConfig } from "@/types/config/provider"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import ProviderIcon from "@/components/provider-icon"
import { useTheme } from "@/components/providers/theme-provider"
import { Button } from "@/components/ui/base-ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/base-ui/dialog"
import { Input } from "@/components/ui/base-ui/input"
import { Label } from "@/components/ui/base-ui/label"
import { Switch } from "@/components/ui/base-ui/switch"
import { toastManager } from "@/components/ui/base-ui/toast"
import { configAtom, writeConfigAtom } from "@/utils/atoms/config"
import { FEATURE_KEYS, FEATURE_PROVIDER_DEFS } from "@/utils/constants/feature-providers"
import {
  API_PROVIDER_ITEMS,
  DEFAULT_PROVIDER_CONFIG,
  getProviderItemName,
  PROVIDER_ITEMS,
} from "@/utils/constants/providers"
import { getRandomUUID } from "@/utils/crypto-polyfill"
import { i18n } from "@/utils/i18n"
import { ConfigSection } from "../../../components/config-section"

type EditableProviderConfig = Extract<ProviderConfig, { provider: "deepl" | "deeplx" }>

function getAssignedFeatureCount(config: Config, id: string) {
  return FEATURE_KEYS.filter((key) => FEATURE_PROVIDER_DEFS[key].getProviderId(config) === id)
    .length
}

function ProviderCard({
  providerConfig,
  selected,
  onSelect,
}: {
  providerConfig: ProviderConfig
  selected: boolean
  onSelect: () => void
}) {
  const { theme } = useTheme()
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(writeConfigAtom)
  const item = PROVIDER_ITEMS[providerConfig.provider]
  const assignedCount = getAssignedFeatureCount(config, providerConfig.id)

  const toggle = (enabled: boolean) => {
    if (!enabled && assignedCount > 0) {
      toastManager.add({
        type: "error",
        title: i18n.t("options.apiProviders.form.providerInUseCannotDisable", [
          providerConfig.name,
          String(assignedCount),
        ]),
      })
      return
    }
    void setConfig({
      providersConfig: config.providersConfig.map((provider) =>
        provider.id === providerConfig.id ? { ...provider, enabled } : provider,
      ),
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onSelect()
      }}
      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
        selected ? "border-primary bg-accent/40" : "border-border hover:bg-accent/20"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <ProviderIcon logo={item?.logo(theme) ?? ""} name={providerConfig.name} size="base" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{providerConfig.name}</p>
          <p className="truncate text-xs text-muted-foreground">{item?.website}</p>
        </div>
      </div>
      <Switch
        checked={providerConfig.enabled}
        onCheckedChange={toggle}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  )
}

function ProviderForm({ providerConfig }: { providerConfig: EditableProviderConfig }) {
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(writeConfigAtom)

  const update = (changes: Partial<EditableProviderConfig>) => {
    void setConfig({
      providersConfig: config.providersConfig.map((provider) =>
        provider.id === providerConfig.id ? { ...provider, ...changes } : provider,
      ),
    })
  }

  const remove = () => {
    const assignedCount = getAssignedFeatureCount(config, providerConfig.id)
    if (assignedCount > 0) {
      toastManager.add({
        type: "error",
        title: i18n.t("options.apiProviders.form.providerInUseCannotDisable", [
          providerConfig.name,
          String(assignedCount),
        ]),
      })
      return
    }
    void setConfig({
      providersConfig: config.providersConfig.filter(
        (provider) => provider.id !== providerConfig.id,
      ),
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-col gap-1.5">
        <Label>{i18n.t("options.apiProviders.form.fields.name")}</Label>
        <Input
          value={providerConfig.name}
          onChange={(event) => update({ name: event.target.value })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>API Key</Label>
        <Input
          type="password"
          value={providerConfig.apiKey ?? ""}
          placeholder={i18n.t("options.apiProviders.form.fields.apiKey")}
          onChange={(event) => update({ apiKey: event.target.value })}
        />
      </div>
      {providerConfig.provider === "deeplx" && (
        <div className="flex flex-col gap-1.5">
          <Label>Base URL</Label>
          <Input
            value={providerConfig.baseURL ?? ""}
            placeholder={DEFAULT_PROVIDER_CONFIG.deeplx.baseURL}
            onChange={(event) => update({ baseURL: event.target.value })}
          />
        </div>
      )}
      <div className="flex justify-end">
        <Button variant="destructive" size="sm" onClick={remove}>
          <IconTrash className="size-4" />
          {i18n.t("options.apiProviders.form.delete")}
        </Button>
      </div>
    </div>
  )
}

function AddProviderDialog() {
  const [open, setOpen] = useState(false)
  const config = useAtomValue(configAtom)
  const setConfig = useSetAtom(writeConfigAtom)
  const { theme } = useTheme()

  const add = (providerType: "deepl" | "deeplx") => {
    const template = DEFAULT_PROVIDER_CONFIG[providerType]
    void setConfig({
      providersConfig: [
        ...config.providersConfig,
        {
          ...structuredClone(template),
          id: getRandomUUID(),
          name: getProviderItemName(providerType),
        },
      ],
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <IconPlus className="size-4" />
        {i18n.t("options.apiProviders.addProvider")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{i18n.t("options.apiProviders.dialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2">
          {(["deepl", "deeplx"] as const).map((providerType) => (
            <button
              key={providerType}
              type="button"
              className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent/30"
              onClick={() => add(providerType)}
            >
              <ProviderIcon logo={API_PROVIDER_ITEMS[providerType].logo(theme)} size="md" />
              <span className="text-sm font-medium">{getProviderItemName(providerType)}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ProvidersConfig() {
  const config = useAtomValue(configAtom)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = config.providersConfig.find((item) => item.id === selectedId)
  const editableSelected =
    selected && (selected.provider === "deepl" || selected.provider === "deeplx")

  return (
    <ConfigSection id="providers-config" title={i18n.t("options.apiProviders.configTitle")}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {config.providersConfig.map((providerConfig) => (
            <ProviderCard
              key={providerConfig.id}
              providerConfig={providerConfig}
              selected={providerConfig.id === selectedId}
              onSelect={() => setSelectedId(providerConfig.id)}
            />
          ))}
        </div>
        <AddProviderDialog />
        {editableSelected && <ProviderForm providerConfig={selected} />}
      </div>
    </ConfigSection>
  )
}
