import { supabase } from './supabase';
import { Message } from '@/types/chat';

export async function getChatHistory(documentId: string, userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return data.map(msg => ({
    id: msg.id,
    content: msg.content,
    sender: msg.role as 'user' | 'ai' | 'system',
    timestamp: msg.created_at,
    documentId: msg.document_id,
    userId: msg.user_id,
  }));
}

export async function sendMessage(
  content: string,
  documentId: string,
  userId: string
): Promise<Message> {
  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentId,
      message: content,
      userId,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get AI response');
  }

  const { response: aiResponse } = await response.json();

  return {
    id: Date.now().toString(),
    content: aiResponse,
    sender: 'ai',
    timestamp: new Date().toISOString(),
    documentId,
    userId,
  };
}