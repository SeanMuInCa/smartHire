import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ResumeState {
  base64: string | null;
  parsedData: any | null;
  matchedJobs: any[]; // 存储匹配到的职位
}

const initialState: ResumeState = {
  base64: null,
  parsedData: null,
  matchedJobs: [],
};

const resumeSlice = createSlice({
  name: "resumeUpload",
  initialState,
  reducers: {
    setResume: (state, action: PayloadAction<string>) => {
      state.base64 = action.payload; // 存 Base64 编码
    },
    setParsedData: (state, action: PayloadAction<any>) => {
      state.parsedData = action.payload;
    },
    setMatchedJobs: (state, action: PayloadAction<any[]>) => {
      state.matchedJobs = action.payload;
    },
  },
});

export const { setResume, setParsedData, setMatchedJobs } = resumeSlice.actions;
export default resumeSlice.reducer;
