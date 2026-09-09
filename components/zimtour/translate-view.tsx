"use client"

import { ModalVoiceTranslator } from "./modal-voice-translator"

export function TranslateView() {
  return (
    <div className="w-full h-full flex-1 flex flex-col min-h-[calc(100vh-100px)]">
      <ModalVoiceTranslator inline={true} />
    </div>
  )
}
