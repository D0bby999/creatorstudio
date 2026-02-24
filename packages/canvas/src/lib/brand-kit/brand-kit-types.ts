/**
 * Brand kit type definitions for consistent branding across canvas projects
 */

export type BrandColorRole = 'primary' | 'secondary' | 'accent' | 'bg' | 'text'

export interface BrandColorData {
  id?: string
  label: string
  hex: string
  role: BrandColorRole
  sortOrder?: number
}

export type BrandFontRole = 'heading' | 'body' | 'accent'

export interface BrandFontData {
  id?: string
  role: BrandFontRole
  family: string
  weight: number
}

export type BrandLogoVariant = 'primary' | 'icon' | 'horizontal' | 'monochrome'

export interface BrandLogoData {
  id?: string
  name: string
  url: string
  variant: BrandLogoVariant
}

export interface BrandKitData {
  id?: string
  name: string
  isDefault?: boolean
  colors: BrandColorData[]
  fonts: BrandFontData[]
  logos: BrandLogoData[]
  createdAt?: string
  updatedAt?: string
}

export interface BrandKitSummary {
  id: string
  name: string
  isDefault: boolean
  colorCount: number
  fontCount: number
  logoCount: number
}
