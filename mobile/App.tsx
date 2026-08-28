import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, BackHandler, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { UserProfile, RoomData, api } from './src/services/api';
import { SafeStorage } from './src/services/storage';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ChatsScreen } from './src/screens/ChatsScreen';
import { RoomScreen } from './src/screens/RoomScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

export interface BlockedUserInfo {
  id: string;
  username: string;
  avatar_url: string;
}

const STORAGE_KEY_BLOCKED = '@hangloop_blocked_users';

function MainAppContent() {
  const { colors, isDark } = useTheme();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  const [currentTab, setCurrentTab] = useState<'HOME' | 'CHATS' | 'PROFILE'>('HOME');
  const [activeRoom, setActiveRoom] = useState<RoomData | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<UserProfile | null>(null);
  const [showSelfProfile, setShowSelfProfile] = useState(false);

  // Global state for blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserInfo[]>([]);

  // Load saved session on app startup
  useEffect(() => {
    const restoreSessionOnMount = async () => {
      try {
        const savedBlocked = await SafeStorage.getItem(STORAGE_KEY_BLOCKED);
        if (savedBlocked) {
          setBlockedUsers(JSON.parse(savedBlocked));
        }

        const sessionRes = await api.restoreSession();
        if (sessionRes.success && sessionRes.user) {
          setCurrentUser(sessionRes.user);
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.warn('Failed restoring session on mount:', e);
        setCurrentUser(null);
      } finally {
        setInitializing(false);
      }
    };

    restoreSessionOnMount();
  }, []);

  const handleBlockUser = (id: string, username: string, avatar_url: string = 'https://i.pravatar.cc/100') => {
    setBlockedUsers((prev) => {
      if (prev.some((u) => u.id === id)) return prev;
      const updated = [...prev, { id, username, avatar_url }];
      SafeStorage.setItem(STORAGE_KEY_BLOCKED, JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  };

  const handleUnblockUser = (id: string) => {
    setBlockedUsers((prev) => {
      const updated = prev.filter((u) => u.id !== id);
      SafeStorage.setItem(STORAGE_KEY_BLOCKED, JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  };

  const handleUpdateUser = (updated: UserProfile) => {
    setCurrentUser(updated);
  };

  const handleLogout = async () => {
    await api.logoutUser();
    setCurrentUser(null);
    setActiveRoom(null);
    setShowSelfProfile(false);
    setSelectedUserForProfile(null);
  };

  const displayedProfileUser = selectedUserForProfile || (showSelfProfile ? currentUser : null);

  const handleSelectTab = (tab: 'HOME' | 'CHATS' | 'PROFILE') => {
    if (tab === 'PROFILE') {
      setShowSelfProfile(true);
    } else {
      setShowSelfProfile(false);
      setSelectedUserForProfile(null);
    }
    setCurrentTab(tab);
  };

  // GLOBAL HARDWARE & GESTURE BACK NAVIGATION STACK
  useEffect(() => {
    const onHardwareBack = () => {
      if (displayedProfileUser) {
        setSelectedUserForProfile(null);
        setShowSelfProfile(false);
        return true;
      }
      if (activeRoom) {
        setActiveRoom(null);
        return true;
      }
      if (currentTab !== 'HOME') {
        setCurrentTab('HOME');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => subscription.remove();
  }, [displayedProfileUser, activeRoom, currentTab]);

  if (initializing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Not Logged In -> Render AuthScreen with Real Multi-step Registration
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {displayedProfileUser ? (
        <ProfileScreen
          user={displayedProfileUser}
          blockedUsers={blockedUsers}
          onBack={() => {
            setSelectedUserForProfile(null);
            setShowSelfProfile(false);
          }}
          onUnblockUser={handleUnblockUser}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
        />
      ) : activeRoom ? (
        <RoomScreen
          room={activeRoom}
          user={currentUser}
          blockedUsers={blockedUsers}
          onLeaveRoom={() => setActiveRoom(null)}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
        />
      ) : currentTab === 'CHATS' ? (
        <ChatsScreen
          user={currentUser}
          currentTab={currentTab}
          onJoinRoom={(room) => setActiveRoom(room)}
          onSelectTab={handleSelectTab}
        />
      ) : (
        <DashboardScreen
          user={currentUser}
          currentTab={currentTab}
          onJoinRoom={(room) => setActiveRoom(room)}
          onSelectTab={handleSelectTab}
          onLogout={handleLogout}
        />
      )}
    </View>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('RootErrorBoundary caught unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
          <Text style={styles.errorTitle}>Hangloop Recovery</Text>
          <Text style={styles.errorDetails}>{this.state.error?.message || 'A temporary error occurred.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleReset}>
            <Text style={styles.retryButtonText}>Reload App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RootErrorBoundary>
          <MainAppContent />
        </RootErrorBoundary>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 12,
  },
  errorDetails: {
    fontSize: 14,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
