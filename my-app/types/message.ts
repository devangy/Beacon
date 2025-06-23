export interface Message {
    id : string;
    content: string;
    senderId: string;
    chatId: string;
    createdAt: Date;
}