import { z } from 'zod';

export const ExperienceSchema = z.object({
  role: z.string().default(''),
  company: z.string().default(''),
  from: z.string().default(''),
  to: z.string().default(''),
  bullets: z.array(z.string()).default([]),
});
export type Experience = z.infer<typeof ExperienceSchema>;

export const EducationSchema = z.object({
  school: z.string().default(''),
  degree: z.string().default(''),
  years: z.string().default(''),
});
export type Education = z.infer<typeof EducationSchema>;

export const ProjectSchema = z.object({
  name: z.string().default(''),
  desc: z.string().default(''),
});
export type Project = z.infer<typeof ProjectSchema>;

// resume_json column: structured nested fields parsed from the resume.
// Top-level basics (name/email/phone/location/headline) live as own profile columns.
export const ResumeJsonSchema = z.object({
  experience: z.array(ExperienceSchema).default([]),
  education: z.array(EducationSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  certifications: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});
export type ResumeJson = z.infer<typeof ResumeJsonSchema>;
