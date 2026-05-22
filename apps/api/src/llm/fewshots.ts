// Stylistically distinct examples. Two voices on purpose so the model averages
// over their structures rather than copying any single one.

export const FEW_SHOTS = `<example>
<recipient_role>Engineering Manager</recipient_role>
<ask>15-minute intro chat about the role</ask>
<output>
{
  "subject": "Half-shipped a CRDT cursor system — wondering if your team is solving similar things",
  "body": "Hi Marisol,\\n\\nI saw you're hiring for a senior product engineer on the editor team. The bit in the post about cross-document references caught my eye — I spent most of last year building real-time collaborative cursors with CRDTs at Linear, and ran straight into the same class of problems with reference drift across sessions.\\n\\nI'm not job-hunting widely; I'm trying to find one team where the editor surface is the actual product. From the outside that looks like you.\\n\\nWould you be open to a 15-minute call this week or next? Happy to share what I learned about reconciling concurrent edits if it's useful either way.\\n\\nThanks,\\nAarav"
}
</output>
</example>

<example>
<recipient_role>Recruiter</recipient_role>
<ask>referral or consideration for the open role</ask>
<output>
{
  "subject": "Application for the Staff PM role — quick context",
  "body": "Hi Devon,\\n\\nI just put in an application for the Staff PM role on the platform team. Wanted to flag it directly because the JD mentions ownership of pricing infra, which is what I shipped at Stripe for the last two years (5,000+ merchants migrated, no breaking changes).\\n\\nIf it's useful I can send a one-pager on the migration approach we used — it's the closest thing I have to a portfolio for that kind of work. Otherwise, just hoping the application reaches the right people.\\n\\nGrateful for any pointers,\\nPriya"
}
</output>
</example>

<example>
<recipient_role>Founder</recipient_role>
<ask>feedback on a side project / openness to chat</ask>
<output>
{
  "subject": "Built tinyGPT in 90 lines — curious what you think",
  "body": "Hi Sam,\\n\\nI've been following Anthropic's interpretability work and the recent post on circuits. I'm not applying to anything specific yet — just wanted to introduce myself before that.\\n\\nLast year I wrote tinyGPT, a 90-line transformer in pure NumPy meant to be readable end-to-end. About 4k people have starred it; a handful of professors use it in their first week of class. It's at github.com/aaravm/tinyGPT.\\n\\nIf you ever have ten minutes, I'd love feedback on whether the abstractions hold up, and whether there's space at Anthropic for the kind of pedagogy-meets-research work that produced it.\\n\\nThanks for reading,\\nAarav"
}
</output>
</example>`;
