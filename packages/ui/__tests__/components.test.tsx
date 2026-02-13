import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Badge } from '../src/components/badge'
import { Skeleton } from '../src/components/skeleton'
import { Textarea } from '../src/components/textarea'
import { Separator } from '../src/components/separator'
import { Progress } from '../src/components/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../src/components/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '../src/components/table'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../src/components/tooltip'
import { Dialog, DialogTrigger, DialogContent } from '../src/components/dialog'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../src/components/select'

describe('Badge', () => {
  it('renders with default variant', () => {
    const { container } = render(<Badge>Test</Badge>)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders all variants', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const
    for (const variant of variants) {
      const { container } = render(<Badge variant={variant}>Test</Badge>)
      expect(container.firstChild).toBeTruthy()
    }
  })
})

describe('Skeleton', () => {
  it('renders correctly', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toBeTruthy()
  })

  it('has animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    const element = container.firstChild as HTMLElement
    expect(element.className).toContain('animate-pulse')
  })
})

describe('Textarea', () => {
  it('renders correctly', () => {
    const { container } = render(<Textarea placeholder="Type here..." />)
    expect(container.querySelector('textarea')).toBeTruthy()
  })

  it('accepts custom className', () => {
    const { container } = render(<Textarea className="custom-class" />)
    const textarea = container.querySelector('textarea')
    expect(textarea?.className).toContain('custom-class')
  })
})

describe('Separator', () => {
  it('renders horizontal separator by default', () => {
    const { container } = render(<Separator />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders vertical separator', () => {
    const { container } = render(<Separator orientation="vertical" />)
    expect(container.firstChild).toBeTruthy()
  })
})

describe('Progress', () => {
  it('renders with value', () => {
    const { container } = render(<Progress value={50} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders indicator with correct transform', () => {
    const { container } = render(<Progress value={75} />)
    const indicator = container.querySelector('[style*="transform"]')
    expect(indicator).toBeTruthy()
  })
})

describe('Tabs', () => {
  it('renders tabs structure', () => {
    const { container } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )
    expect(container.firstChild).toBeTruthy()
  })

  it('renders tab triggers', () => {
    const { getByText } = render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    expect(getByText('Tab 1')).toBeTruthy()
  })
})

describe('Table', () => {
  it('renders table structure', () => {
    const { container } = render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(container.querySelector('table')).toBeTruthy()
  })

  it('renders caption', () => {
    const { getByText } = render(
      <Table>
        <TableCaption>Table caption</TableCaption>
      </Table>
    )
    expect(getByText('Table caption')).toBeTruthy()
  })
})

describe('Tooltip', () => {
  it('renders tooltip root', () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(container.firstChild).toBeTruthy()
  })
})

describe('Dialog', () => {
  it('renders dialog root', () => {
    const { container } = render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>Content</DialogContent>
      </Dialog>
    )
    expect(container.firstChild).toBeTruthy()
  })
})

describe('Select', () => {
  it('renders select root', () => {
    const { container } = render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item 1</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(container.firstChild).toBeTruthy()
  })
})
