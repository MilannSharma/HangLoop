import React, { useState } from 'react'
import { API_BASE } from '../config'
import { User } from '../types'
import { LogIn, UserPlus, Mail, KeyRound, ArrowRight, CheckCircle2, ShieldCheck, FileText } from 'lucide-react'

interface Props {
  open: boolean
  tab: 'login' | 'register'
  onClose: () => void
  onTabChange: (tab: 'login' | 'register') => void
  onLogin: (user: User, token: string) => void
}

export default function AuthModal({ open, tab, onClose, onTabChange, onLogin }: Props) {
  // Login State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Registration States (Exact match to Mobile App)
  const [regStep, setRegStep] = useState<'DETAILS' | 'OTP' | 'POLICIES'>('DETAILS')
  const [regFullName, setRegFullName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regOtp, setRegOtp] = useState('')
  const [policyAccepted, setPolicyAccepted] = useState(true)
  const [regLoading, setRegLoading] = useState(false)

  const [alertInfo, setAlertInfo] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  // 1. Existing User Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail.trim() || !loginEmail.includes('@')) {
      setAlertInfo({ msg: 'Please enter a valid email address.', type: 'error' })
      return
    }
    setLoginLoading(true)
    setAlertInfo(null)

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success && data.user && data.token) {
        onLogin(data.user, data.token)
      } else {
        setAlertInfo({ msg: data.error || 'Account not found. Please click Register Today to create an account.', type: 'error' })
      }
    } catch {
      setAlertInfo({ msg: 'Network error. Could not connect to the server.', type: 'error' })
    } finally {
      setLoginLoading(false)
    }
  }

  // 2. Step 1: Request Email Verification OTP for Registration
  const handleRequestRegistrationOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regFullName.trim()) {
      setAlertInfo({ msg: 'Full Name is required.', type: 'error' })
      return
    }
    if (!regUsername.trim() || regUsername.length < 3) {
      setAlertInfo({ msg: 'Username must be at least 3 characters.', type: 'error' })
      return
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setAlertInfo({ msg: 'Valid email address is required.', type: 'error' })
      return
    }

    setRegLoading(true)
    setAlertInfo(null)

    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAlertInfo({ msg: `A 6-digit verification code was sent to ${regEmail}. Please check your inbox.`, type: 'success' })
        setRegStep('OTP')
      } else {
        setAlertInfo({ msg: data.error || 'Failed to send verification email.', type: 'error' })
      }
    } catch {
      setAlertInfo({ msg: 'Network error sending verification OTP.', type: 'error' })
    } finally {
      setRegLoading(false)
    }
  }

  // 3. Step 2: Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regOtp.trim() || regOtp.trim().length < 6) {
      setAlertInfo({ msg: 'Please enter the 6-digit verification code.', type: 'error' })
      return
    }

    setRegLoading(true)
    setAlertInfo(null)

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim(), otp: regOtp.trim() })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setAlertInfo({ msg: 'Email verified successfully! Please review and accept policies to complete registration.', type: 'success' })
        setRegStep('POLICIES')
      } else {
        setAlertInfo({ msg: data.error || 'Invalid or expired verification code.', type: 'error' })
      }
    } catch {
      setAlertInfo({ msg: 'Network error verifying OTP code.', type: 'error' })
    } finally {
      setRegLoading(false)
    }
  }

  // 4. Step 3: Accept Legal Policies & Create Account
  const handleCompleteRegistration = async () => {
    if (!policyAccepted) {
      setAlertInfo({ msg: 'You must accept the terms & policies to proceed.', type: 'error' })
      return
    }

    setRegLoading(true)
    setAlertInfo(null)

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim()
        })
      })
      const data = await res.json()
      if (res.ok && data.success && data.user && data.token) {
        onLogin(data.user, data.token)
      } else {
        setAlertInfo({ msg: data.error || 'Registration failed.', type: 'error' })
      }
    } catch {
      setAlertInfo({ msg: 'Network error during registration.', type: 'error' })
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className={`modal-backdrop${open ? ' active' : ''}`} id="auth-modal" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3>{tab === 'login' ? 'Welcome Back' : 'Create Your Account'}</h3>
            <p>
              {tab === 'login'
                ? 'Enter your registered email to log into your account.'
                : 'Register today to join live music rooms and chat in real time.'}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Mode Switcher Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn${tab === 'login' ? ' active' : ''}`}
              onClick={() => {
                onTabChange('login');
                setAlertInfo(null);
              }}
            >
              Sign In (Existing)
            </button>
            <button
              className={`auth-tab-btn${tab === 'register' ? ' active' : ''}`}
              onClick={() => {
                onTabChange('register');
                setRegStep('DETAILS');
                setAlertInfo(null);
              }}
            >
              Register (New)
            </button>
          </div>

          {alertInfo && (
            <div className={`form-alert ${alertInfo.type}`} style={{ display: 'block' }}>
              {alertInfo.msg}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              1. LOGIN MODE
          ═══════════════════════════════════════════════════════ */}
          {tab === 'login' ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="btn btn-gold btn-full mt-2" disabled={loginLoading}>
                <LogIn className="w-4 h-4" />
                <span>{loginLoading ? 'Signing in...' : 'Sign In →'}</span>
              </button>

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <button
                  type="button"
                  onClick={() => {
                    onTabChange('register');
                    setRegStep('DETAILS');
                    setAlertInfo(null);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--prisma-cream)', fontSize: '0.84rem', cursor: 'pointer' }}
                >
                  New here? <strong style={{ textDecoration: 'underline' }}>Register Today</strong>
                </button>
              </div>
            </form>
          ) : (
            /* ═══════════════════════════════════════════════════════
               2. REGISTRATION MODE (Exact match to Mobile App)
            ═══════════════════════════════════════════════════════ */
            <div>
              {/* Step 1: DETAILS */}
              {regStep === 'DETAILS' && (
                <form onSubmit={handleRequestRegistrationOtp}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ashish Sharma"
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unique Username Handle</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ashish_music"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      required
                      autoCapitalize="none"
                      minLength={3}
                      maxLength={20}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="hangloop.support@gmail.com"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      required
                      autoCapitalize="none"
                    />
                  </div>

                  <button type="submit" className="btn btn-gold btn-full mt-2" disabled={regLoading}>
                    <Mail className="w-4 h-4" />
                    <span>{regLoading ? 'Sending Verification OTP...' : 'Send Email Verification OTP →'}</span>
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 18 }}>
                    <button
                      type="button"
                      onClick={() => {
                        onTabChange('login');
                        setAlertInfo(null);
                      }}
                      style={{ background: 'none', border: 'none', color: 'rgba(225,224,204,0.7)', fontSize: '0.84rem', cursor: 'pointer' }}
                    >
                      Already have an account? <strong style={{ color: 'var(--prisma-cream)' }}>Sign In</strong>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: OTP VERIFICATION */}
              {regStep === 'OTP' && (
                <form onSubmit={handleVerifyOtp}>
                  <p style={{ fontSize: '0.84rem', color: 'rgba(225,224,204,0.8)', marginBottom: 16 }}>
                    Verification code sent to <strong>{regEmail}</strong>
                  </p>

                  <div className="form-group">
                    <label className="form-label">6-Digit OTP Code</label>
                    <input
                      type="text"
                      className="form-input text-center font-mono"
                      style={{ letterSpacing: 8, fontSize: '1.2rem', fontWeight: 700 }}
                      placeholder="123456"
                      maxLength={6}
                      value={regOtp}
                      onChange={e => setRegOtp(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <button type="submit" className="btn btn-gold btn-full mt-2" disabled={regLoading}>
                    <KeyRound className="w-4 h-4" />
                    <span>{regLoading ? 'Verifying...' : 'Verify OTP Code →'}</span>
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => setRegStep('DETAILS')}
                      style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      &larr; Back to Details
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: POLICY ACCEPTANCE */}
              {regStep === 'POLICIES' && (
                <div>
                  <div style={{ background: 'rgba(225,224,204,0.06)', border: '1px solid var(--surface-border)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-5 h-5 text-[#10B981]" />
                      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--prisma-cream)' }}>
                        Community Guidelines &amp; Policies
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(225,224,204,0.75)', lineHeight: 1.5 }}>
                      By joining Hangloop, you agree to treat everyone with respect, adhere to fair copyright standards, and avoid hate speech or harassment.
                    </p>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--prisma-cream)', marginBottom: 20 }}>
                    <input
                      type="checkbox"
                      checked={policyAccepted}
                      onChange={e => setPolicyAccepted(e.target.checked)}
                      style={{ marginTop: 3, accentColor: 'var(--prisma-cream)' }}
                    />
                    <span>I have read and agree to the Hangloop Terms of Service and Privacy Policy.</span>
                  </label>

                  <button
                    type="button"
                    className="btn btn-gold btn-full"
                    onClick={handleCompleteRegistration}
                    disabled={regLoading || !policyAccepted}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{regLoading ? 'Creating Account...' : 'Accept Policies & Create Account →'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
