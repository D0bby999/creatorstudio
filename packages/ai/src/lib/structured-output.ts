import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { ContentPlanSchema, PostDraftSchema, DesignBriefSchema } from '../types/ai-types'
import type { ContentPlan, PostDraft, DesignBrief } from '../types/ai-types'

export async function generateContentPlan(prompt: string): Promise<ContentPlan> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: ContentPlanSchema,
    prompt: `Create a content plan: ${prompt}`,
  })
  return object
}

export async function generatePostDraft(prompt: string, platform: string): Promise<PostDraft> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: PostDraftSchema,
    prompt: `Write a ${platform} post: ${prompt}`,
  })
  return object
}

export async function generateDesignBrief(prompt: string): Promise<DesignBrief> {
  const { object } = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: DesignBriefSchema,
    prompt: `Create a design brief: ${prompt}`,
  })
  return object
}
