import { createAction, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Message } from "@/types/message";

// messages state is an object where key is chatId and value is an array of messages
// interface MessagesState {
//     [chatId: string]: Message[];
// }

interface MessagesState {
    messages: {
        byId: Record<string, Message[]>;
    };
}

const initialState: MessagesState = {
    messages: {
        byId: {},
    },
};

const messageSlice = createSlice({
    name: "messages",
    initialState,
    reducers: {
        setMessagesByChatId: (
            state,
            action: PayloadAction<{ chatId: string; messages: Message[] }>,
        ) => {
            const { chatId, messages } = action.payload;
            state.messages.byId[chatId] = messages;
        },
        addNewMessage: (
            state,
            action: PayloadAction<{ chatId: string; message: Message }>,
        ) => {
            const { chatId, message } = action.payload;
            if (!state.messages.byId[chatId]) {
                state.messages.byId[chatId] = [];
            }
            // Check if message already exists to prevent duplicates
            const messageExists = state.messages.byId[chatId].some(
                (msg) => msg.id === message.id,
            );

            if (!messageExists) {
                state.messages.byId[chatId].push(message);
            }
        },
    },
});

export const { addNewMessage, setMessagesByChatId } = messageSlice.actions;
export default messageSlice.reducer;
