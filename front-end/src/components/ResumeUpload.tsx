import { useDispatch, useSelector } from "react-redux";
import { setResume, setParsedData, setMatchedJobs } from "../store/resumeUploadSlice";
import axios from "axios";
import { useState } from "react";
import { RootState } from "../store";

const ResumeUpload = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const parsedData = useSelector((state: RootState) => state.resumeUpload.parsedData);
  const matchedJobs = useSelector((state: RootState) => state.resumeUpload.matchedJobs);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const file = event.target.files[0];

    setLoading(true);
    try {
      const base64 = await convertFileToBase64(file);
      dispatch(setResume(base64));

      // 发送 Base64 到后端
      const response = await axios.post("http://127.0.0.1:8001/upload_resume/", { file: base64 });

      dispatch(setParsedData(response.data.parsed_resume));
      dispatch(setMatchedJobs(response.data.matched_jobs)); // ✅ 存储匹配的职位

    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold">Upload Resume</h2>
      <input type="file" accept=".txt" onChange={handleUpload} className="mt-4" />
      {loading && <p className="text-gray-500 mt-2">Uploading...</p>}

      {parsedData && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Parsed Resume</h3>
          <p><strong>Name:</strong> {parsedData.name}</p>
          <p><strong>Email:</strong> {parsedData.email}</p>
          <p><strong>Phone:</strong> {parsedData.phone}</p>
          <p><strong>Education:</strong> {parsedData.education?.join(", ")}</p>
          <p><strong>Skills:</strong> {parsedData.skills?.join(", ")}</p>
        </div>
      )}

      {matchedJobs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Matched Jobs</h3>
          <ul>
            {matchedJobs.map((job, index) => (
              <li key={index} className="mt-2 border-b pb-2">
                <p><strong>Title:</strong> {job.title}</p>
                <p><strong>Company:</strong> {job.company}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Similarity:</strong> {job.similarity.toFixed(3)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
