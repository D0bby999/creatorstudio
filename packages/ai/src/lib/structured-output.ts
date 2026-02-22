import { generateText, Output } from 'ai'
import { resolveModelForTask } from './model-resolver'
import { ContentPlanSchema, PostDraftSchema, DesignBriefSchema } from '../types/ai-types'
import type { ContentPlan, PostDraft, DesignBrief } from '../types/ai-types'

export async function generateContentPlan(prompt: string, brandContext?: string): Promise<ContentPlan> {
  const brandPrefix = brandContext ? `${brandContext}\n\n` : ''
  const { output } = await generateText({
    model: resolveModelForTask('structured'),
    output: Output.object({ schema: ContentPlanSchema }),
    prompt: `${brandPrefix}Create a content plan: ${prompt}`,
  })
  return output!
}

export async function generatePostDraft(prompt: string, platform: string, brandContext?: string): Promise<PostDraft> {
  const brandPrefix = brandContext ? `${brandContext}\n\n` : ''
  const { output } = await generateText({
    model: resolveModelForTask('structured'),
    output: Output.object({ schema: PostDraftSchema }),
    prompt: `${brandPrefix}Write a ${platform} post: ${prompt}`,
  })
  return output!
}

export async function generateDesignBrief(prompt: string, brandContext?: string): Promise<DesignBrief> {
  const brandPrefix = brandContext ? `${brandContext}\n\n` : ''
  const { output } = await generateText({
    model: resolveModelForTask('structured'),
    output: Output.object({ schema: DesignBriefSchema }),
    prompt: `${brandPrefix}Create a design brief: ${prompt}`,
  })
  return output!
}
