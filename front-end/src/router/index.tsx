import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../layouts/Layout";
import ResumeUpload from "../components/ResumeUpload";
import JobPostForm from "../components/JobPostForm";

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
      }
    ]
  }
]);

export default router; 