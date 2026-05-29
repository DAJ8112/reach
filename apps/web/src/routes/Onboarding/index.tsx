import { useState } from 'react';
import type { Profile, ProfileUpdate } from '@reach/shared';
import { Mark } from '../../components/Wordmark.js';
import { Btn } from './primitives.js';
import { StepUpload, type ParsedResume } from './StepUpload.js';
import { StepReview } from './StepReview.js';
import { StepAchievements } from './StepAchievements.js';
import { StepLinks } from './StepLinks.js';
import { StepWelcome } from './StepWelcome.js';
import './onboarding.css';

const STEP_LABELS = ['Resume', 'Review', 'Achievements', 'Links', 'Done'] as const;

type Working = Pick<
  Profile,
  | 'name'
  | 'headline'
  | 'email'
  | 'phone'
  | 'location'
  | 'resumeText'
  | 'resumeJson'
  | 'skills'
  | 'achievements'
  | 'links'
>;

function profileToWorking(p: Profile): Working {
  return {
    name: p.name,
    headline: p.headline,
    email: p.email,
    phone: p.phone,
    location: p.location,
    resumeText: p.resumeText,
    resumeJson: p.resumeJson,
    skills: p.skills,
    achievements:
      p.achievements.length > 0
        ? p.achievements
        : [
            { title: '', detail: '' },
            { title: '', detail: '' },
            { title: '', detail: '' },
          ],
    links: p.links,
  };
}

export function Onboarding({
  profile,
  onSave,
  onFinish,
}: {
  profile: Profile;
  onSave: (patch: ProfileUpdate) => Promise<void>;
  onFinish: () => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Working>(() => profileToWorking(profile));
  const [saving, setSaving] = useState(false);
  const [resumeReady, setResumeReady] = useState(!!profile.resumeJson);

  const back = () => setStep(Math.max(0, step - 1));

  async function persistAndAdvance(nextStep: number) {
    setSaving(true);
    try {
      await onSave(data);
      setStep(nextStep);
    } finally {
      setSaving(false);
    }
  }

  const handleContinue = async () => {
    if (step === 3) {
      // last editable step → finalize then welcome
      setSaving(true);
      try {
        await onSave(data);
        await onFinish();
        setStep(4);
      } finally {
        setSaving(false);
      }
      return;
    }
    await persistAndAdvance(step + 1);
  };

  const handleSkip = () => setStep(Math.min(4, step + 1));

  const handleParsed = (parsed: ParsedResume) => {
    setData((d) => ({
      ...d,
      ...parsed.basics,
      resumeJson: parsed.resumeJson,
      skills: parsed.skills,
    }));
    setResumeReady(true);
  };

  return (
    <div className="ob-app font-sans">
      <header className="ob-topbar">
        <div className="ob-wordmark">
          <Mark size={18} />
          <span className="ob-wordmark-text">reach</span>
        </div>

        {step > 0 && step < 4 ? (
          <div
            className="ob-progress"
            role="progressbar"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={5}
          >
            {STEP_LABELS.slice(0, 4).map((label, i) => (
              <div
                key={label}
                className={`ob-progress-seg ${i < step ? 'done' : ''} ${i === step ? 'current' : ''}`}
              >
                <span className="ob-progress-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="ob-progress-label">{label}</span>
              </div>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="ob-topbar-right">
          {step > 0 && step < 4 && <span className="ob-step-count">Step {step + 1} of 4</span>}
        </div>
      </header>

      <main className="ob-main">
        <div className="ob-stage" key={step}>
          {step === 0 && <StepUpload onParsed={handleParsed} />}
          {step === 1 && (
            <StepReview
              data={data}
              onChange={(patch) => setData((d) => ({ ...d, ...patch }))}
            />
          )}
          {step === 2 && (
            <StepAchievements
              achievements={data.achievements}
              onChange={(a) => setData({ ...data, achievements: a })}
            />
          )}
          {step === 3 && (
            <StepLinks links={data.links} onChange={(l) => setData({ ...data, links: l })} />
          )}
          {step === 4 && <StepWelcome name={data.name} onStart={() => void onFinish()} />}
        </div>
      </main>

      {step === 0 && resumeReady && (
        <footer className="ob-footer">
          <span />
          <Btn onClick={handleContinue} disabled={saving}>
            {saving ? 'Saving…' : 'Continue →'}
          </Btn>
        </footer>
      )}

      {step > 0 && step < 4 && (
        <footer className="ob-footer">
          <Btn tone="ghost" onClick={back} disabled={saving}>
            ← Back
          </Btn>
          <div className="ob-footer-right">
            <Btn tone="text" onClick={handleSkip} disabled={saving}>
              Skip
            </Btn>
            <Btn onClick={handleContinue} disabled={saving}>
              {saving ? 'Saving…' : step === 3 ? 'Finish →' : 'Continue →'}
            </Btn>
          </div>
        </footer>
      )}
    </div>
  );
}
