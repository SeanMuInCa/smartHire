import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../layouts/Layout";
import ResumeUpload from "../components/ResumeUpload";
import JobPostForm from "../components/JobPostForm";
import TextResumeParser from "../components/TextResumeParser";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <ResumeUpload />
      },
      {
        path: "/employer",
        element: <JobPostForm />
      },
      {
        path: "/text-parser",
        element: <TextResumeParser />
      }
    ]
  }
]);

export default router; 