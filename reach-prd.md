# Cold Email Generator — PRD v0.1

**Status:** Draft
**Version:** 0.1
**Last updated:** 2026-05-04

## 1. Overview

A web app that generates personalized cold email drafts for job seekers. The user pastes a job posting URL, provides a few details about the recipient and their ask, and receives a high-quality, editable email draft. Personalization comes from two layers of context: a stable user profile captured during onboarding, and per-request inputs supplied at generation time.

Generic AI-generated emails fail because they have no specific hook tying the sender to the recipient or the role. By collecting structured context on both sides and assembling it deliberately into the prompt, we can produce emails that actually feel written by a human for a specific situation.

## 2. Goals

The goal of v0.1 is to validate that a context-rich prompt pipeline produces email drafts that users find good enough to send (with light editing) for real job applications. 

## 3. Target User

A job seeker who is actively reaching out to people at companies they want to work at — recruiters, hiring managers, engineering leads, founders. They are willing to invest a few minutes in onboarding because they understand it improves output quality. They are comfortable pasting a resume and editing a draft before sending. They are not looking for an autopilot tool; they are looking for a high-quality first draft.

## 4. User Flow

The product has two distinct phases that operate at different cadences.

**Onboarding** happens once when a user first signs up. They paste or upload their resume, review the parsed structured version and correct any errors, optionally add a curated skills list and 3-5 highlighted achievements, and optionally provide links (LinkedIn, GitHub, portfolio). Onboarding produces a stored Profile that persists across all future generation requests.

**Generation** happens every time the user wants a new email. They paste a job URL, enter the recipient's role (and optionally additional context about the recipient or company), and write an ask that describes what outcome they want from the email. The system fetches and parses the job description, assembles a prompt combining the stored Profile with these per-request inputs, calls the LLM, and returns one or more draft emails. The user can edit any draft inline before copying it out.

## 5. Functional Requirements

### 5.1 Onboarding

The onboarding flow captures four things. The resume is the spine — it is parsed into a structured representation (education entries, work history with dates and bullets, etc.) but the raw text is also retained because resume parsers routinely lose nuance like one-line side projects or volunteer entries that occasionally turn out to be the right hook for a specific email. After parsing, the user is shown the structured version and given a chance to correct mistakes before the profile is finalized.

The skills list is a curated set of skills the user wants emphasized. This is technically redundant with the resume but serves as a signal of which skills the user considers most important — useful when the model is choosing what to lead with.

Top achievements is a list of 3-5 short bullets, ideally with quantitative impact. This is the user's curated highlight reel — the things they want to lead with regardless of which job they are applying for. The model will still pick the most relevant for any given job, but it picks from this filtered set rather than the full resume.

Links are optional and include LinkedIn, GitHub, and any portfolio or personal site. They are stored so the model can include them when the user's ask involves "here's my work."

All onboarding fields must be editable from a settings page after the initial flow completes.

### 5.2 Per-Request Inputs

At generation time, the user provides three things. The job URL. The recipient details which consist of a mandatory role field and an optional free-text context field for anything the user knows about the person or company that should be referenced. The user's ask is a one-line description of the desired outcome — typical examples are "15-minute intro chat," "referral to the hiring manager," or "consideration for the role."

### 5.3 Prompt Assembly

The prompt sent to the LLM has two layers: a system message that is identical across all users and requests, and a user message that is rebuilt from scratch for every generation.

The system message defines the model's role in one sentence ("You write cold emails for job seekers reaching out about a specific role"), provides style guidance targeting approximately 120 words per email with a natural and direct register, includes a structural convention requiring a subject line, lists explicit anti-patterns the model must avoid, and includes 2-3 few-shot example emails.

The anti-patterns list is critical and should explicitly forbid: opening with "I hope this email finds you well" or any equivalent, excessive flattery of the company or recipient, leading with the user's credentials before establishing relevance, listing every qualification the user has, and any phrasing that pattern-matches to common AI-generated cold emails. These are forbidden even if they would otherwise feel natural to the model — they are the markers recipients use to filter and dismiss cold outreach.

The few-shot examples are chosen to be stylistically distinct from each other so the model averages over their structures rather than copying any single voice. Two or three examples is the target — more examples improve structural compliance but increase voice leak across users.

The user message is assembled in this order: the structured user profile (resume, skills, achievements, links — formatted as labelled fields rather than narrative prose so the model can selectively pull from it), the cleaned JD content under a clear header, the recipient details, and the user's ask as a one-liner. The message ends with a final instruction telling the model what to produce: pick the 1-2 most relevant items from the user's profile to reference, write a cold email for this specific role, and output as structured JSON with subject and body fields.

The output format is JSON `{subject, body}` rather than free text. This avoids fragile regex parsing of "Subject:" headers and aligns with the editing UI which already needs structured fields. Use the LLM provider's native structured-output mode where available.

### 5.5 Editing and Output

The draft is rendered in an editable surface with separate fields for subject and body. The user can edit any text inline. There is a copy button per draft that copies the formatted email to the clipboard. There is no send functionality as of now.