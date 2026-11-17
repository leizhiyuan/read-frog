import { useAtomValue } from "jotai"
import { useEffect, useRef } from "react"
import { configFieldsAtomMap } from "@/utils/atoms/config"
import { HOVER_PAUSE_DELAY_MS } from "@/utils/constants/subtitles"
import { subtitlesHoveredAtom } from "./interaction-atoms"
import { useSubtitlesUI } from "./subtitles-ui-context"

/**
 * Holds the video while the pointer rests on the subtitles, and plays it again
 * once it leaves, unless the viewer pressed play in between.
 *
 * The pointer has to rest for HOVER_PAUSE_DELAY_MS before it pauses, so one
 * passing over the subtitles on its way to the player's controls does not.
 */
export function useHoldPlayback() {
  const hovered = useAtomValue(subtitlesHoveredAtom)
  const { pauseOnHover } = useAtomValue(configFieldsAtomMap.videoSubtitles)
  const { getVideoElement } = useSubtitlesUI()
  const pausedByHoldRef = useRef(false)
  const hoverHolds = pauseOnHover && hovered

  useEffect(() => {
    const video = getVideoElement()
    if (!video || !hoverHolds) {
      return undefined
    }

    const pause = () => {
      if (video.paused) {
        return
      }
      video.pause()
      pausedByHoldRef.current = true
    }

    const timer = window.setTimeout(pause, HOVER_PAUSE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [getVideoElement, hoverHolds])

  useEffect(() => {
    const video = getVideoElement()
    if (!hoverHolds || !video) {
      return undefined
    }

    const forgetPause = () => {
      pausedByHoldRef.current = false
    }
    video.addEventListener("play", forgetPause)

    return () => {
      video.removeEventListener("play", forgetPause)
      if (pausedByHoldRef.current) {
        pausedByHoldRef.current = false
        void video.play()
      }
    }
  }, [getVideoElement, hoverHolds])
}
