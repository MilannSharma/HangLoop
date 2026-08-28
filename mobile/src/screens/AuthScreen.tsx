import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useTheme } from '../theme/ThemeContext';
import { api, UserProfile } from '../services/api';
import { PolicyAcceptanceModal } from './PolicyAcceptanceModal';

const GOOGLE_WEB_CLIENT_ID = '206898168634-oop0ksi0rh7a6i5vuj4kn1er92pnsikq.apps.googleusercontent.com';

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Initialize Google Sign-In safely on mount
  useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
      });
    } catch (err) {
      console.warn('GoogleSignin configure error:', err);
    }
  }, []);

  // Screen Mode: 'LOGIN' (Continue with Google) or 'COMPLETE_PROFILE' (New Google User Onboarding)
  const [viewState, setViewState] = useState<'LOGIN' | 'COMPLETE_PROFILE'>('LOGIN');

  // Form States for Profile Completion
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [pendingIdToken, setPendingIdToken] = useState('');

  // Live Username Validation States
  const [usernameStatus, setUsernameStatus] = useState<'IDLE' | 'CHECKING' | 'AVAILABLE' | 'UNAVAILABLE'>('IDLE');
  const [usernameError, setUsernameError] = useState('');
  const usernameCheckTimeoutRef = useRef<any>(null);

  // Policy Acceptance Modal State
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  // Loading & Error States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const processGoogleIdToken = async (idToken: string) => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.loginWithGoogle(idToken);
      setLoading(false);

      if (res.success) {
        if (!res.isNewUser && res.user) {
          // Existing User -> Login immediately
          onLoginSuccess(res.user);
        } else if (res.isNewUser) {
          // New User -> Open Complete Profile View
          setPendingIdToken(idToken);
          setVerifiedEmail(res.email || '');
          setFullName(res.suggestedName || '');
          setUsername('');
          setUsernameStatus('IDLE');
          setViewState('COMPLETE_PROFILE');
        }
      } else {
        setErrorMsg(res.error || 'Google authentication failed. Please try again.');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg('Network error during authentication. Please check your connection.');
    }
  };

  const handleContinueWithGoogle = async () => {
    setErrorMsg('');
    setLoading(true);

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      const idToken = (response as any).data?.idToken || (response as any).idToken;

      if (idToken) {
        setPendingIdToken(idToken);
        await processGoogleIdToken(idToken);
      } else {
        setLoading(false);
        setErrorMsg('Could not retrieve Google ID Token. Please verify Google Play Services.');
      }
    } catch (err: any) {
      setLoading(false);
      if (isErrorWithCode(err)) {
        switch (err.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled cleanly
            return;
          case statusCodes.IN_PROGRESS:
            setErrorMsg('Sign-in is already in progress.');
            return;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setErrorMsg('Google Play Services is not available or outdated on this device.');
            return;
          default:
            setErrorMsg(err.message || 'Google sign-in error occurred.');
            return;
        }
      } else {
        setErrorMsg(err?.message || 'Google sign-in failed. Please try again.');
      }
    }
  };

  // Live Debounced Username Availability Check
  const handleUsernameChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
    setUsername(cleaned);
    setErrorMsg('');

    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    if (!cleaned) {
      setUsernameStatus('IDLE');
      setUsernameError('');
      return;
    }

    if (cleaned.length < 3) {
      setUsernameStatus('UNAVAILABLE');
      setUsernameError('Must be at least 3 characters');
      return;
    }

    setUsernameStatus('CHECKING');
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      const res = await api.checkUsernameAvailability(cleaned);
      if (res.available) {
        setUsernameStatus('AVAILABLE');
        setUsernameError('');
      } else {
        setUsernameStatus('UNAVAILABLE');
        setUsernameError(res.reason || 'Username already taken');
      }
    }, 400);
  };

  // Click "Continue" -> Open Legal Policy Acceptance Modal for new users
  const handleProfileContinueClick = () => {
    if (!fullName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    if (!username.trim() || username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    if (usernameStatus === 'UNAVAILABLE') {
      setErrorMsg(usernameError || 'Please choose an available username.');
      return;
    }

    setErrorMsg('');
    setShowPolicyModal(true);
  };

  // User accepts terms & policies -> Finalize registration in D1
  const handleAcceptPoliciesAndCreateAccount = async () => {
    setShowPolicyModal(false);
    setErrorMsg('');
    setLoading(true);

    const res = await api.completeGoogleProfile(pendingIdToken, fullName.trim(), username.trim());
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMsg(res.error || 'Failed to create profile. Please try again.');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
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

      {/* Main Container Card */}
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        {viewState === 'LOGIN' ? (
          <>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Welcome to Hangloop</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Join synchronized live music rooms, chat in real time, and discover trending tracks with friends.
            </Text>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Single Primary "Continue with Google" Button */}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                {
                  backgroundColor: isDark ? '#FFFFFF' : '#FFFFFF',
                  borderColor: isDark ? 'transparent' : '#E2E8F0',
                },
              ]}
              onPress={handleContinueWithGoogle}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <View style={styles.googleBtnInner}>
                  <AntDesign name="google" size={20} color="#EA4335" style={styles.googleIcon} />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
              By continuing, you agree to Hangloop's Terms of Service and Privacy Policy.
            </Text>
          </>
        ) : (
          /* COMPLETE PROFILE ONBOARDING VIEW */
          <>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Complete your profile</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Let's get your Hangloop profile ready.
            </Text>

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Verified Email (Read-Only) */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
            <View style={[styles.verifiedEmailBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View style={styles.emailTextRow}>
                <Text style={[styles.verifiedEmailText, { color: colors.text }]}>{verifiedEmail}</Text>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.verifiedBadgeText}>Verified with Google</Text>
                </View>
              </View>
            </View>

            {/* Full Name Input */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              maxLength={50}
              autoCapitalize="words"
            />

            {/* Username Input with Live Availability */}
            <View style={styles.labelRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Username</Text>
              {usernameStatus === 'CHECKING' && (
                <View style={styles.statusIndicatorRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.statusText, { color: colors.textMuted }]}> Checking...</Text>
                </View>
              )}
              {usernameStatus === 'AVAILABLE' && (
                <View style={styles.statusIndicatorRow}>
                  <Ionicons name="checkmark" size={14} color="#10B981" />
                  <Text style={[styles.statusText, { color: '#10B981', fontWeight: '700' }]}> Available</Text>
                </View>
              )}
              {usernameStatus === 'UNAVAILABLE' && (
                <View style={styles.statusIndicatorRow}>
                  <Ionicons name="close" size={14} color="#EF4444" />
                  <Text style={[styles.statusText, { color: '#EF4444', fontWeight: '700' }]}>
                    {' '}
                    {usernameError || 'Taken'}
                  </Text>
                </View>
              )}
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor:
                    usernameStatus === 'AVAILABLE'
                      ? '#10B981'
                      : usernameStatus === 'UNAVAILABLE'
                      ? '#EF4444'
                      : colors.border,
                },
              ]}
              placeholder="e.g. johndoe"
              placeholderTextColor={colors.textMuted}
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />

            {/* Continue Submit Button */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: colors.buttonPrimaryBg,
                  opacity:
                    loading || !fullName.trim() || !username.trim() || usernameStatus === 'UNAVAILABLE' ? 0.6 : 1,
                },
              ]}
              onPress={handleProfileContinueClick}
              disabled={loading || !fullName.trim() || !username.trim() || usernameStatus === 'UNAVAILABLE'}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.buttonPrimaryText} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: colors.buttonPrimaryText }]}>
                  Continue →
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Policy Acceptance Modal for New Google Users */}
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
    paddingHorizontal: 20,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  brandLogoImage: {
    width: 68,
    height: 68,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13.5,
    marginBottom: 22,
    lineHeight: 19,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleBtnText: {
    color: '#0F172A',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disclaimerText: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 6,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 11.5,
  },
  verifiedEmailBox: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  emailTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifiedEmailText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 8,
  },
  verifiedBadgeText: {
    color: '#065F46',
    fontSize: 10.5,
    fontWeight: '700',
    marginLeft: 4,
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
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 15.5,
    fontWeight: '800',
  },
});

