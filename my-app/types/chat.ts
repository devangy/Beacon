export interface User {
  id: string;
  username: string;
  avatarUrl: string;
  createdAt?: string;
}

export interface Member {
  id: string;
  userId: string;
  chatId: string;
  joinedAt: string;
  user: User;
}

export interface Chat {
  id: string;
  name: string | null;
  isGroup: boolean;
  members: Member[];
  createdAt: string;
  updatedAt: string;

  imageUrl?: string;
}
