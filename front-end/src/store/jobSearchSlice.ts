import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Job {
  title: string;
  company: string;
  location: string;
  similarity: number;
}

interface JobState {
  jobs: Job[];
}

const initialState: JobState = {
  jobs: [],
};

const jobSearchSlice = createSlice({
  name: "jobSearch",
  initialState,
  reducers: {
    setJobs: (state, action: PayloadAction<Job[]>) => {
      state.jobs = action.payload;
    },
  },
});

export const { setJobs } = jobSearchSlice.actions;
export default jobSearchSlice.reducer;
