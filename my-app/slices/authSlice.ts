import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import { authUser } from "@/types/authUser";
import { act } from "react";

// gonna define the initial type of my authUser state and functions aka reducers to update the state
const initialState: authUser = {
  accessToken: null,
  userId: null
};

const authUserSlice =  createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<authUser>) => {
      state.accessToken = action.payload.accessToken;
      state.userId = action.payload.userId;
    },

    clearAuthUser : (state) => {
      state.accessToken = null;
      state.userId = null;
    }
  }
})


export const { setAuthUser, clearAuthUser } = authUserSlice.actions;
export default authUserSlice.reducer;
