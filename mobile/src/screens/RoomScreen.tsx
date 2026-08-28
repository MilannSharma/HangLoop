import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Share,
  Alert,
  ScrollView,
  BackHandler,
  AppState,
  AppStateStatus,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { api, RoomData, UserProfile } from '../services/api';
import { RoomWebSocketClient, RoomStatePayload } from '../services/websocket';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { ProfileModal } from '../components/ProfileModal';
import { HostControlsModal } from '../components/HostControlsModal';
import { QueueModal, QueueItem } from '../components/QueueModal';
import { RulesModal } from '../components/RulesModal';
import { RoomInfoModal } from '../components/RoomInfoModal';
import { ReportUserModal } from '../components/ReportUserModal';
import { EditRoomModal } from '../components/EditRoomModal';
import { BlockedUserInfo } from '../../App';

interface RoomScreenProps {
  room: RoomData;
  user: UserProfile;
  blockedUsers?: BlockedUserInfo[];
  onBlockUser?: (id: string, username: string, avatar_url?: string) => void;
  onUnblockUser?: (id: string) => void;
  onLeaveRoom: () => void;
}

export const RoomScreen: React.FC<RoomScreenProps> = ({
  room,
  user,
  blockedUsers = [],
  onBlockUser,
  onLeaveRoom,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [wsClient, setWsClient] = useState<RoomWebSocketClient | null>(null);
  const [inputText, setInputText] = useState('');

  // Mode state: Default Video Mode (isListenOnly = false)
  const [isListenOnlyMode, setIsListenOnlyMode] = useState(false);

  // Modals state
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showHostControls, setShowHostControls] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<any | null>(null);
  const [reportingUser, setReportingUser] = useState<any | null>(null);

  const [currentRoomData, setCurrentRoomData] = useState<RoomData>(room);
  const [isHost, setIsHost] = useState(room.created_by === user.username);
  const [roomStartTime, setRoomStartTime] = useState<number | null>(Date.now() - 120000);
  const [elapsedTime, setElapsedTime] = useState('02:00');
  const [timeoutUntil, setTimeoutUntil] = useState<number | null>(null);
  const [isLocalPlaying, setIsLocalPlaying] = useState(true);
  const [isStreamEnded, setIsStreamEnded] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);

  const isSuperAdmin = (user.email || '').toLowerCase().trim() === 'milansharma942105@gmail.com';
  const isModerator = !!(user.is_moderator || isSuperAdmin || isHost);

  // Default empty state — real data arrives from Durable Object via INIT_STATE WebSocket message
  const [roomState, setRoomState] = useState<RoomStatePayload>({
    playbackState: {
      currentVideo: null,
      isPlaying: true,
      seekPosition: 0,
      queue: [],
    },
    chatLogs: [
      {
        id: 'c-sys-1',
        sender: { id: 'sys', username: 'System', full_name: 'System', avatar_url: '' },
        text: `Welcome to ${room.name}! Enjoy live synced music & good vibes.`,
        isSystem: true,
        timestamp: Date.now(),
      },
    ],
    members: [
      { id: user.id || 'u1', username: user.username, full_name: user.full_name || user.username, avatar_url: user.avatar_url },
    ],
  });

  const flatListRef = useRef<FlatList>(null);
  const isPrivateChat = room.room_type === 'PRIVATE_CHAT' || room.is_private === 1;

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, { username: string; expiresAt: number }>>(new Map());
  const typingTimeoutRef = useRef<any>(null);
  const isNearBottomRef = useRef<boolean>(true);

  // Auto-cleanup expired typing indicators (TTL = 3.5s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        let hasExpired = false;
        for (const info of prev.values()) {
          if (info.expiresAt < now) {
            hasExpired = true;
            break;
          }
        }
        if (!hasExpired) return prev;
        const next = new Map();
        for (const [uid, info] of prev.entries()) {
          if (info.expiresAt >= now) {
            next.set(uid, info);
          }
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // WebSocket Setup
  useEffect(() => {
    const client = new RoomWebSocketClient(room.id, {
      id: user.id || 'u' + Date.now(),
      username: user.username,
      full_name: user.full_name || user.username,
      avatar_url: user.avatar_url || 'https://i.pravatar.cc/100',
      is_moderator: isModerator,
      is_super_admin: isSuperAdmin,
    });

    const unsubscribe = client.subscribe((data) => {
      if (data.type === 'INIT_STATE') {
        setRoomState((prev) => {
          const incomingLogs: any[] = Array.isArray(data.chatLogs) ? data.chatLogs : [];

          if (incomingLogs.length === 0) {
            return {
              playbackState: data.playbackState || prev.playbackState,
              chatLogs: prev.chatLogs,
              members: data.members && data.members.length > 0 ? data.members : prev.members,
            };
          }

          // Build deduplicated chat logs list
          const seenIds = new Set<string>();
          const mergedLogs: any[] = [];

          // Preserve initial system welcome message if present
          const welcomeMsg = prev.chatLogs.find((m) => m.id === 'c-sys-1' || m.isSystem);
          if (welcomeMsg) {
            seenIds.add(welcomeMsg.id);
            mergedLogs.push(welcomeMsg);
          }

          // Add incoming server logs in chronological order
          for (const msg of incomingLogs) {
            if (msg && msg.id && !seenIds.has(msg.id)) {
              seenIds.add(msg.id);
              if (msg.clientMessageId) seenIds.add(msg.clientMessageId);
              mergedLogs.push(msg);
            }
          }

          // Trim to sliding window (max 100)
          const finalLogs = mergedLogs.length > 100 ? mergedLogs.slice(-100) : mergedLogs;

          return {
            playbackState: data.playbackState || prev.playbackState,
            chatLogs: finalLogs,
            members: data.members && data.members.length > 0 ? data.members : prev.members,
          };
        });

        if (data.roomStartTime) setRoomStartTime(data.roomStartTime);
        if (data.isHost !== undefined) setIsHost(data.isHost);
        if (data.isStreamEnded !== undefined) setIsStreamEnded(data.isStreamEnded);
        if (data.tags) setCurrentRoomData((prev) => ({ ...prev, tags: data.tags }));
        if (data.roomName) setCurrentRoomData((prev) => ({ ...prev, name: data.roomName }));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 150);
      } else if (data.type === 'USER_TYPING') {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          if (data.isTyping && data.userId && data.userId !== user.id) {
            next.set(data.userId, {
              username: data.username || 'User',
              expiresAt: Date.now() + 3500,
            });
          } else if (data.userId) {
            next.delete(data.userId);
          }
          return next;
        });
      } else if (data.type === 'CHAT_RECEIVE' && data.message) {
        setRoomState((prev) => {
          const serverMsg = data.message;
          const matchIndex = prev.chatLogs.findIndex(
            (m) => (serverMsg.clientMessageId && m.clientMessageId === serverMsg.clientMessageId) || m.id === serverMsg.id
          );

          let updatedLogs: any[];
          if (matchIndex !== -1) {
            // Reconcile optimistic message in-place with authoritative server message
            updatedLogs = [...prev.chatLogs];
            updatedLogs[matchIndex] = serverMsg;
          } else {
            // New incoming message from another user or bot
            updatedLogs = [...prev.chatLogs, serverMsg];
          }

          // Bounded memory protection: max 100 messages on mobile
          if (updatedLogs.length > 100) {
            updatedLogs = updatedLogs.slice(-100);
          }

          return {
            ...prev,
            chatLogs: updatedLogs,
          };
        });
        if (isNearBottomRef.current) {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      } else if (data.type === 'CHAT_DELETED') {
        setRoomState((prev) => ({
          ...prev,
          chatLogs: prev.chatLogs.filter((m) => m.id !== data.messageId),
        }));
      } else if (data.type === 'MODERATOR_UPDATED') {
        setRoomState((prev) => ({
          ...prev,
          chatLogs: prev.chatLogs.map((m) =>
            m.sender.id === data.targetUserId || m.sender.id.toLowerCase() === (data.targetUserId || '').toLowerCase()
              ? { ...m, sender: { ...m.sender, is_moderator: data.isModerator } }
              : m
          ),
          members: prev.members.map((m) =>
            m.id === data.targetUserId || m.id.toLowerCase() === (data.targetUserId || '').toLowerCase()
              ? { ...m, is_moderator: data.isModerator }
              : m
          ),
        }));
        if (data.targetUserId === user.id || (data.targetUserId || '').toLowerCase() === user.id.toLowerCase()) {
          user.is_moderator = data.isModerator;
        }
      } else if (data.type === 'USER_TIMED_OUT') {
        if (data.targetUserId === user.id) {
          setTimeoutUntil(data.expiresAt);
          Alert.alert('Chat Timeout', `You have been placed on a ${data.durationMinutes}m chat timeout.`);
        }
        if (data.systemMessage) {
          setRoomState((prev) => ({
            ...prev,
            chatLogs: [...prev.chatLogs, data.systemMessage],
          }));
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      } else if (data.type === 'TIMED_OUT') {
        setTimeoutUntil(data.expiresAt);
        Alert.alert('Chat Timeout', data.message || 'You are timed out from chatting.');
      } else if (data.type === 'ERROR') {
        Alert.alert('Chat Notice', data.message);
      } else if (data.type === 'PLAYBACK_SYNC') {
        setRoomState((prev) => ({
          ...prev,
          playbackState: data.playbackState,
        }));
      } else if (data.type === 'QUEUE_UPDATED') {
        setRoomState((prev) => ({
          ...prev,
          playbackState: {
            ...prev.playbackState,
            queue: data.queue || prev.playbackState?.queue || [],
          },
        }));
      } else if (data.type === 'ROOM_UPDATED') {
        if (data.room) {
          setCurrentRoomData((prev) => ({
            ...prev,
            ...data.room,
            name: data.room.name || prev.name,
            tags: data.room.tags || prev.tags,
          }));
        }
        if (data.playbackState) {
          setRoomState((prev) => ({
            ...prev,
            playbackState: data.playbackState,
          }));
          setIsStreamEnded(false);
        }
      } else if (data.type === 'STREAM_ENDED') {
        setIsStreamEnded(true);
        setRoomState((prev) => ({
          ...prev,
          playbackState: {
            ...prev.playbackState,
            isPlaying: false,
            isStreamEnded: true,
          },
        }));
      } else if (data.type === 'MEMBER_JOINED') {
        setRoomState((prev) => ({
          ...prev,
          members: [...prev.members.filter((m) => m.id !== data.user.id), data.user],
        }));
      } else if (data.type === 'MEMBER_LEFT') {
        setRoomState((prev) => ({
          ...prev,
          members: prev.members.filter((m) => m.id !== data.userId),
        }));
      } else if (data.type === 'ROOM_ENDED') {
        Alert.alert('Room Ended', data.message || 'The room was closed.');
        onLeaveRoom();
      }
    });

    client.connect();
    setWsClient(client);

    return () => {
      unsubscribe();
      client.disconnect();
    };
  }, [room.id, user.id]);

  // Live Timer Interval
  useEffect(() => {
    if (!roomStartTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - roomStartTime) / 1000);
      const m = Math.floor(diff / 60)
        .toString()
        .padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsedTime(`${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [roomStartTime]);

  // Real D1 Presence Heartbeat Loop (every 10s)
  useEffect(() => {
    const sessionId = `sess-${user.id}-${room.id}`;
    api.sendPresenceHeartbeat(room.id, user.id, user.username, sessionId);

    const hbTimer = setInterval(() => {
      if (wsClient) {
        wsClient.sendHeartbeat();
      }
      api.sendPresenceHeartbeat(room.id, user.id, user.username, sessionId);
    }, 10000);

    return () => clearInterval(hbTimer);
  }, [room.id, user.id, user.username, wsClient]);

  // Auto-resync when device is unlocked or app returns to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('[RoomScreen] App resumed/unlocked -> triggering live resync');
        if (wsClient) {
          wsClient.sendHeartbeat();
        }
        setRoomState((prev) => {
          const pb = prev.playbackState;
          if (!pb) return prev;
          let liveSeek = pb.seekPosition || 0;
          if (pb.startTimestamp) {
            const elapsed = (Date.now() - pb.startTimestamp) / 1000;
            liveSeek += elapsed;
          }
          return {
            ...prev,
            playbackState: {
              ...pb,
              isPlaying: true,
              seekPosition: liveSeek,
            },
          };
        });
      }
    });

    return () => subscription.remove();
  }, [wsClient]);

  // Back gesture / key handling inside RoomScreen
  useEffect(() => {
    const onBackPress = () => {
      if (reportingUser) {
        setReportingUser(null);
        return true;
      }
      if (selectedProfileUser) {
        setSelectedProfileUser(null);
        return true;
      }
      if (showQueueModal) {
        setShowQueueModal(false);
        return true;
      }
      if (showRulesModal) {
        setShowRulesModal(false);
        return true;
      }
      if (showInfoModal) {
        setShowInfoModal(false);
        return true;
      }
      if (showHostControls) {
        setShowHostControls(false);
        return true;
      }
      onLeaveRoom();
      return true;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [reportingUser, selectedProfileUser, showQueueModal, showRulesModal, showInfoModal, showHostControls, onLeaveRoom]);

  const handleShareRoom = async () => {
    try {
      await Share.share({
        message: `Join me live in "${room.name}" on Hangloop! Room Code: ${room.id}`,
      });
    } catch (error) {
      console.log('Error sharing room:', error);
    }
  };

  const handleSendMessage = () => {
    if (timeoutUntil && timeoutUntil > Date.now()) {
      const remainingSec = Math.ceil((timeoutUntil - Date.now()) / 1000);
      const remainingMin = Math.ceil(remainingSec / 60);
      Alert.alert('Timeout Active', `You are timed out from sending messages. Remaining: ${remainingMin}m (${remainingSec}s).`);
      return;
    }

    const text = inputText.trim().slice(0, 300);
    if (!text) return;

    if (text.length > 300) {
      Alert.alert('Message Too Long', 'Chat messages are limited to 300 characters maximum.');
      return;
    }

    const clientMessageId = 'client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    const optimisticMsg = {
      id: clientMessageId,
      clientMessageId,
      sender: {
        id: user.id || 'u-me',
        username: user.username,
        full_name: user.full_name || user.username,
        avatar_url: user.avatar_url || 'https://i.pravatar.cc/100',
        is_moderator: isModerator,
        is_super_admin: isSuperAdmin,
      },
      text,
      timestamp: Date.now(),
    };

    setRoomState((prev) => {
      let nextLogs = [...prev.chatLogs, optimisticMsg];
      if (nextLogs.length > 100) nextLogs = nextLogs.slice(-100);
      return {
        ...prev,
        chatLogs: nextLogs,
      };
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (wsClient) {
      wsClient.sendTyping(false);
      wsClient.sendChatMessage(text, clientMessageId);
    }

    setInputText('');
    isNearBottomRef.current = true;
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleMessageActionSheet = (item: any) => {
    if (item.isSystem) return;
    const isSenderMe = item.sender.id === user.id || item.sender.username === user.username;

    if (!isModerator && !isSenderMe) {
      setSelectedProfileUser(item.sender);
      return;
    }

    const options: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress: () => void }[] = [];

    // 1. Super Admin Privilege: Make / Remove Moderator
    if (isSuperAdmin && !isSenderMe) {
      if (item.sender.is_moderator) {
        options.push({
          text: 'Remove Moderator 🚫',
          style: 'destructive',
          onPress: async () => {
            try {
              if (wsClient) {
                wsClient.removeModerator(item.sender.id);
              }
              const res = await api.removeModerator(item.sender.id);
              if (res.success) {
                Alert.alert('Moderator Removed', `${item.sender.full_name || item.sender.username} is no longer a Moderator.`);
                setRoomState((prev) => ({
                  ...prev,
                  chatLogs: prev.chatLogs.map((m) =>
                    m.sender.id === item.sender.id ? { ...m, sender: { ...m.sender, is_moderator: false } } : m
                  ),
                }));
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        });
      } else {
        options.push({
          text: '👑 Make Moderator',
          onPress: async () => {
            try {
              if (wsClient) {
                wsClient.makeModerator(item.sender.id);
              }
              const res = await api.addModerator(item.sender.id, {
                userId: item.sender.id,
                username: item.sender.username,
                full_name: item.sender.full_name,
                avatar_url: item.sender.avatar_url,
                can_delete_messages: true,
                can_timeout_users: true,
                can_kick_users: true,
              });
              if (res.success) {
                Alert.alert('Success 🎉', `${item.sender.full_name || item.sender.username} is now a Live Chat Moderator!`);
                setRoomState((prev) => ({
                  ...prev,
                  chatLogs: prev.chatLogs.map((m) =>
                    m.sender.id === item.sender.id ? { ...m, sender: { ...m.sender, is_moderator: true } } : m
                  ),
                }));
              } else {
                Alert.alert('Error', res.error || 'Failed to assign moderator role.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        });
      }
    }

    // 2. Remove / Delete message (Super Admin, Moderator, Room Host, or Owner)
    if (isModerator || isSenderMe) {
      options.push({
        text: 'Remove Message 🗑️',
        style: 'destructive',
        onPress: () => {
          if (wsClient) {
            wsClient.deleteChatMessage(item.id);
          } else {
            setRoomState((prev) => ({
              ...prev,
              chatLogs: prev.chatLogs.filter((m) => m.id !== item.id),
            }));
          }
        },
      });
    }

    // 3. Timeout user (5m, 15m, 1h, 24h)
    if (isModerator && !isSenderMe) {
      options.push({
        text: 'Timeout User (5 Mins) ⏳',
        style: 'destructive',
        onPress: () => {
          if (wsClient) wsClient.timeoutUser(item.sender.id, 5, 'Inappropriate message');
        },
      });
      options.push({
        text: 'Timeout User (1 Hour) ⏳',
        style: 'destructive',
        onPress: () => {
          if (wsClient) wsClient.timeoutUser(item.sender.id, 60, 'Repeated rule violations');
        },
      });
    }

    // 4. Hide / Block User
    if (!isSenderMe) {
      options.push({
        text: 'Hide / Block User 👁️',
        style: 'destructive',
        onPress: () => {
          if (onBlockUser) onBlockUser(item.sender.id, item.sender.username, item.sender.avatar_url);
          Alert.alert('User Hidden', `Messages from ${item.sender.full_name || item.sender.username} are now hidden.`);
        },
      });
    }

    // 5. Kick from Room
    if (isModerator && !isSenderMe) {
      options.push({
        text: 'Kick from Room 🚫',
        style: 'destructive',
        onPress: () => {
          if (wsClient) wsClient.kickUser(item.sender.id);
        },
      });
    }

    // 6. View Profile
    options.push({
      text: 'View Profile 👤',
      onPress: () => setSelectedProfileUser(item.sender),
    });

    options.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: () => {},
    });

    Alert.alert(
      item.sender.full_name || item.sender.username,
      `"${item.text.slice(0, 60)}${item.text.length > 60 ? '…' : ''}"`,
      options
    );
  };

  const handleTogglePlay = () => {
    setIsLocalPlaying((prev) => {
      const willPlay = !prev;
      if (willPlay) {
        if (roomState.playbackState?.startTimestamp) {
          const elapsed = (Date.now() - roomState.playbackState.startTimestamp) / 1000;
          setRoomState((r) => ({
            ...r,
            playbackState: {
              ...r.playbackState,
              seekPosition: Math.max(0, elapsed),
            },
          }));
        }
        if (wsClient) {
          wsClient.requestSync();
        }
      }
      return willPlay;
    });
  };

  const handleAddToQueue = (item: QueueItem) => {
    // Optimistically update local queue state
    setRoomState((prev) => ({
      ...prev,
      playbackState: {
        ...prev.playbackState,
        queue: [...(prev.playbackState?.queue || []), item],
      },
    }));

    // Send through WebSocket to server & sync with room
    if (wsClient) {
      wsClient.addToQueue(item);
    }
  };

  // Filter out messages from blocked users in real time (with safe optional chaining)
  const blockedIdsSet = new Set(blockedUsers.map((b) => b.id));
  const visibleChatLogs = roomState.chatLogs.filter(
    (msg) => msg && (!msg.sender || !msg.sender.id || !blockedIdsSet.has(msg.sender.id))
  );

  const renderChatItem = ({ item }: { item: any }) => {
    if (item.isSystem) {
      return (
        <View style={styles.chatRowSystem}>
          <View style={[styles.systemIconCircle, { backgroundColor: colors.badgeBg }]}>
            <Ionicons name="information" size={14} color={colors.primary} />
          </View>
          <Text style={[styles.chatTextSystem, { color: colors.textMuted }]}>{item.text}</Text>
        </View>
      );
    }

    const isMe = item.sender.username === user.username || item.sender.id === user.id;
    const isAI = !!(item.isAI || item.sender.id === 'kira-ai' || item.sender.username === 'Kira');
    const isSenderMod = !isAI && !!(item.sender.is_moderator || item.sender.is_super_admin || item.sender.username === 'milansharma942105@gmail.com');
    const isSenderHost = !isAI && item.sender.username === room.created_by;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.chatRow}
        onPress={() => {
          if (isAI) return;
          if (isSuperAdmin || isModerator) {
            handleMessageActionSheet(item);
          } else {
            setSelectedProfileUser(item.sender);
          }
        }}
        onLongPress={() => {
          if (!isAI) handleMessageActionSheet(item);
        }}
        delayLongPress={250}
      >
        <Image
          source={{ uri: item.sender.avatar_url || (isAI ? 'https://api.dicebear.com/7.x/bottts/svg?seed=kira-ai' : 'https://i.pravatar.cc/100') }}
          style={[
            styles.chatAvatar,
            {
              borderColor: isAI ? '#8B5CF6' : (isSenderMod ? '#F0C040' : (isMe ? colors.primary : colors.border)),
              borderWidth: isAI || isSenderMod ? 2 : 1.5,
            },
          ]}
        />

        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text
              style={[
                styles.chatUsername,
                { color: isAI ? '#A78BFA' : (isSenderMod ? '#F0C040' : (isMe ? colors.primary : colors.text)) },
              ]}
            >
              {item.sender.full_name || item.sender.username}
            </Text>

            {isAI && (
              <View style={[styles.aiBadge, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="sparkles" size={8} color="#FFFFFF" style={{ marginRight: 2 }} />
                <Text style={styles.aiBadgeText}>AI BOT</Text>
              </View>
            )}

            {isSenderMod && (
              <View style={[styles.goldModBadge, { backgroundColor: '#F0C040' }]}>
                <Ionicons name="shield-checkmark" size={8} color="#0A0A0A" style={{ marginRight: 2 }} />
                <Text style={styles.goldModBadgeText}>MOD</Text>
              </View>
            )}

            {isSenderHost && (
              <View style={[styles.hostBadge, { backgroundColor: colors.badgeBg }]}>
                <Text style={[styles.hostBadgeText, { color: colors.primary }]}>HOST</Text>
              </View>
            )}
          </View>
          <Text style={[styles.chatText, { color: colors.text }]}>{item.text}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 12;
  const inputBottomPadding = isKeyboardVisible ? 8 : (insets.bottom > 0 ? insets.bottom + 8 : 12);

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View
          style={[
            styles.header,
            { paddingTop: headerPaddingTop, borderBottomColor: colors.border },
          ]}
        >
          <TouchableOpacity style={styles.backBtn} onPress={onLeaveRoom}>
            <Ionicons name="chevron-down" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[styles.roomTitleText, { color: colors.text }]} numberOfLines={1}>
              {room.name}
            </Text>
            <View style={styles.viewerBadge}>
              <Ionicons name="headset" size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.viewerText, { color: colors.textSecondary }]}>
                {room.active_viewers || roomState.members.length || 42} listening
              </Text>
            </View>
          </View>

          <View style={styles.timerBadge}>
            <Text style={[styles.timerText, { color: colors.text }]}>{elapsedTime}</Text>
          </View>
        </View>

        {/* 1 & 2. TOP PLAYER: Default Video Mode vs Listen-Only Mode */}
        {!isPrivateChat && (
          <View style={[styles.playerOuterWrapper, { backgroundColor: colors.surface }]}>
            {roomState.playbackState?.currentVideo ? (
              <YouTubePlayer
                videoId={roomState.playbackState.currentVideo.videoId}
                title={roomState.playbackState.currentVideo.title}
                artist={roomState.playbackState.currentVideo.artist || currentRoomData.created_by}
                thumbnail={roomState.playbackState.currentVideo.thumbnail}
                isPlaying={isLocalPlaying && !isStreamEnded}
                seekPosition={roomState.playbackState.seekPosition}
                isListenOnly={isListenOnlyMode}
                isLiveStream={currentRoomData.play_source_type === 'YOUTUBE_URL'}
                isStreamEnded={isStreamEnded || !!roomState.playbackState?.isStreamEnded}
                onTogglePlay={handleTogglePlay}
                onToggleListenOnly={() => setIsListenOnlyMode((prev) => !prev)}
                onTrackEnded={() => {
                  const vId = roomState.playbackState.currentVideo?.videoId;
                  console.log('[RoomScreen] Track ended:', vId);
                  if (wsClient) wsClient.notifyTrackEnded(vId);
                }}
                onTrackFailed={(vId, errCode) => {
                  if (currentRoomData.play_source_type === 'YOUTUBE_URL') {
                    console.warn(`[RoomScreen] Live Stream transient error: ${vId} (code ${errCode}) — keeping room alive`);
                    return;
                  }
                  console.warn(`[RoomScreen] Track failed: ${vId} (code ${errCode}), auto-skipping...`);
                  if (wsClient) wsClient.notifyTrackFailed(vId);
                }}
                onResyncLive={() => {
                  setIsLocalPlaying(true);
                  if (roomState.playbackState?.startTimestamp) {
                    const elapsed = (Date.now() - roomState.playbackState.startTimestamp) / 1000;
                    setRoomState((prev) => ({
                      ...prev,
                      playbackState: {
                        ...prev.playbackState,
                        seekPosition: Math.max(0, elapsed),
                      },
                    }));
                  }
                  if (wsClient) {
                    wsClient.requestSync();
                    wsClient.sendHeartbeat();
                  }
                }}
              />
            ) : (
              <View style={[styles.loadingVideo, { backgroundColor: colors.surface }]}>
                <Ionicons name="headset" size={48} color={colors.primary} />
              </View>
            )}
          </View>
        )}

        {/* 3. ROOM ACTIONS — One Compact Horizontal Line */}
        <View style={[styles.actionsBarWrapper, { borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsRow}
          >
            {/* Queue Song (Only enabled for APP_DB rooms) */}
            {room.play_source_type !== 'YOUTUBE_URL' ? (
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowQueueModal(true)}
              >
                <Ionicons name="musical-note" size={15} color={colors.primary} />
                <Text style={[styles.actionChipText, { color: colors.text }]}>Queue Song</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.actionChip, { backgroundColor: colors.surface, borderColor: colors.border, opacity: 0.5 }]}>
                <Ionicons name="radio" size={15} color={colors.textSecondary} />
                <Text style={[styles.actionChipText, { color: colors.textSecondary }]}>Dedicated Stream</Text>
              </View>
            )}

            {/* Rules */}
            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowRulesModal(true)}
            >
              <Ionicons name="book-outline" size={15} color={colors.primary} />
              <Text style={[styles.actionChipText, { color: colors.text }]}>Rules</Text>
            </TouchableOpacity>

            {/* Room Info */}
            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowInfoModal(true)}
            >
              <Ionicons name="information-circle-outline" size={15} color={colors.primary} />
              <Text style={[styles.actionChipText, { color: colors.text }]}>Room Info</Text>
            </TouchableOpacity>

            {/* Admin / Host Edit Room Button */}
            {(isSuperAdmin || isHost) && (
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: 'rgba(99,102,241,0.18)', borderColor: colors.primary }]}
                onPress={() => setShowEditRoomModal(true)}
              >
                <Ionicons name="create-outline" size={15} color={colors.primary} />
                <Text style={[styles.actionChipText, { color: colors.primary }]}>Edit Room</Text>
              </TouchableOpacity>
            )}

            {/* Share */}
            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={handleShareRoom}
            >
              <Ionicons name="share-social-outline" size={15} color={colors.primary} />
              <Text style={[styles.actionChipText, { color: colors.text }]}>Share</Text>
            </TouchableOpacity>

            {/* Host Controls */}
            {isHost && (
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: colors.primary }]}
                onPress={() => setShowHostControls(true)}
              >
                <Ionicons name="shield-checkmark" size={15} color="#FFFFFF" />
                <Text style={[styles.actionChipText, { color: '#FFFFFF' }]}>Host Controls</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* 4. FULL LIVE CHAT — Main section taking remaining height */}
        <View style={styles.chatFeedWrapper}>
          <FlatList
            ref={flatListRef}
            data={visibleChatLogs}
            keyExtractor={(item) => item.id}
            renderItem={renderChatItem}
            contentContainerStyle={styles.chatListContainer}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            onScroll={(event) => {
              const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
              const paddingToBottom = 60;
              const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
              isNearBottomRef.current = isCloseToBottom;
            }}
            scrollEventThrottle={100}
            ListHeaderComponent={
              <View style={styles.olderMessagesNotice}>
                <Ionicons name="archive-outline" size={13} color={colors.textMuted} style={{ marginRight: 6 }} />
                <Text style={[styles.olderMessagesNoticeText, { color: colors.textMuted }]}>
                  Older messages are no longer available
                </Text>
              </View>
            }
            onContentSizeChange={() => {
              if (isNearBottomRef.current) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />
        </View>

        {/* Live Typing Indicator in Upper Chat Area (Above Input Bar) */}
        {typingUsers.size > 0 && (
          <View style={[styles.typingIndicatorBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <View style={[styles.typingDotWrap, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name="chatbubble-ellipses" size={13} color={colors.primary} />
            </View>
            <Text style={[styles.typingText, { color: colors.textSecondary }]} numberOfLines={1}>
              <Text style={{ fontWeight: '700', color: colors.text }}>
                {Array.from(typingUsers.values()).map((u) => u.username).slice(0, 2).join(', ')}
                {typingUsers.size > 2 ? ` and ${typingUsers.size - 2} others` : ''}
              </Text>
              {typingUsers.size === 1 ? ' is typing…' : ' are typing…'}
            </Text>
          </View>
        )}

        {/* 5. FIXED MESSAGE INPUT — Sticky at bottom */}
        {Boolean(timeoutUntil && timeoutUntil > Date.now()) && (
          <View style={[styles.timeoutWarningBanner, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
            <Ionicons name="time" size={14} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={[styles.timeoutWarningText, { color: '#EF4444' }]}>
              You are on chat timeout (expires in {Math.ceil((Number(timeoutUntil) - Date.now()) / 60000)}m)
            </Text>
          </View>
        )}

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: inputBottomPadding,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.inputBg,
                borderColor: inputText.length >= 300 ? colors.liveRed : (inputText.length > 250 ? '#F59E0B' : colors.border),
              },
            ]}
          >
            <TextInput
              style={[styles.textInput, { color: colors.text }]}
              placeholder={Boolean(timeoutUntil && timeoutUntil > Date.now()) ? "You are on chat timeout..." : "Type a message… (max 300 chars)"}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              keyboardAppearance={isDark ? 'dark' : 'light'}
              autoCorrect={false}
              autoCapitalize="sentences"
              value={inputText}
              onChangeText={(t) => {
                const trimmed = t.slice(0, 300);
                setInputText(trimmed);
                if (wsClient && trimmed.trim().length > 0) {
                  wsClient.sendTyping(true);
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    if (wsClient) wsClient.sendTyping(false);
                  }, 2500);
                } else if (wsClient && trimmed.trim().length === 0) {
                  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                  wsClient.sendTyping(false);
                }
              }}
              onSubmitEditing={handleSendMessage}
              maxLength={300}
              editable={!Boolean(timeoutUntil && timeoutUntil > Date.now())}
            />

            {/* Interactive Character Counter */}
            {inputText.length > 180 && (
              <View style={styles.charCounterWrap}>
                <Text
                  style={[
                    styles.charCounterText,
                    {
                      color: inputText.length >= 300 ? colors.liveRed : (inputText.length > 250 ? '#F59E0B' : colors.textMuted),
                    },
                  ]}
                >
                  {inputText.length}/300
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: inputText.trim() && !Boolean(timeoutUntil && timeoutUntil > Date.now()) ? colors.primary : colors.surfaceLight,
              },
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || Boolean(timeoutUntil && timeoutUntil > Date.now())}
          >
            <Ionicons
              name="send"
              size={16}
              color={inputText.trim() && !Boolean(timeoutUntil && timeoutUntil > Date.now()) ? "#FFFFFF" : colors.textMuted}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>

        {/* Modals & Popups */}
        <QueueModal
          visible={showQueueModal}
          onClose={() => setShowQueueModal(false)}
          currentVideo={roomState.playbackState?.currentVideo}
          queue={roomState.playbackState?.queue || []}
          onAddToQueue={handleAddToQueue}
          roomTheme={room.theme}
          currentUser={user}
        />

        <RulesModal
          visible={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          roomName={room.name}
        />

        <RoomInfoModal
          visible={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          room={currentRoomData}
          activeViewersCount={currentRoomData.active_viewers || roomState.members.length || 42}
        />

        <EditRoomModal
          visible={showEditRoomModal}
          room={currentRoomData}
          onClose={() => setShowEditRoomModal(false)}
          onRoomUpdated={(updatedRoom) => {
            setCurrentRoomData((prev) => ({ ...prev, ...updatedRoom }));
          }}
          onRoomDeleted={() => {
            onLeaveRoom();
          }}
        />

        <ProfileModal
          user={selectedProfileUser}
          currentUser={user}
          isHost={!!isHost}
          onClose={() => setSelectedProfileUser(null)}
          onTimeoutUser={(targetId, durationMinutes, reason) => {
            if (wsClient) wsClient.timeoutUser(targetId, durationMinutes, reason);
          }}
          onKickUser={(targetId) => {
            if (wsClient) wsClient.kickUser(targetId);
          }}
          onBlockUser={(targetId, uname) => {
            if (onBlockUser) onBlockUser(targetId, uname, selectedProfileUser?.avatar_url);
            setSelectedProfileUser(null);
            Alert.alert('Blocked', `@${uname} has been blocked.`);
          }}
          onReportUser={(u) => {
            setSelectedProfileUser(null);
            setReportingUser(u);
          }}
        />

        <ReportUserModal
          visible={!!reportingUser}
          user={reportingUser}
          onClose={() => setReportingUser(null)}
          onReportSubmitted={(reason, details) => {
            console.log(`Report submitted for ${reportingUser?.username}: ${reason} - ${details}`);
          }}
        />

        <HostControlsModal
          visible={showHostControls}
          roomId={room.id}
          roomName={room.name}
          members={roomState.members}
          currentUserId={user.id}
          onClose={() => setShowHostControls(false)}
          onKickMember={(id) =>
            setRoomState((prev) => ({
              ...prev,
              members: prev.members.filter((m) => m.id !== id),
            }))
          }
          onBlockMember={(id: string, uname?: string) => {
            if (onBlockUser) onBlockUser(id, uname || 'user');
          }}
          onEndRoom={onLeaveRoom}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  roomTitleText: {
    fontSize: 16,
    fontWeight: '800',
  },
  viewerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  viewerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  playerOuterWrapper: {
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loadingVideo: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsBarWrapper: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  actionsRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chatFeedWrapper: {
    flex: 1,
  },
  chatListContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  olderMessagesNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 6,
    opacity: 0.75,
  },
  olderMessagesNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 14,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    borderWidth: 1.5,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatUsername: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  aiBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  goldModBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  goldModBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: 0.5,
  },
  hostBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chatText: {
    fontSize: 14,
    lineHeight: 20,
  },
  chatRowSystem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingLeft: 4,
  },
  systemIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chatTextSystem: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
  },
  timeoutWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  timeoutWarningText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    lineHeight: 18,
    minHeight: 40,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  charCounterWrap: {
    paddingRight: 12,
  },
  charCounterText: {
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  typingIndicatorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderTopWidth: 1,
    gap: 8,
  },
  typingDotWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
