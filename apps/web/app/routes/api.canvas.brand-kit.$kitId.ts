/**
 * API route for individual brand kit operations (get/update/delete)
 */
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { prisma } from '@creator-studio/db'
import { requireSession } from '~/lib/auth-server'

export async function loader({ request, params }: LoaderFunctionArgs) {
  const session = await requireSession(request)
  const { kitId } = params

  if (!kitId) {
    return Response.json({ error: 'Kit ID required' }, { status: 400 })
  }

  try {
    const kit = await prisma.brandKit.findUnique({
      where: { id: kitId },
      include: {
        colors: { orderBy: { sortOrder: 'asc' } },
        fonts: true,
        logos: true,
      },
    })

    if (!kit) {
      return Response.json({ error: 'Kit not found' }, { status: 404 })
    }

    if (kit.userId !== session.user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json({ kit })
  } catch (error) {
    console.error('Failed to fetch brand kit:', error)
    return Response.json({ error: 'Failed to fetch brand kit' }, { status: 500 })
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const session = await requireSession(request)
  const { kitId } = params

  if (!kitId) {
    return Response.json({ error: 'Kit ID required' }, { status: 400 })
  }

  const kit = await prisma.brandKit.findUnique({
    where: { id: kitId },
    select: { userId: true },
  })

  if (!kit) {
    return Response.json({ error: 'Kit not found' }, { status: 404 })
  }

  if (kit.userId !== session.user.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (request.method === 'DELETE') {
    try {
      await prisma.brandKit.delete({ where: { id: kitId } })
      return Response.json({ success: true })
    } catch (error) {
      console.error('Failed to delete brand kit:', error)
      return Response.json({ error: 'Failed to delete brand kit' }, { status: 500 })
    }
  }

  if (request.method === 'PUT') {
    try {
      const body = await request.json()
      const { name, colors = [], fonts = [], logos = [] } = body

      const updatedKit = await prisma.$transaction(async (tx) => {
        await tx.brandColor.deleteMany({ where: { kitId } })
        await tx.brandFont.deleteMany({ where: { kitId } })
        await tx.brandLogo.deleteMany({ where: { kitId } })

        return tx.brandKit.update({
          where: { id: kitId },
          data: {
            name: name || undefined,
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
      })

      return Response.json({ kit: updatedKit })
    } catch (error) {
      console.error('Failed to update brand kit:', error)
      return Response.json({ error: 'Failed to update brand kit' }, { status: 500 })
    }
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}
