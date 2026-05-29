import { useState } from 'react';
import type { Profile, ProfileUpdate, Achievement, Links } from '@reach/shared';
import { Mark } from '../../components/Wordmark.js';
import { supabase } from '../../lib/supabase.js';
import { toast, toastApiError } from '../../lib/toast.js';
import { StepUpload, type ParsedResume } from '../Onboarding/StepUpload.js';
import { StepReview } from '../Onboarding/StepReview.js';
import { StepAchievements } from '../Onboarding/StepAchievements.js';
import { StepLinks } from '../Onboarding/StepLinks.js';
import '../Onboarding/onboarding.css';
import './settings.css';

type Tab = 'profile' | 'achievements' | 'links' | 'account';

const TABS: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'links', label: 'Links' },
  { key: 'account', label: 'Account' },
];

type ProfileDraft = Pick<
  Profile,
  'name' | 'headline' | 'email' | 'phone' | 'location' | 'skills' | 'resumeJson' | 'resumeText'
>;

function profileDraft(p: Profile): ProfileDraft {
  return {
    name: p.name,
    headline: p.headline,
    email: p.email,
    phone: p.phone,
    location: p.location,
    skills: p.skills,
    resumeJson: p.resumeJson,
    resumeText: p.resumeText,
  };
}

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function Settings({
  profile,
  sessionEmail,
  save,
  reload,
  onBack,
  onRestartOnboarding,
}: {
  profile: Profile;
  sessionEmail: string;
  save: (patch: ProfileUpdate) => Promise<Profile>;
  reload: () => Promise<void>;
  onBack: () => void;
  onRestartOnboarding: () => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <div className="set-app font-sans">
      <header className="set-topbar">
        <button className="set-back" onClick={onBack}>
          ← Back
        </button>
        <div className="set-wordmark">
          <Mark size={18} />
          <span className="set-wordmark-text">reach</span>
        </div>
        <span className="set-topbar-right">Settings</span>
      </header>

      <div className="set-shell">
        <nav className="set-sidebar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`set-tab ${tab === t.key ? 'is-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <main className="set-content">
          {tab === 'profile' && (
            <ProfileTab profile={profile} save={save} reload={reload} />
          )}
          {tab === 'achievements' && (
            <AchievementsTab profile={profile} save={save} reload={reload} />
          )}
          {tab === 'links' && <LinksTab profile={profile} save={save} reload={reload} />}
          {tab === 'account' && (
            <AccountTab
              profile={profile}
              sessionEmail={sessionEmail}
              onRestartOnboarding={onRestartOnboarding}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function SaveFooter({
  dirty,
  saving,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="set-savebar">
      <span className="set-savebar-status">{dirty ? 'Unsaved changes' : ''}</span>
      <div className="set-savebar-actions">
        <button className="set-btn-ghost" onClick={onDiscard} disabled={!dirty || saving}>
          Discard
        </button>
        <button className="set-btn" onClick={onSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

async function runSave(
  fn: () => Promise<unknown>,
  setSaving: (v: boolean) => void,
): Promise<boolean> {
  setSaving(true);
  const promise = fn();
  toast.promise(promise, { loading: 'Saving…', success: 'Saved', error: 'Save failed' });
  try {
    await promise;
    return true;
  } catch {
    return false;
  } finally {
    setSaving(false);
  }
}

function ProfileTab({
  profile,
  save,
  reload,
}: {
  profile: Profile;
  save: (patch: ProfileUpdate) => Promise<Profile>;
  reload: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<ProfileDraft>(() => profileDraft(profile));
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const baseline = profileDraft(profile);
  const dirty = !eq(draft, baseline);

  const onParsed = (p: ParsedResume) => {
    setDraft((d) => ({
      ...d,
      ...p.basics,
      resumeJson: p.resumeJson,
      skills: p.skills,
    }));
    setShowUpload(false);
    toast.success('Resume parsed — review and Save');
  };

  async function onSave() {
    await runSave(async () => {
      await save(draft);
      await reload();
    }, setSaving);
  }

  return (
    <div className="set-tab-content">
      <div className="set-tab-head">
        <h2>Profile</h2>
        <button className="set-btn-ghost" onClick={() => setShowUpload((v) => !v)}>
          {showUpload ? 'Cancel re-upload' : 'Re-upload resume'}
        </button>
      </div>

      {showUpload && (
        <div className="set-upload-wrap">
          <StepUpload onParsed={onParsed} />
        </div>
      )}

      <StepReview
        data={draft}
        onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
      />

      <SaveFooter
        dirty={dirty}
        saving={saving}
        onSave={onSave}
        onDiscard={() => setDraft(profileDraft(profile))}
      />
    </div>
  );
}

function AchievementsTab({
  profile,
  save,
  reload,
}: {
  profile: Profile;
  save: (patch: ProfileUpdate) => Promise<Profile>;
  reload: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Achievement[]>(profile.achievements);
  const [saving, setSaving] = useState(false);
  const dirty = !eq(draft, profile.achievements);

  async function onSave() {
    await runSave(async () => {
      await save({ achievements: draft });
      await reload();
    }, setSaving);
  }

  return (
    <div className="set-tab-content">
      <div className="set-tab-head">
        <h2>Achievements</h2>
      </div>
      <StepAchievements achievements={draft} onChange={setDraft} />
      <SaveFooter
        dirty={dirty}
        saving={saving}
        onSave={onSave}
        onDiscard={() => setDraft(profile.achievements)}
      />
    </div>
  );
}

function LinksTab({
  profile,
  save,
  reload,
}: {
  profile: Profile;
  save: (patch: ProfileUpdate) => Promise<Profile>;
  reload: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Links>(profile.links);
  const [saving, setSaving] = useState(false);
  const dirty = !eq(draft, profile.links);

  async function onSave() {
    await runSave(async () => {
      await save({ links: draft });
      await reload();
    }, setSaving);
  }

  return (
    <div className="set-tab-content">
      <div className="set-tab-head">
        <h2>Links</h2>
      </div>
      <StepLinks links={draft} onChange={setDraft} />
      <SaveFooter
        dirty={dirty}
        saving={saving}
        onSave={onSave}
        onDiscard={() => setDraft(profile.links)}
      />
    </div>
  );
}

function AccountTab({
  profile,
  sessionEmail,
  onRestartOnboarding,
}: {
  profile: Profile;
  sessionEmail: string;
  onRestartOnboarding: () => Promise<void>;
}) {
  const [confirmingRestart, setConfirmingRestart] = useState(false);

  return (
    <div className="set-tab-content">
      <div className="set-tab-head">
        <h2>Account</h2>
      </div>

      <dl className="set-meta">
        <div>
          <dt>Email</dt>
          <dd>{sessionEmail}</dd>
        </div>
        <div>
          <dt>Onboarded</dt>
          <dd>{profile.onboardedAt ? new Date(profile.onboardedAt).toLocaleString() : '—'}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{new Date(profile.updatedAt).toLocaleString()}</dd>
        </div>
      </dl>

      <div className="set-danger">
        <div className="set-danger-row">
          <div>
            <div className="set-danger-title">Restart onboarding</div>
            <div className="set-danger-sub">
              Clears the onboarded flag and walks you through the wizard again. Profile data stays.
            </div>
          </div>
          {confirmingRestart ? (
            <div className="set-danger-actions">
              <button className="set-btn-ghost" onClick={() => setConfirmingRestart(false)}>
                Cancel
              </button>
              <button className="set-btn-danger" onClick={() => void onRestartOnboarding()}>
                Confirm
              </button>
            </div>
          ) : (
            <button className="set-btn-ghost" onClick={() => setConfirmingRestart(true)}>
              Restart
            </button>
          )}
        </div>

        <div className="set-danger-row">
          <div>
            <div className="set-danger-title">Sign out</div>
            <div className="set-danger-sub">End this session.</div>
          </div>
          <button
            className="set-btn-ghost"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success('Signed out');
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
