import { supabase } from './supabase.ts';
import { Document } from '../types/document.ts';
import { Platform } from 'react-native';

// Interface to match the database schema
interface DbDocument {
  id: string;
  title: string;
  type: string;  // Updated from file_type to type
  file_size: number;
  created_at: string;
  user_id: string;
  content: string | null;
}

export async function getDocuments(userId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((doc: DbDocument) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,  // Updated from doc.file_type to doc.type
    size: doc.file_size,
    uploadDate: doc.created_at,
    userId: doc.user_id,
    content: doc.content || '',
  }));
}

export async function uploadDocument(
  file: { name: string; type: string; size: number; uri: string },
  userId: string
): Promise<Document> {
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  // 1. Prepare upload data
  let uploadData;
  if (Platform.OS === 'web') {
    const response = await fetch(file.uri);
    uploadData = await response.blob();
  } else {
    uploadData = file.uri; // On native, uri is used directly
  }

  // 2. Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(filePath, uploadData, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    throw uploadError;
  }

  // 3. Extract content if file is plain text
  let content = '';
  if (file.type === 'text/plain') {
    try {
      content = await readFileContent(file.uri);
      content = content.replace(/\0/g, ''); // Remove null characters
    } catch (err) {
      console.warn('File read error:', err);
    }
  }

  // 4. Insert document record in Supabase DB
  const { data, error } = await supabase
    .from('documents')
    .insert({
      title: file.name,
      type: file.type,  // Updated from file_type to type
      file_size: file.size,
      file_path: filePath,
      user_id: userId,
      content: content,
    })
    .select()
    .single();

  if (error) {
    console.error('Insert error:', error);
    throw error;
  }

  // 5. Trigger document processing edge function (optional)
  try {
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
      console.warn('Edge function failed:', await response.text());
    }
  } catch (err) {
    console.warn('Edge function request failed:', err);
  }

  // 6. Return the document
  return {
    id: data.id,
    title: data.title,
    type: data.type,  // Updated from data.file_type to data.type
    size: data.file_size,
    uploadDate: data.created_at,
    userId: data.user_id,
    content: data.content || '',
  };
}

// In documentService.ts
export async function deleteDocument(documentId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  if (error) {
    console.error('Supabase delete error:', error); // Log Supabase errors
    throw error;
  }
  console.log('Document deleted from Supabase:', documentId); // Log success
}
// Utility to read file content (for plain text only)
async function readFileContent(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return await response.text();
  } else {
    // Add native support if needed, e.g., using 'react-native-fs'
    return '';
  }
}