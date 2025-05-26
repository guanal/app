import { supabase } from './supabase.ts'; // Adjust the import path as per your project
import { Message } from '../types/chat.ts'; // Adjust the import path as per your project

// Define the Supabase row type (adjust if your table structure differs)
type ChatRow = {
  id: string;
  content: string;
  role: 'user' | 'ai' | 'system';
  created_at: string;
  document_id: string;
  user_id: string;
};

/**
 * Fetches the chat history for a given document and user from Supabase.
 * @param documentId - The ID of the document.
 * @param userId - The ID of the user.
 * @returns A promise resolving to an array of Message objects.
 */
export async function getChatHistory(documentId: string, userId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error.message);
    throw new Error('Failed to fetch chat history');
  }

  return (data as ChatRow[]).map((msg) => ({
    id: msg.id,
    content: msg.content,
    sender: msg.role,
    timestamp: msg.created_at,
    documentId: msg.document_id,
    userId: msg.user_id,
  }));
}

/**
 * Sends a user message and retrieves an AI response via a Supabase edge function,
 * saving both to the database.
 * @param content - The user's message content.
 * @param documentId - The ID of the document.
 * @param userId - The ID of the user.
 * @returns A promise resolving to the AI's Message object.
 */
export async function sendMessage(
  content: string,
  documentId: string,
  userId: string
): Promise<Message> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or Anon Key is missing from environment variables.');
  }

  try {
    // Step 1: Insert the user message into Supabase
    const { data: userMessageData, error: userMessageError } = await supabase
      .from('chats')
      .insert({
        content,
        role: 'user',
        document_id: documentId,
        user_id: userId,
      })
      .select()
      .single();

    if (userMessageError) {
      console.error('Error inserting user message:', userMessageError.message);
      throw new Error('Failed to save user message');
    }

    const userMessage: Message = {
      id: userMessageData.id,
      content: userMessageData.content,
      sender: 'user',
      timestamp: userMessageData.created_at,
      documentId: userMessageData.document_id,
      userId: userMessageData.user_id,
    };

    // Step 2: Call the Supabase edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentId,
        message: content,
        userId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error response:', errorText);
      throw new Error('Failed to get AI response from Supabase Edge Function');
    }

    const result = await response.json();
    console.log('Edge function response:', result);

    // Step 3: Handle the response format
    if (result.response) {
      // Expected format: save the AI response
      const aiResponse = result.response;
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from('chats')
        .insert({
          content: aiResponse,
          role: 'ai',
          document_id: documentId,
          user_id: userId,
        })
        .select()
        .single();

      if (aiMessageError) {
        console.error('Error inserting AI message:', aiMessageError.message);
        throw new Error('Failed to save AI message');
      }

      return {
        id: aiMessageData.id,
        content: aiMessageData.content,
        sender: 'ai',
        timestamp: aiMessageData.created_at,
        documentId: aiMessageData.document_id,
        userId: aiMessageData.user_id,
      };
    } else if (result.message === 'Document processed') {
      // Workaround for unexpected response
      console.warn(
        'Edge function returned "Document processed" without an AI response. ' +
        'Please check the edge function implementation at /functions/v1/chat.'
      );
      const placeholderResponse = 'AI is processing your request. Please try again later.';
      return {
        id: Date.now().toString(), // Temporary ID
        content: placeholderResponse,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        documentId,
        userId,
      };
    } else {
      // Other unexpected formats
      console.error('Invalid AI response format:', result);
      throw new Error('Invalid AI response format');
    }
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
}