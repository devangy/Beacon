import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import { authUser } from "@/types/user";

// gonna define the initial type of my authUser state and functions aka reducers to update the state
const initialState: authUser = {
  userId: null,
  token: null,
}

const authUserSlice =  createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser: (state, action: PayloadAction<authUser>) => {
      state.userId = action.payload.userId;
      state.token = action.payload.token;
    },

    clearAuthUser : (state) => {
      state.userId = null;
      state.token = null;
    }
  }
})


export const { setAuthUser, clearAuthUser } = authUserSlice.actions;
export default authUserSlice.reducer;
