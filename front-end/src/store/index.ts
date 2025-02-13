import { configureStore } from "@reduxjs/toolkit";
import jobReducer from "./jobSearchSlice";
import resumeReducer from "./resumeUploadSlice";

export const store = configureStore({
  reducer: {
    jobSearch: jobReducer,
    resumeUpload: resumeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
