/**
 * API route for brand kit management (list/create)
 */
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { prisma } from '@creator-studio/db'
import { requireSession } from '~/lib/auth-server'

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await requireSession(request)

  try {
    const kits = await prisma.brandKit.findMany({
      where: { userId: session.user.id },
      include: {
        colors: { orderBy: { sortOrder: 'asc' } },
        fonts: true,
        logos: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ kits })
  } catch (error) {
    console.error('Failed to fetch brand kits:', error)
    return Response.json({ error: 'Failed to fetch brand kits' }, { status: 500 })
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await requireSession(request)

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    const body = await request.json()
    const { name, colors = [], fonts = [], logos = [] } = body

    if (!name || typeof name !== 'string') {
      return Response.json({ error: 'Invalid kit name' }, { status: 400 })
    }

    const kit = await prisma.brandKit.create({
      data: {
        name: name.trim(),
        userId: session.user.id,
        colors: {
          create: colors.map((c: any, index: number) => ({
            label: c.label,
            hex: c.hex,
            role: c.role || 'accent',
            sortOrder: c.sortOrder ?? index,
          })),
        },
        fonts: {
          create: fonts.map((f: any) => ({
            role: f.role,
            family: f.family,
            weight: f.weight || 400,
          })),
        },
        logos: {
          create: logos.map((l: any) => ({
            name: l.name,
            url: l.url,
            variant: l.variant || 'primary',
          })),
        },
      },
      include: {
        colors: { orderBy: { sortOrder: 'asc' } },
        fonts: true,
        logos: true,
      },
    })

    return Response.json({ kit })
  } catch (error) {
    console.error('Failed to create brand kit:', error)
    return Response.json({ error: 'Failed to create brand kit' }, { status: 500 })
  }
}
