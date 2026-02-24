import 'tldraw'

/** Module augmentation to register custom shape types with Tldraw's type system */
declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    'social-card': {
      w: number
      h: number
      label: string
      platform: string
      backgroundColor: string
      title: string
      body: string
      ctaText: string
      fontFamily: string
      accentColor: string
      layout: string
    }
    'quote-card': {
      w: number
      h: number
      quoteText: string
      author: string
      bgGradientFrom: string
      bgGradientTo: string
      textColor: string
      fontFamily: string
      fontWeight: number
      fontSize: number
      textAlign: string
    }
    'carousel-slide': {
      w: number
      h: number
      slideNumber: number
      totalSlides: number
      title: string
      body: string
      bgColor: string
      titleFontFamily: string
      titleFontWeight: number
      bodyFontFamily: string
      bodyFontSize: number
    }
    'text-overlay': {
      w: number
      h: number
      text: string
      fontSize: number
      textColor: string
      bgOpacity: number
      position: string
      fontFamily: string
      fontWeight: number
      textAlign: string
      letterSpacing: number
      lineHeight: number
    }
    'brand-kit': {
      w: number
      h: number
      brandName: string
      tagline: string
      primaryColor: string
      secondaryColor: string
      fontFamily: string
      logoPlaceholder: boolean
    }
    'connector': {
      w: number
      h: number
      startX: number
      startY: number
      endX: number
      endY: number
      style: string
      stroke: string
      strokeWidth: number
      showArrow: boolean
    }
    'enhanced-image': {
      w: number
      h: number
      src: string
      assetId: string
    }
    'enhanced-text': {
      w: number
      h: number
      text: string
      fontSize: number
      textColor: string
      bgOpacity: number
      position: string
      fontFamily: string
      fontWeight: number
      textAlign: string
      letterSpacing: number
      lineHeight: number
    }
  }
}
