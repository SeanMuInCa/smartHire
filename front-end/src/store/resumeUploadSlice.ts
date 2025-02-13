import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ResumeState {
  file: File | null;
  parsedData: any | null;
}

const initialState: ResumeState = {
  file: null,
  parsedData: null,
};

const resumeSlice = createSlice({
  name: "resumeUpload",
  initialState,
  reducers: {
    setResume: (state, action: PayloadAction<File>) => {
      state.file = action.payload;
    },
    setParsedData: (state, action: PayloadAction<any>) => {
      state.parsedData = action.payload;
    },
  },
});

export const { setResume, setParsedData } = resumeSlice.actions;
export default resumeSlice.reducer;
