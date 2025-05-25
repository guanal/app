import { supabase } from './supabase';
import { Document } from '@/types/document';
import { Platform } from 'react-native';

export async function getDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(doc => ({
    id: doc.id,
    title: doc.title,
    type: doc.file_type,
    size: doc.file_size,
    uploadDate: doc.created_at,
    userId: doc.user_id,
    content: doc.content, // corrected from "context"
  }));
}

export async function uploadDocument(
  file: { name: string; type: string; size: number; uri: string },
  userId: string
): Promise<Document> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  // 1. Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, file.uri, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw uploadError;
  }

  // 2. Extract content if file is plain text
  let content = '';
  if (file.type === 'text/plain') {
    try {
      content = await readFileContent(file.uri);
      content = content.replace(/\u0000/g, ''); // remove null characters
    } catch (err) {
      console.warn('File read error:', err);
    }
  }

  // 3. Insert document record in Supabase DB
  const { data, error } = await supabase
    .from('documents')
    .insert({
      title: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: filePath,
      user_id: userId,
      content: content || null, // only insert content if available
    })
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    throw error;
  }

  // 4. Trigger document processing edge function (optional)
  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/process-document`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document: {
        id: data.id,
        content,
        title: file.name,
      },
    }),
  });

  if (!response.ok) {
    console.warn('Edge function failed to process document');
  }

  // 5. Return the document
  return {
    id: data.id,
    title: data.title,
    type: data.file_type,
    size: data.file_size,
    uploadDate: data.created_at,
    userId: data.user_id,
    content: data.content,
  };
}

export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  if (error) throw error;
}

// Utility to read file content on web (for plain text only)
async function readFileContent(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return await response.text();
  } else {
    // You can add native support using 'react-native-fs' if needed
    return '';
  }
}
