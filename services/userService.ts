import { User } from '@/types/user';
import { getDocuments } from './documentService';
import { mockMessages } from './chatService'; // Replace this with real messages fetch if needed

export async function getUserStats(userId: string): Promise<{ documents: number; messages: number }> {
  try {
    const userDocuments = await getDocuments(userId);

    // NOTE: mockMessages is still used here. Replace with real message fetching if applicable.
    const userMessages = mockMessages.filter(msg => msg.userId === userId && msg.sender === 'user');

    return {
      documents: userDocuments.length,
      messages: userMessages.length,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return { documents: 0, messages: 0 };
  }
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
  return new Promise((resolve) => {
    setTimeout(() => {
      // In real app: update user in database
      resolve({ id: userId, name: data.name || '', email: data.email || '' });
    }, 1000);
  });
}
