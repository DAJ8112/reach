import { useSession } from './lib/auth.js';
import { useProfile } from './lib/profile.js';
import { useHashRoute, navigate } from './lib/route.js';
import { AuthGate } from './routes/AuthGate.js';
import { Onboarding } from './routes/Onboarding/index.js';
import { Generator } from './routes/Generator/index.js';
import { Settings } from './routes/Settings/index.js';
import { api } from './lib/api.js';

function LoadingScreen({ msg = 'Loading…' }: { msg?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg text-text-faint font-sans text-sm">
      {msg}
    </div>
  );
}

export function App() {
  const { session, loading: sessionLoading } = useSession();
  const { profile, loading: profileLoading, save, reload } = useProfile();
  const route = useHashRoute();

  if (sessionLoading) return <LoadingScreen />;
  if (!session) return <AuthGate />;
  if (profileLoading || !profile) return <LoadingScreen />;

  if (!profile.onboardedAt) {
    return (
      <Onboarding
        profile={profile}
        onSave={async (patch) => {
          await save(patch);
        }}
        onFinish={async () => {
          await save({ onboardedAt: new Date().toISOString() });
          await reload();
        }}
      />
    );
  }

  if (route === 'settings') {
    return (
      <Settings
        profile={profile}
        sessionEmail={session.user?.email ?? ''}
        save={save}
        reload={reload}
        onBack={() => navigate('/')}
        onRestartOnboarding={async () => {
          await api('/api/profile', { method: 'PATCH', body: { onboardedAt: null } });
          await reload();
          navigate('/');
        }}
      />
    );
  }

  return (
    <Generator
      profile={profile}
      onReset={async () => {
        await api('/api/profile', { method: 'PATCH', body: { onboardedAt: null } });
        await reload();
      }}
    />
  );
}
