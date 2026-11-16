import { z } from 'zod';

export const TIERS = ['green', 'amber', 'red'] as const;
export const TierSchema = z.enum(TIERS);
export type Tier = z.infer<typeof TierSchema>;

/** Limits from the PRD (story format section). Proposed values; tune after testing. */
export const LIMITS = {
  pagesMin: 5,
  pagesMax: 8,
  pageSentencesMin: 2,
  pageSentencesMax: 4,
  pageWordsMax: 45,
  endingWordsMax: 15,
  titleWordsMax: 8,
  talkAbout: 2,
  imageScenesMax: 3, // cover plus up to 3 key-moment illustrations
} as const;

/** What the parent tells us. Only name, age and moment are required. */
export const BriefSchema = z.object({
  name: z.string().trim().min(1).max(30),
  age: z.number().int().min(3).max(9),
  /** Hero look (skin tone, hair or animal). Used for the image character card, never sent to the story prompt. */
  look: z.string().trim().max(120).optional(),
  moment: z.string().trim().min(1).max(600),
  feeling: z.string().trim().max(120).optional(),
});
export type Brief = z.infer<typeof BriefSchema>;

export const PageSchema = z.object({
  n: z.number().int().min(1),
  text: z.string().min(1),
  /** One-sentence scene for an illustration, or null when the page has no image. */
  scene: z.string().nullable(),
});

export const StorySchema = z.object({
  title: z.string(),
  safety: z.object({ tier: TierSchema, notes: z.string() }),
  cover_scene: z.string().nullable(),
  pages: z.array(PageSchema),
  ending_line: z.string().nullable(),
  talk_about: z.array(z.string()),
  facts_used: z.array(z.string()),
  facts_added: z.array(z.string()),
});
export type Story = z.infer<typeof StorySchema>;
