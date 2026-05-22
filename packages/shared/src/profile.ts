import { z } from 'zod';
import { ResumeJsonSchema } from './resume.js';

export const AchievementSchema = z.object({
  title: z.string().default(''),
  detail: z.string().default(''),
});
export type Achievement = z.infer<typeof AchievementSchema>;

export const CustomLinkSchema = z.object({
  label: z.string().default(''),
  url: z.string().default(''),
});

export const LinksSchema = z.object({
  linkedin: z.string().default(''),
  github: z.string().default(''),
  site: z.string().default(''),
  twitter: z.string().default(''),
  custom: z.array(CustomLinkSchema).default([]),
});
export type Links = z.infer<typeof LinksSchema>;

export const ProfileSchema = z.object({
  userId: z.string().uuid(),
  name: z.string().default(''),
  headline: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  resumeText: z.string().default(''),
  resumeJson: ResumeJsonSchema.nullable(),
  skills: z.array(z.string()).default([]),
  achievements: z.array(AchievementSchema).max(5).default([]),
  links: LinksSchema,
  onboardedAt: z.string().nullable(),
  updatedAt: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileUpdateSchema = ProfileSchema.partial().omit({
  userId: true,
  updatedAt: true,
});
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
