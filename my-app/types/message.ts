export interface Message {
    id: string;
    payload: EncryptedData;
    senderId: string;
    chatId: string;
    createdAt: string;
}

type EncryptedData = {
    iv: string;
    tag: string;
    content: string;
};
