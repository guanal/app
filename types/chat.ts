export type SenderType = 'user' | 'ai' | 'system';

export interface Message {
  id: string;
  content: string;
  sender: SenderType;
  timestamp: string;
  documentId: string;
  userId: string;
}