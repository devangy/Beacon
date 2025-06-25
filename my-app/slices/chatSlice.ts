import { createAction, createSlice, PayloadAction } from "@reduxjs/toolkit";

import { Chat } from "@/types/chat";

// chats state with chatId mapped to a single chat detail like name chat image url etc
interface Chats {
  [chatId: string]: Chat[];
}

const initialState: Chats = {};

const chatslice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    setUserChats: (state, action: PayloadAction<Chat[]>) => {
      action.payload.forEach((chat) => {  
        if (!state[chat.id]) {          // if chat id is not in our state  
          state[chat.id] = [];          // add chatid to state and initialize with empty array
        }
        state[chat.id].push(chat);      // push the chat to our chatid
      });
    },
  },
});
