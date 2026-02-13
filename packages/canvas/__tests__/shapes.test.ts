import { describe, it, expect } from 'vitest'
import { QuoteCardShapeUtil } from '../src/shapes/quote-card-shape'
import { CarouselSlideShapeUtil } from '../src/shapes/carousel-slide-shape'
import { TextOverlayShapeUtil } from '../src/shapes/text-overlay-shape'
import { SocialCardShapeUtil } from '../src/shapes/social-card-shape'

describe('Shape Utils', () => {
  describe('QuoteCardShapeUtil', () => {
    it('has static type property', () => {
      expect(QuoteCardShapeUtil.type).toBe('quote-card')
    })

    it('getDefaultProps returns expected values', () => {
      const util = new QuoteCardShapeUtil()
      const props = util.getDefaultProps()
      expect(props.w).toBe(1080)
      expect(props.h).toBe(1080)
      expect(props.quoteText).toBe('Your inspiring quote here')
      expect(props.author).toBe('Author Name')
      expect(props.bgGradientFrom).toBe('#8b5cf6')
      expect(props.bgGradientTo).toBe('#ec4899')
      expect(props.textColor).toBe('#ffffff')
    })
  })

  describe('CarouselSlideShapeUtil', () => {
    it('has static type property', () => {
      expect(CarouselSlideShapeUtil.type).toBe('carousel-slide')
    })

    it('getDefaultProps returns slideNumber=1, totalSlides=5', () => {
      const util = new CarouselSlideShapeUtil()
      const props = util.getDefaultProps()
      expect(props.slideNumber).toBe(1)
      expect(props.totalSlides).toBe(5)
      expect(props.w).toBe(1080)
      expect(props.h).toBe(1080)
      expect(props.title).toBe('Slide Title')
      expect(props.body).toBe('Add your content here')
      expect(props.bgColor).toBe('#ffffff')
    })
  })

  describe('TextOverlayShapeUtil', () => {
    it('has static type property', () => {
      expect(TextOverlayShapeUtil.type).toBe('text-overlay')
    })

    it('getDefaultProps returns bgOpacity=0.5, fontSize=48', () => {
      const util = new TextOverlayShapeUtil()
      const props = util.getDefaultProps()
      expect(props.bgOpacity).toBe(0.5)
      expect(props.fontSize).toBe(48)
      expect(props.w).toBe(1080)
      expect(props.h).toBe(200)
      expect(props.text).toBe('Your text here')
      expect(props.textColor).toBe('#ffffff')
      expect(props.position).toBe('center')
    })
  })

  describe('SocialCardShapeUtil', () => {
    it('has static type property', () => {
      expect(SocialCardShapeUtil.type).toBe('social-card')
    })
  })
})
