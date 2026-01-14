'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // First verify current password by re-authenticating
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user?.email) {
        setError('Unable to verify user')
        setLoading(false)
        return
      }

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        setError('Current password is incorrect')
        setLoading(false)
        return
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        setError(updateError.message)
      } else {
        setMessage('Password updated successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Settings</h1>

      <div className="max-w-xl space-y-8">
        {/* Change Password */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label>Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label>New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div>
              <label>Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-md">
                <p className="text-sm text-[var(--error)]">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-md">
                <p className="text-sm text-[var(--success)]">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Sign Out */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sign Out</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Sign out of your admin account on this device.
          </p>
          <button
            onClick={handleSignOut}
            className="btn-secondary"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
