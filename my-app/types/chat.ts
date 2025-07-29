import { Message } from "./message";
import { User } from "./user";


export interface Member {
  id: string;
  name: string;
  username: string;
  userId: string;
  chatId: string;
  memberId: string;
  joinedAt: string;
  avatarUrl: string
  user: User;
}

export interface Chat {
  id: string ;
  name: string | null;
  isGroup: boolean;
  members: Member[];
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
}
