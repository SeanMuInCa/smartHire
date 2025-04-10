import ResumeUpload from "./components/ResumeUpload";
import TextResumeParser from "./components/TextResumeParser";
import { useState } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'text-parser'>('upload');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-6">Smart Hire</h1>
      
      <div className="mb-6 flex space-x-4">
        <button 
          className={`px-4 py-2 rounded-md ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('upload')}
        >
          标准上传解析
        </button>

      </div>
      
      {activeTab === 'upload' ? <ResumeUpload /> : <TextResumeParser />}
    </div>
  );
}
