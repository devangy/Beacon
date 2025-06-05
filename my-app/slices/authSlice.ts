import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";

// gonna define the initial type of my authUser state and functions aka reducers to update the state

interface AuthUser {
  userId: string | null;
  token: string | null;
}

const initialState: AuthUser = {
  userId: null,
  token: null,
}

export const authUserSlice =  createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<AuthUser>) => {
      state.userId = action.payload.userId;
      state.token = action.payload.token;
    },

    clearAuthUser : (state) => {
      state.userId = null;
      state.token = null;
    }
  }
})