import ResumeUpload from "./components/ResumeUpload";
// import JobSearch from "./components/JobSearch";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">AI Job Matcher</h1>
      <ResumeUpload />
    </div>
  );
}
