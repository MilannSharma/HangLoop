import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { api, UserProfile } from '../services/api';
import { PolicyAcceptanceModal } from './PolicyAcceptanceModal';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [step, setStep] = useState<'DETAILS' | 'OTP'>('DETAILS');

  // Input States
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [otp, setOtp] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Policy Modal
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [pendingRegistrationUser, setPendingRegistrationUser] = useState<UserProfile | null>(null);

  // 1. Existing User Login
  const handleLogin = async () => {
    if (!email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    const res = await api.loginUser(email);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Account not found. Please click Register Today to create an account.');
    }
  };

  // 2. Step 1: Request Real Gmail OTP for Registration
  const handleRequestRegistrationOtp = async () => {
    if (!fullName.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!username.trim() || username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    if (!email.includes('@')) {
      setErrorMsg('Valid email address is required.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    const res = await api.requestOtp(email);
    setLoading(false);

    if (res.success) {
      setStep('OTP');
      Alert.alert('Verification Code Sent', `A 6-digit OTP code was sent to ${email}. Please check your inbox.`);
    } else {
      setErrorMsg(res.error || 'Failed to send verification email.');
    }
  };

  // 3. Step 2: Verify OTP Code
  const handleVerifyOtpAndProceed = async () => {
    if (otp.length < 6) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    const res = await api.verifyOtp(email, otp);
    setLoading(false);

    if (res.success) {
      // OTP Verified -> Open Legal Policy Acceptance Modal
      setShowPolicyModal(true);
    } else {
      setErrorMsg(res.error || 'Invalid or expired verification code.');
    }
  };

  // 4. Step 3: Accept Legal Policies & Create Account
  const handleAcceptPoliciesAndCreateAccount = async () => {
    setShowPolicyModal(false);
    setLoading(true);
    const res = await api.registerUser(fullName, username, email);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Registration failed.');
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Prominent Hangloop Logo Branding */}
      <View style={styles.brandContainer}>
        <Image 
          source={require('../../assets/logo-white.png')} 
          style={[styles.brandLogoImage, !isDark && { tintColor: colors.text }]} 
        />
        <Text style={[styles.brandTitle, { color: colors.text }]}>HANGLOOP</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Synced Music & Live Room Social Hangouts
        </Text>
      </View>

      {/* Main Form Card */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        {mode === 'LOGIN' ? (
          <>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome Back</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Enter your registered email to log into your account.
            </Text>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: colors.buttonPrimaryBg }]} 
              onPress={handleLogin} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.buttonPrimaryText} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.buttonPrimaryText }]}>Sign In →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchModeBtn}
              onPress={() => {
                setMode('REGISTER');
                setStep('DETAILS');
                setErrorMsg('');
              }}
            >
              <Text style={[styles.switchModeText, { color: colors.primary }]}>
                New here? <Text style={{ fontWeight: '800', textDecorationLine: 'underline' }}>Register Today</Text>
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {step === 'DETAILS' ? (
              <>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Create Your Account</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Register today to join live music rooms and chat in real time.
                </Text>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. Ashish Sharma"
                  placeholderTextColor={colors.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />

                <Text style={[styles.label, { color: colors.textSecondary }]}>Unique Username Handle</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. ashish_music"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />

                <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                  placeholder="hangloop.support@gmail.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <TouchableOpacity 
                  style={[styles.primaryBtn, { backgroundColor: colors.buttonPrimaryBg }]} 
                  onPress={handleRequestRegistrationOtp} 
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.buttonPrimaryText} />
                  ) : (
                    <Text style={[styles.primaryBtnText, { color: colors.buttonPrimaryText }]}>Send Email Verification OTP →</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.switchModeBtn}
                  onPress={() => {
                    setMode('LOGIN');
                    setErrorMsg('');
                  }}
                >
                  <Text style={[styles.switchModeText, { color: colors.textSecondary }]}>
                    Already have an account? <Text style={{ color: colors.primary, fontWeight: '800' }}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Enter Gmail OTP Code</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Verification code sent to <Text style={{ color: colors.primary }}>{email}</Text>
                </Text>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

                <Text style={[styles.label, { color: colors.textSecondary }]}>6-Digit OTP Code</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border, letterSpacing: 6, fontSize: 18, textAlign: 'center' }]}
                  placeholder="123456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />

                <TouchableOpacity 
                  style={[styles.primaryBtn, { backgroundColor: colors.buttonPrimaryBg }]} 
                  onPress={handleVerifyOtpAndProceed} 
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.buttonPrimaryText} />
                  ) : (
                    <Text style={[styles.primaryBtnText, { color: colors.buttonPrimaryText }]}>Verify OTP Code →</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backBtn} onPress={() => setStep('DETAILS')}>
                  <Text style={[styles.backBtnText, { color: colors.textMuted }]}>← Back to Details</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>

      {/* Policy Acceptance Modal */}
      <PolicyAcceptanceModal
        visible={showPolicyModal}
        onAccept={handleAcceptPoliciesAndCreateAccount}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandLogoImage: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginBottom: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    marginBottom: 16,
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
  switchModeBtn: {
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 6,
  },
  switchModeText: {
    fontSize: 13.5,
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  backBtnText: {
    fontSize: 13,
  },
});
