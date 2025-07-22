import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Chat } from "@/types/chat";
import { User } from "@/types/user";
type chatState = {
  chats: Record<string, Chat>;
  selectedChatId: string | null;
  otherMember: User | null
};

const initialState: chatState = {
  chats: {},
  selectedChatId: null,
  otherMember: null,
};

const chatslice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    setUserChats: (state, action: PayloadAction<Chat[]>) => {
      action.payload.forEach((chat) => {
        state.chats[chat.id] = chat;
      });
    },

    setChatId: (state, action: PayloadAction<string>) => {
      state.selectedChatId = action.payload;
    },

    setOtherMember: (state, action: PayloadAction<User>) => {
      state.otherMember = action.payload;
    },
  },
});

export const { setUserChats, setChatId, setOtherMember } = chatslice.actions;
export default chatslice.reducer;
