import { useDispatch, useSelector } from "react-redux";
import { setParsedData, setMatchedJobs } from "../store/resumeUploadSlice";
import axiosService from "../services";
import { useState } from "react";
import { RootState } from "../store";
import Loading from "./Loading";
import { FiInfo } from 'react-icons/fi';


const ResumeUpload = () => {
  const dispatch = useDispatch();
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'matching' | 'complete'>('idle');
  const parsedData = useSelector((state: RootState) => state.resumeUpload.parsedData);
  const matchedJobs = useSelector((state: RootState) => state.resumeUpload.matchedJobs);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const file = event.target.files[0];

    setUploadStatus('uploading');
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosService.post("/upload_resume/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      dispatch(setParsedData(response.data.parsed_resume));
      dispatch(setMatchedJobs(response.data.matched_jobs));

      setUploadStatus('analyzing');
      setTimeout(() => {
        setUploadStatus('matching');
      }, 2000);
      setTimeout(() => {
        setUploadStatus('complete');
      }, 5000);

    } catch (error) {
      console.error("Upload failed", error);
      setUploadStatus('idle');
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg grid relative">
      {uploadStatus !== 'idle' && uploadStatus !== 'complete' && (
        <div className="absolute inset-0 bg-gray-800/70 flex flex-col items-center justify-center z-10">
          <Loading />
          <p className="mt-4 text-white text-lg font-semibold tracking-wide">
            {uploadStatus === 'uploading' && 'Uploading resume...'}
            {uploadStatus === 'analyzing' && 'Analyzing resume...'}
            {uploadStatus === 'matching' && 'Matching jobs...'}
          </p>
        </div>
      )}

      <div className={`${matchedJobs.length > 0 && uploadStatus === 'complete' ? 'grid grid-cols-5' : ''} w-full`}>
        <div className={`${matchedJobs.length > 0 && uploadStatus === 'complete' ? 'col-span-3 border-r pr-6' : 'w-full'}`}>

          {!parsedData ? (
            <>
              <h2 className="text-xl font-semibold">Upload Resume</h2>
              <input
                type="file"
                accept=".txt, .pdf"
                onChange={handleUpload}
                className="mt-4"
                disabled={uploadStatus !== 'idle' && uploadStatus !== 'complete'}
              />
              <div className="flex items-center mt-2 text-sm bg-orange-50 text-orange-700 p-2 rounded-md border border-orange-200">
                <FiInfo className="mr-2 flex-shrink-0" />
                <p>Only support .txt and .pdf files</p>
              </div>
            </>
          ) : (
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Parsed Resume</h3>
              <p><strong>Name:</strong> {parsedData.name}</p>
              <p><strong>Email:</strong> {parsedData.email}</p>
              <p><strong>Phone:</strong> {parsedData.phone}</p>
              <p><strong>Education:</strong> {parsedData.education?.join(", ")}</p>
              <p><strong>Skills:</strong> {parsedData.skills?.join(", ")}</p>
            </div>
          )}
        </div>

        {(matchedJobs.length > 0 && uploadStatus === 'complete') && (
          <div className="col-span-2 pl-6">
            <h3 className="text-lg font-semibold">Matched Jobs</h3>
            <ul>
              {matchedJobs.map((job, index) => (
                <li key={index} className="mt-2 border-b pb-2">
                  <p><strong>Title:</strong> {job.title}</p>
                  <p><strong>Company:</strong> {job.company}</p>
                  <p><strong>Location:</strong> {job.location}</p>
                  <p><strong>Match Rate:</strong> {(job.similarity * 100).toFixed(1)}%</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;
