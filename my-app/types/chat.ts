import { Message } from "./message";
import { User } from "./user";


export interface Member {
  id: string;
  userId: string;
  chatId: string;
  joinedAt: string;
  user: User;
}

export interface Chat {
  id: string ;
  name: string | null;
  isGroup: boolean;
  members: Member[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
}
