import { User } from '../types/user.ts';
import { getDocuments } from './documentService.ts';
import { Message } from './chatService.ts';

/**
 * Get user statistics including document and message count.
 */
export async function getUserStats(userId: string): Promise<{ documents: number; messages: number }> {
  try {
    const userDocuments = await getDocuments(userId);

    // TODO: Replace with actual messages source when available
    const userMessages: Message[] = []; // No mockMessages available

    return {
      documents: userDocuments.length,
      messages: userMessages.length,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { documents: 0, messages: 0 };
  }
}

/**
 * Simulate updating user profile (mock function).
 * Replace with real DB logic when ready.
 */
export async function updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
  // Simulate async DB update delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    id: userId,
    name: data.name || '',
    email: data.email || '',
    avatarUrl: data.avatarUrl ?? null,
  };
}
