import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Message } from '@/types/chat';
import { formatTime } from '@/utils/formatters';

interface MessageItemProps {
  message: Message;
}

export default function MessageItem({ message }: MessageItemProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  return (
    <View style={[
      styles.container, 
      isUser ? styles.userContainer : isSystem ? styles.systemContainer : styles.aiContainer
    ]}>
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessage : isSystem ? styles.systemMessage : styles.aiMessage
      ]}>
        <Text style={[
          styles.messageText,
          isUser ? styles.userText : isSystem ? styles.systemText : styles.aiText
        ]}>
          {message.content}
        </Text>
      </View>
      
      <Text style={styles.timestamp}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  aiContainer: {
    alignSelf: 'flex-start',
  },
  systemContainer: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  messageContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessage: {
    backgroundColor: colors.primary,
  },
  aiMessage: {
    backgroundColor: colors.card,
  },
  systemMessage: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: colors.text,
  },
  systemText: {
    color: colors.error,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});