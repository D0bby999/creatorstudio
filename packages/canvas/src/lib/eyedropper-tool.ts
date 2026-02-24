interface EyeDropperAPI {
  open(): Promise<{ sRGBHex: string }>
}

declare global {
  interface Window {
    EyeDropper?: new () => EyeDropperAPI
  }
}

export function isEyeDropperSupported(): boolean {
  return 'EyeDropper' in window
}

export async function pickColor(): Promise<string | null> {
  if (!isEyeDropperSupported()) return null

  try {
    const eyeDropper = new window.EyeDropper!()
    const result = await eyeDropper.open()
    return result.sRGBHex
  } catch {
    return null
  }
}
