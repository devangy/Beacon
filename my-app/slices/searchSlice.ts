// redux/searchSlice.ts
import { createSlice } from '@reduxjs/toolkit';

const searchSlice = createSlice({
  name: 'search',
  initialState: { searchBoxOpen: false },
  reducers: {
    toggleSearchBox: (state) => {
      state.searchBoxOpen = !state.searchBoxOpen;
    },
    setSearchBoxOpen: (state, action) => {
      state.searchBoxOpen = action.payload;
    }
  }
});

export const { toggleSearchBox, setSearchBoxOpen } = searchSlice.actions;
export default searchSlice.reducer;
