/**
 * SVG content sanitizer — strips dangerous elements, event handlers,
 * javascript URIs, CSS expressions, and external references.
 */
export function sanitizeSvgContent(svg: string): string {
  let s = svg
  // Remove dangerous elements
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  s = s.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
  s = s.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
  s = s.replace(/<embed\b[^>]*\/?>/gi, '')
  s = s.replace(/<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi, '')
  // Remove event handlers (both quoted and unquoted)
  s = s.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  s = s.replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
  // Remove javascript URIs
  s = s.replace(/href\s*=\s*["']?\s*javascript\s*:/gi, 'href="')
  s = s.replace(/xlink:href\s*=\s*["']?\s*javascript\s*:/gi, 'xlink:href="')
  // Remove CSS expressions
  s = s.replace(/expression\s*\(/gi, 'blocked(')
  // Remove external use references
  s = s.replace(/<use\b[^>]*href\s*=\s*["']https?:\/\/[^"']*["'][^>]*\/?>/gi, '')
  return s
}
