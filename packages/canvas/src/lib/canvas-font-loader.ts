export interface FontInfo {
  family: string
  weights: number[]
  category: 'sans' | 'serif' | 'display' | 'mono' | 'system'
}

export const CURATED_FONTS: FontInfo[] = [
  // Sans (30 fonts)
  { family: 'Inter', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Roboto', weights: [400, 500, 700], category: 'sans' },
  { family: 'Open Sans', weights: [400, 600, 700], category: 'sans' },
  { family: 'Lato', weights: [400, 700], category: 'sans' },
  { family: 'Montserrat', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Poppins', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Nunito', weights: [400, 600, 700], category: 'sans' },
  { family: 'Raleway', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Oswald', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Rubik', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Source Sans Pro', weights: [400, 600, 700], category: 'sans' },
  { family: 'Work Sans', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Karla', weights: [400, 700], category: 'sans' },
  { family: 'Manrope', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'DM Sans', weights: [400, 500, 700], category: 'sans' },
  { family: 'Plus Jakarta Sans', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Outfit', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Figtree', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Sora', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Space Grotesk', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Red Hat Display', weights: [400, 500, 700], category: 'sans' },
  { family: 'Urbanist', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Barlow', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Josefin Sans', weights: [400, 600, 700], category: 'sans' },
  { family: 'Quicksand', weights: [400, 500, 600, 700], category: 'sans' },
  { family: 'Mulish', weights: [400, 500, 600, 700], category: 'sans' },
  // Serif (18 fonts)
  { family: 'Playfair Display', weights: [400, 600, 700], category: 'serif' },
  { family: 'Merriweather', weights: [400, 700], category: 'serif' },
  { family: 'Lora', weights: [400, 600, 700], category: 'serif' },
  { family: 'PT Serif', weights: [400, 700], category: 'serif' },
  { family: 'Crimson Text', weights: [400, 600, 700], category: 'serif' },
  { family: 'Source Serif Pro', weights: [400, 600, 700], category: 'serif' },
  { family: 'Libre Baskerville', weights: [400, 700], category: 'serif' },
  { family: 'EB Garamond', weights: [400, 500, 600, 700], category: 'serif' },
  { family: 'Cormorant Garamond', weights: [400, 500, 600, 700], category: 'serif' },
  { family: 'Bitter', weights: [400, 700], category: 'serif' },
  { family: 'Spectral', weights: [400, 600, 700], category: 'serif' },
  { family: 'Noto Serif', weights: [400, 700], category: 'serif' },
  { family: 'Vollkorn', weights: [400, 600, 700], category: 'serif' },
  { family: 'Cardo', weights: [400, 700], category: 'serif' },
  { family: 'Newsreader', weights: [400, 600, 700], category: 'serif' },
  { family: 'Fraunces', weights: [400, 600, 700], category: 'serif' },
  { family: 'DM Serif Display', weights: [400], category: 'serif' },
  { family: 'Bodoni Moda', weights: [400, 500, 600, 700], category: 'serif' },
  // Display (33 fonts)
  { family: 'Bebas Neue', weights: [400], category: 'display' },
  { family: 'Lobster', weights: [400], category: 'display' },
  { family: 'Pacifico', weights: [400], category: 'display' },
  { family: 'Caveat', weights: [400, 600, 700], category: 'display' },
  { family: 'Dancing Script', weights: [400, 600, 700], category: 'display' },
  { family: 'Righteous', weights: [400], category: 'display' },
  { family: 'Fredoka One', weights: [400], category: 'display' },
  { family: 'Anton', weights: [400], category: 'display' },
  { family: 'Archivo Black', weights: [400], category: 'display' },
  { family: 'Black Ops One', weights: [400], category: 'display' },
  { family: 'Bungee', weights: [400], category: 'display' },
  { family: 'Lilita One', weights: [400], category: 'display' },
  { family: 'Luckiest Guy', weights: [400], category: 'display' },
  { family: 'Permanent Marker', weights: [400], category: 'display' },
  { family: 'Press Start 2P', weights: [400], category: 'display' },
  { family: 'Russo One', weights: [400], category: 'display' },
  { family: 'Alfa Slab One', weights: [400], category: 'display' },
  { family: 'Squada One', weights: [400], category: 'display' },
  { family: 'Teko', weights: [400, 500, 600, 700], category: 'display' },
  { family: 'Secular One', weights: [400], category: 'display' },
  { family: 'Staatliches', weights: [400], category: 'display' },
  { family: 'Satisfy', weights: [400], category: 'display' },
  { family: 'Great Vibes', weights: [400], category: 'display' },
  { family: 'Sacramento', weights: [400], category: 'display' },
  { family: 'Kaushan Script', weights: [400], category: 'display' },
  { family: 'Cookie', weights: [400], category: 'display' },
  { family: 'Courgette', weights: [400], category: 'display' },
  { family: 'Allura', weights: [400], category: 'display' },
  { family: 'Tangerine', weights: [400, 700], category: 'display' },
  { family: 'Alex Brush', weights: [400], category: 'display' },
  { family: 'Lobster Two', weights: [400, 700], category: 'display' },
  { family: 'Handlee', weights: [400], category: 'display' },
  { family: 'Patrick Hand', weights: [400], category: 'display' },
  // Mono (10 fonts)
  { family: 'JetBrains Mono', weights: [400, 500, 700], category: 'mono' },
  { family: 'Fira Code', weights: [400, 500, 700], category: 'mono' },
  { family: 'Source Code Pro', weights: [400, 500, 700], category: 'mono' },
  { family: 'Space Mono', weights: [400, 700], category: 'mono' },
  { family: 'IBM Plex Mono', weights: [400, 500, 700], category: 'mono' },
  { family: 'Inconsolata', weights: [400, 700], category: 'mono' },
  { family: 'Ubuntu Mono', weights: [400, 700], category: 'mono' },
  { family: 'Red Hat Mono', weights: [400, 500, 700], category: 'mono' },
  { family: 'Overpass Mono', weights: [400, 600, 700], category: 'mono' },
  { family: 'Anonymous Pro', weights: [400, 700], category: 'mono' },
  // System fallbacks (4 fonts)
  { family: 'sans-serif', weights: [400, 700], category: 'system' },
  { family: 'serif', weights: [400, 700], category: 'system' },
  { family: 'monospace', weights: [400, 700], category: 'system' },
  { family: 'cursive', weights: [400, 700], category: 'system' },
]

const loadedFonts = new Set<string>()
const loadingFonts = new Map<string, Promise<void>>()
const loadedLinks = new Map<string, HTMLLinkElement>()

const SYSTEM_FONTS = new Set(['sans-serif', 'serif', 'monospace', 'cursive'])

export function isFontLoaded(family: string): boolean {
  return loadedFonts.has(family)
}

export function getFontList(): FontInfo[] {
  return CURATED_FONTS
}

export function getFontsByCategory(): Record<string, FontInfo[]> {
  const grouped: Record<string, FontInfo[]> = {}
  for (const font of CURATED_FONTS) {
    if (!grouped[font.category]) grouped[font.category] = []
    grouped[font.category].push(font)
  }
  return grouped
}

export async function loadFont(family: string, weight: number = 400): Promise<void> {
  const key = `${family}:${weight}`
  if (loadedFonts.has(family)) return
  if (SYSTEM_FONTS.has(family)) {
    loadedFonts.add(family)
    return
  }

  const existing = loadingFonts.get(key)
  if (existing) return existing

  const promise = doLoadFont(family, weight)
  loadingFonts.set(key, promise)

  try {
    await promise
    loadedFonts.add(family)
  } finally {
    loadingFonts.delete(key)
  }
}

/** Remove all injected font <link> elements from document.head */
export function cleanupFonts(): void {
  for (const [, link] of loadedLinks) {
    link.remove()
  }
  loadedLinks.clear()
  loadedFonts.clear()
  loadingFonts.clear()
}

/** Get count of currently tracked font links (for monitoring) */
export function getLoadedFontCount(): number {
  return loadedLinks.size
}

async function doLoadFont(family: string, weight: number): Promise<void> {
  const encoded = family.replace(/ /g, '+')
  const linkId = `gfont-${encoded}-${weight}`

  if (!document.getElementById(linkId)) {
    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@${weight}&display=swap`
    document.head.appendChild(link)
    loadedLinks.set(linkId, link)
  }

  const fontSpec = `${weight} 16px "${family}"`
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000))
  const fontLoad = document.fonts.load(fontSpec).then(() => {})

  await Promise.race([fontLoad, timeout])
}
