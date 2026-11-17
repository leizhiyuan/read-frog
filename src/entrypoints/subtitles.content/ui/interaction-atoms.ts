import { atom } from "jotai"

/** Whether the pointer is over the subtitles. */
export const subtitlesHoveredAtom = atom(false)

/** Whether the subtitles hold still, which keeps the box from moving under the pointer. */
export const subtitlesHeldAtom = atom((get) => get(subtitlesHoveredAtom))
