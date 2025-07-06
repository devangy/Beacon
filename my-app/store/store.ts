import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/slices/authSlice'
import chatReducer from '@/slices/chatSlice'
import messageReducer from '@/slices/messageSlice'
import searchReducer from '@/slices/searchSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    message: messageReducer,
    search: searchReducer,
  }
})

// Get the type of our store variable
export type AppStore = typeof store
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = AppStore['dispatch']