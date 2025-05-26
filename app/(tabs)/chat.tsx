import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Send, FileText } from 'lucide-react-native';
import { Message } from '../../types/chat.ts';
import { getChatHistory, sendMessage } from '../../services/chatService.ts';
import MessageItem from '../../components/MessageItem.tsx';
import EmptyState from '../../components/EmptyState.tsx';
import Animated, { FadeIn } from 'react-native-reanimated';
import React from 'react';

interface ThemeColors {
  background: string;
  card: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
}

export default function ChatScreen() {
  const { documentId, documentTitle } = useLocalSearchParams<{ documentId?: string, documentTitle?: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  const styles = getStyles(colors);

  const loadChatHistory = async () => {
    if (!documentId || !user) {
      setInitialLoading(false);
      return;
    }
    
    try {
      const history = await getChatHistory(documentId, user.id);
      setMessages(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, [documentId, user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !documentId || !user) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      documentId: documentId,
      userId: user.id,
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    setSending(true);
    
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Simulating AI response delay
      const aiResponse = await sendMessage(newMessage, documentId, user.id);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        documentId: documentId,
        userId: user.id,
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // Scroll to bottom after AI response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, there was an error processing your message. Please try again.',
        sender: 'system',
        timestamp: new Date().toISOString(),
        documentId: documentId,
        userId: user.id,
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!documentId) {
    return (
      <View style={styles.container}>
        <EmptyState 
          icon={<FileText size={64} color={colors.textSecondary} />}
          title="No document selected"
          message="Please select a document from the Documents tab to start chatting"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.documentHeader}>
        <FileText size={20} color={colors.primary} />
        <Text style={styles.documentTitle} numberOfLines={1}>
          {documentTitle || 'Document'}
        </Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Animated.View entering={FadeIn.duration(300)}>
            <MessageItem message={item} />
          </Animated.View>
        )}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              Ask any question about {documentTitle}
            </Text>
          </View>
        }
      />
      
      {sending && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>AI is thinking...</Text>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          placeholderTextColor={colors.textSecondary}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Send size={20} color={!newMessage.trim() ? colors.textSecondary : '#fff'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  documentTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 16,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
  emptyChat: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyChatText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});