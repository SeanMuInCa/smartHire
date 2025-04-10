import { useState } from "react";
import axiosService from "../services";
import { MdWork, MdLocationOn, MdSchool, MdDescription } from "react-icons/md";
import { FaUserCheck, FaSearch, FaSpinner, FaPercentage, FaExclamationTriangle } from "react-icons/fa";
import { BsStars, BsGearFill } from "react-icons/bs";
import { HiLightningBolt } from "react-icons/hi";

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
  const [error, setError] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");

  const handleSkillAdd = () => {
    if (!skillInput.trim()) return;
    
    const newSkills = [...formData.requiredSkills];
    skillInput.split(',')
      .map(skill => skill.trim())
      .filter(Boolean)
      .forEach(skill => {
        if (!newSkills.includes(skill)) {
          newSkills.push(skill);
        }
      });
    
    setFormData({...formData, requiredSkills: newSkills});
    setSkillInput("");
  };

  const handleSkillRemove = (index: number) => {
    const newSkills = [...formData.requiredSkills];
    newSkills.splice(index, 1);
    setFormData({...formData, requiredSkills: newSkills});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 验证教育背景
    if (!formData.education) {
      setError("Please select the required education level");
      return;
    }

    // 验证技能
    if (formData.requiredSkills.length === 0) {
      setError("Please enter at least one required skill");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await axiosService.post("/match_candidates/", formData);
      setMatchedCandidates(response.data.matched_candidates || []);
    } catch (error) {
      console.error("Failed to match candidates:", error);
      setMatchedCandidates([]);
      setError("Matching candidates failed, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPercentageColorClass = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-blue-500";
    if (percentage >= 40) return "text-yellow-500";
    return "text-gray-500";
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="container mx-auto max-w-5xl">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center">
              <MdWork className="mr-3 text-3xl" /> Employer Portal
            </h1>
            <p className="mt-2 opacity-90">Post job requirements and find matching candidates</p>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center text-gray-700 font-medium mb-2">
                      <MdWork className="mr-2" /> Position
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="describe the position"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-gray-700 font-medium mb-2">
                      <BsGearFill className="mr-2" /> Required Skills <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-l-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter skills, separate multiple skills with commas"
                      />
                      <button
                        type="button"
                        onClick={handleSkillAdd}
                        className="bg-blue-500 text-white px-4 rounded-r-lg hover:bg-blue-600 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    
                    {formData.requiredSkills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formData.requiredSkills.map((skill, index) => (
                          <span 
                            key={index}
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => handleSkillRemove(index)}
                              className="ml-2 text-blue-800 hover:text-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center text-gray-700 font-medium mb-2">
                      <MdSchool className="mr-2" /> Required Education <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={formData.education}
                      onChange={e => setFormData({...formData, education: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      required
                    >
                      <option value="">Select Education Level</option>
                      <option value="Bachelor">Bachelor's Degree</option>
                      <option value="Master">Master's Degree</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center text-gray-700 font-medium mb-2">
                      <MdLocationOn className="mr-2" /> Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="E.g., New York, Remote, etc."
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-gray-700 font-medium mb-2">
                      <MdDescription className="mr-2" /> Job Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg p-3 h-[155px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Describe the job responsibilities and requirements..."
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 flex items-start">
                  <FaExclamationTriangle className="text-red-500 mr-3 mt-1 flex-shrink-0" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 transition-all flex items-center text-lg font-medium shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Matching...
                    </>
                  ) : (
                    <>
                      <FaSearch className="mr-2" />
                      Find Matching Candidates
                    </>
                  )}
                </button>
              </div>
            </form>

            {matchedCandidates && matchedCandidates.length > 0 ? (
              <div className="mt-10 animate-fadeIn">
                <h3 className="text-xl font-bold text-gray-800 flex items-center mb-6">
                  <HiLightningBolt className="mr-2 text-yellow-500" /> Matching Results ({matchedCandidates.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {matchedCandidates.map((candidate) => (
                    <div 
                      key={candidate.id} 
                      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                            <FaUserCheck />
                          </div>
                          <h4 className="font-semibold text-lg">{candidate.name}</h4>
                        </div>
                        <div className={`flex items-center font-bold ${getPercentageColorClass(candidate.similarity * 100)}`}>
                          <FaPercentage className="mr-1" />
                          {(candidate.similarity * 100).toFixed(1)}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-gray-700">
                        <p className="flex items-start">
                          <MdSchool className="mr-2 mt-1 flex-shrink-0" />
                          <span>{candidate.education || 'No education information provided'}</span>
                        </p>
                        
                        <div className="flex items-start">
                          <BsStars className="mr-2 mt-1 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {candidate.skills.map((skill, idx) => (
                              <span 
                                key={idx} 
                                className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : matchedCandidates && matchedCandidates.length === 0 && !isSubmitting ? (
              <div className="mt-8 text-center p-8 bg-gray-50 rounded-lg">
                <div className="flex justify-center text-gray-400 mb-3">
                  <FaSearch className="text-4xl" />
                </div>
                <p className="text-gray-500">No matching candidates found. Try adjusting your requirements.</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPostForm;
