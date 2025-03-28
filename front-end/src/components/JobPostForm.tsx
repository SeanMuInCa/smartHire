import { useState } from "react";
import axiosService from "../services";

interface JobRequirement {
  title: string;
  requiredSkills: string[];
  experience: string;
  education: string;
  location: string;
  description: string;
}

interface MatchedCandidate {
  id: number;
  name: string;
  education: string;
  skills: string[];
  similarity: number;
}

const JobPostForm = () => {
  const [formData, setFormData] = useState<JobRequirement>({
    title: "",
    requiredSkills: [],
    experience: "",
    education: "",
    location: "",
    description: ""
  });
  
  const [matchedCandidates, setMatchedCandidates] = useState<MatchedCandidate[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await axiosService.post("/match_candidates/", formData);
      setMatchedCandidates(response.data.matched_candidates || []);
    } catch (error) {
      console.error("Failed to match candidates:", error);
      setMatchedCandidates([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Post Job Requirements</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Job Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1">Required Skills</label>
          <input
            type="text"
            placeholder="Enter skills separated by commas"
            onChange={e => setFormData({
              ...formData, 
              requiredSkills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            })}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1">Required Education</label>
          <select
            value={formData.education}
            onChange={e => setFormData({...formData, education: e.target.value})}
            className="w-full border rounded p-2"
          >
            <option value="">Select Education Level</option>
            <option value="Bachelor">Bachelor's Degree</option>
            <option value="Master">Master's Degree</option>
            <option value="PhD">PhD</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Location</label>
          <input
            type="text"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block mb-1">Job Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full border rounded p-2 h-32"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {isSubmitting ? "Matching..." : "Find Matching Candidates"}
        </button>
      </form>

      {matchedCandidates && matchedCandidates.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Matched Candidates</h3>
          <div className="space-y-4">
            {matchedCandidates.map((candidate) => (
              <div key={candidate.id} className="border rounded p-4">
                <p><strong>Name:</strong> {candidate.name}</p>
                <p><strong>Match Rate:</strong> {(candidate.similarity * 100).toFixed(1)}%</p>
                <p><strong>Education:</strong> {candidate.education}</p>
                <p><strong>Skills:</strong> {candidate.skills.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobPostForm;
