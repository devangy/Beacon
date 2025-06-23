import { createAction, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Message } from "@/types/message";


// messages state is an object where key is chatId and value is an array of messages
interface MessagesState {
    [chatId: string]: Message[];
}

const initialState: MessagesState = {};

const messageSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        addNewMessage: (state, action : PayloadAction<{chatId: string , message: Message}>) => {
            const { chatId, message} = action.payload
            if (!state[chatId]) {
                state[chatId] = []
            }
            state[chatId].push(message);
        },
    }
})