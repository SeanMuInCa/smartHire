import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { setJobs } from "../store/jobSearchSlice";
import axios from "axios";

const JobSearch = () => {
  const dispatch = useDispatch();
  const jobs = useSelector((state: RootState) => state.jobSearch.jobs);
  const [query, setQuery] = useState("");

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/search_jobs/?query=${query}`);
      dispatch(setJobs(response.data.jobs));
    } catch (error) {
      console.error("Job search failed", error);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold">Search Jobs</h2>
      <input
        type="text"
        placeholder="Enter job title..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mt-4 p-2 border rounded w-full"
      />
      <button onClick={handleSearch} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
        Search
      </button>

      {jobs.length > 0 && (
        <ul className="mt-6">
          {jobs.map((job, index) => (
            <li key={index} className="p-2 border-b">
              <h3 className="font-semibold">{job.title}</h3>
              <p>{job.company} - {job.location}</p>
              <p className="text-sm text-gray-500">Match: {job.similarity.toFixed(2)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobSearch;
