import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Chat } from "@/types/chat";
import { User } from "@/types/user";

// initial chat state here where im normalize state shape by grouping them together with byId and allIds
//refer to  https://redux.js.org/usage/structuring-reducers/normalizing-state-shape => #Relationships and Tables
interface chatState  {
  chat:{
    byId: Record<string, Chat>
    allIds: string[]
  }
  selectedChatId: string | null;
  otherMember: User | null
};


const initialState: chatState = {
  chat: {
    byId: {},
    allIds: [],
  },
  selectedChatId: null,
  otherMember: null,
};

const chatslice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setUserChats: (state, action: PayloadAction<Chat[]>) => {
      action.payload.forEach((chat) => {
        state.chat.byId[chat.id] = chat;
        if(!state.chat.allIds.includes(chat.id)) {
          state.chat.allIds.push(chat.id)
        }
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
