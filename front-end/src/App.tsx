import ResumeUpload from "./components/ResumeUpload";


export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">Smart Hire</h1>
      <ResumeUpload />
    </div>
  );
}
