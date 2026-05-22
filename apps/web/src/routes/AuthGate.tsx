import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { Wordmark } from '../components/Wordmark.js';
import { toast } from '../lib/toast.js';

export function AuthGate() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success('Check your inbox');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg text-text font-sans px-6">
      <div className="mb-12 text-accent">
        <Wordmark size="lg" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-3 rounded-xl border border-border bg-bg-elev p-6"
      >
        <label className="text-sm text-text-dim">Email</label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          className="w-full rounded-md bg-transparent border border-[color:var(--field-border)] px-3 py-2.5 text-text placeholder:text-placeholder focus:outline-none focus:border-accent"
          disabled={sending || sent}
        />
        <button
          type="submit"
          disabled={sending || sent || !email.trim()}
          className="mt-1 rounded-md bg-accent text-[color:var(--bg)] font-medium py-2.5 disabled:opacity-50 transition-opacity"
        >
          {sending ? 'Sending…' : sent ? 'Check your inbox' : 'Send magic link'}
        </button>
        {sent && (
          <p className="text-sm text-text-dim mt-1">
            We emailed a sign-in link to <span className="text-text">{email}</span>. Open it in this browser.
          </p>
        )}
      </form>

      <p className="mt-6 text-xs text-text-faint">No password. We'll email you a one-time link.</p>
    </div>
  );
}
