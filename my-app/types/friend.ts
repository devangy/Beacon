export interface Friend {
  id: string;
  name: string;
  avatarUrl?: string;
} 

type FriendStatus = 'Online' | 'Away' | 'Offline';
