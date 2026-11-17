import { ToastProvider } from "@/components/ui/base-ui/toast"
import {
  SELECTION_CONTENT_OVERLAY_LAYERS,
  SELECTION_CONTENT_OVERLAY_ROOT_ATTRIBUTE,
} from "@/utils/constants/selection-overlay-layers"
import { useCornerToastSurface } from "@/utils/content-runtime/corner-toasts"
import { useInputTranslation } from "./input-translation"

/**
 * Input box translation is the only selection-surface feature left. It needs no
 * UI of its own, but its error toasts do, so this still mounts one toast surface.
 */
function InputTranslationBridge() {
  useInputTranslation()
  useCornerToastSurface()
  return null
}

export default function App({ portalContainer }: { portalContainer: HTMLElement }) {
  return (
    <ToastProvider
      portalProps={{ container: portalContainer }}
      viewportProps={{
        className: SELECTION_CONTENT_OVERLAY_LAYERS.selectionOverlay,
        ...{ [SELECTION_CONTENT_OVERLAY_ROOT_ATTRIBUTE]: "" },
      }}
    >
      <InputTranslationBridge />
    </ToastProvider>
  )
}
