import { useDispatch } from "react-redux";
import { setResume, setParsedData } from "../store/resumeUploadSlice";
import axios from "axios";

const ResumeUpload = () => {
  const dispatch = useDispatch();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const file = event.target.files[0];

    dispatch(setResume(file));

    // 发送到后端解析
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload_resume/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(setParsedData(response.data.parsed_resume));
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold">Upload Resume</h2>
      <input type="file" accept=".txt" onChange={handleUpload} className="mt-4" />
    </div>
  );
};

export default ResumeUpload;
