import React, { useState } from 'react';
import { type FormEvent } from 'react';
import {
  LockKeyholeIcon,
  Loader2Icon,
  ShieldCheckIcon,
  TriangleAlertIcon } from
'lucide-react';
import { login } from '../lib/auth';
type AdminLoginProps = {
  onSuccess: () => void;
};
export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    // Small delay so the busy state is perceptible on a local check.
    window.setTimeout(() => {
      const ok = login(email, password);
      if (ok) {
        onSuccess();
      } else {
        setError('Invalid email or password. Please try again.');
        setPassword('');
      }
      setSubmitting(false);
    }, 250);
  }
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f8f9fa] px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-2 text-[#0b6623]">
          <ShieldCheckIcon className="h-7 w-7" aria-hidden="true" />
          <span className="text-lg font-semibold">Control Panel Access</span>
        </div>

        <div className="overflow-hidden rounded border border-slate-200 bg-white shadow-sm">
          <div className="bg-[#0b6623] px-5 py-3 font-bold text-white">
            Administrator Sign In
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
            <p className="text-sm leading-6 text-slate-600">
              Restricted area. Please authenticate with your administrator
              credentials to manage results and system status.
            </p>

            {error &&
            <div
              role="alert"
              className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              
                <TriangleAlertIcon
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true" />
              

                <span>{error}</span>
              </div>
            }

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError('');
                }}
                required
                placeholder="admin@example.com"
                className="form-control" />
              
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-bold">Password</span>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError('');
                }}
                required
                placeholder="••••••••"
                className="form-control" />
              
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#0b6623] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#084e1b] focus:outline-none focus:ring-2 focus:ring-[#0b6623] focus:ring-offset-2 disabled:opacity-70">
              
              {submitting ?
              <Loader2Icon
                className="h-4 w-4 animate-spin"
                aria-hidden="true" /> :


              <LockKeyholeIcon className="h-4 w-4" aria-hidden="true" />
              }
              {submitting ? 'Verifying…' : 'Sign In'}
            </button>
          </form>
        </div>
      </section>
    </main>);

}