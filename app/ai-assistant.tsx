import { useState, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { fetch } from 'expo/fetch';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { getApiUrl } from '@/lib/query-client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

let messageCounter = 0;
function generateId(): string {
  messageCounter++;
  return `msg-${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

const suggestedPrompts = [
  { ar: '\u0645\u0627 \u0647\u0648 \u0631\u0635\u064a\u062f \u062a\u0623\u0645\u064a\u0646\u064a\u061f', en: "What's my insurance balance?" },
  { ar: '\u0647\u0644 \u064a\u063a\u0637\u064a \u0627\u0644\u062a\u0623\u0645\u064a\u0646 \u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u0631\u0643\u0628\u0629\u061f', en: 'Is knee surgery covered?' },
  { ar: '\u062d\u0627\u0644\u0629 \u0645\u0637\u0627\u0644\u0628\u062a\u064a \u0627\u0644\u0623\u062e\u064a\u0631\u0629', en: 'Status of my latest claim' },
  { ar: '\u0623\u062d\u062a\u0627\u062c \u0645\u0648\u0639\u062f \u0645\u0639 \u0637\u0628\u064a\u0628 \u0639\u064a\u0648\u0646', en: 'I need an eye doctor appointment' },
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Ionicons name="sparkles" size={14} color={Colors.signalTeal} />
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>{message.content}</Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow]}>
      <View style={styles.avatarContainer}>
        <Ionicons name="sparkles" size={14} color={Colors.signalTeal} />
      </View>
      <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble]}>
        <ActivityIndicator size="small" color={Colors.signalTeal} />
      </View>
    </View>
  );
}

export default function AiAssistantScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const handleSend = async (text?: string) => {
    const content = (text || inputText).trim();
    if (!content || isStreaming) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText('');

    const currentMessages = [...messages];
    const userMsg: Message = { id: generateId(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setShowTyping(true);

    try {
      const baseUrl = getApiUrl();
      const chatHistory = [
        ...currentMessages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content },
      ];

      const response = await fetch(`${baseUrl}api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ messages: chatHistory, language }),
      });

      if (!response.ok) throw new Error('Failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;
              if (!assistantAdded) {
                setShowTyping(false);
                setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: fullContent }]);
                assistantAdded = true;
              } else {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullContent };
                  return updated;
                });
              }
            }
          } catch {}
        }
      }
    } catch {
      setShowTyping(false);
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: t('\u0639\u0630\u0631\u0627\u064b\u060c \u062d\u062f\u062b \u062e\u0637\u0623. \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.', 'Sorry, an error occurred. Please try again.'),
      }]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  };

  const reversedMessages = [...messages].reverse();

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={Colors.signalTeal} />
          </View>
          <Text style={styles.topBarTitle}>{t('\u0628\u0633\u0645\u0629', 'Basma')}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}>
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeIcon}>
              <Ionicons name="sparkles" size={32} color={Colors.signalTeal} />
            </View>
            <Text style={styles.welcomeTitle}>
              {t('\u0645\u0631\u062d\u0628\u0627\u064b\u060c \u0623\u0646\u0627 \u0628\u0633\u0645\u0629', 'Hello, I\'m Basma')}
            </Text>
            <Text style={styles.welcomeSubtitle}>
              {t('\u0645\u0633\u0627\u0639\u062f\u0643 \u0627\u0644\u0635\u062d\u064a \u0627\u0644\u0630\u0643\u064a', 'Your AI health assistant')}
            </Text>
            <View style={styles.suggestionsGrid}>
              {suggestedPrompts.map((prompt, i) => (
                <Pressable
                  key={i}
                  style={styles.suggestionButton}
                  onPress={() => handleSend(t(prompt.ar, prompt.en))}
                >
                  <Text style={styles.suggestionText}>{t(prompt.ar, prompt.en)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            data={reversedMessages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            inverted={messages.length > 0}
            ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
            contentContainerStyle={styles.messageList}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
          />
        )}

        <View style={[styles.inputBar, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder={t('\u0627\u0643\u062a\u0628 \u0631\u0633\u0627\u0644\u062a\u0643...', 'Type your message...')}
              placeholderTextColor={Colors.professionalGray}
              value={inputText}
              onChangeText={setInputText}
              multiline
              blurOnSubmit={false}
            />
            <Pressable
              style={[styles.sendButton, (!inputText.trim() || isStreaming) && styles.sendDisabled]}
              onPress={() => { handleSend(); inputRef.current?.focus(); }}
              disabled={!inputText.trim() || isStreaming}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  welcomeIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 28,
  },
  suggestionsGrid: {
    width: '100%',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
    gap: 8,
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Colors.signalTeal,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bubbleTextUser: { color: '#fff' },
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(15, 34, 64, 0.95)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.signalTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
});
