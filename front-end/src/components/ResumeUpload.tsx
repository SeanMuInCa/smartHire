import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setParsedData, setMatchedJobs } from "../store/resumeUploadSlice";
import { parseResumeFromPdf } from "../utils/pdfParser";
import axiosService from "../services";
import { FiInfo, FiUpload, FiFileText, FiMapPin, FiCalendar, FiMail, FiPhone } from 'react-icons/fi';
import { BiBuildings, BiDollarCircle, BiTime } from 'react-icons/bi';
import { MdWork, MdSchool, MdPerson } from 'react-icons/md';
import { AiOutlineCloudUpload, AiOutlineFileSearch, AiOutlineThunderbolt } from 'react-icons/ai';
import { BsStars, BsLightningCharge, BsCheckCircleFill } from 'react-icons/bs';
import { HiOutlineDocumentText, HiOutlineClipboardCheck } from 'react-icons/hi';
import Loading from "./Loading";
import { RootState } from "../store";

interface Education {
  institution?: string;
  studyType: string;
  startDate?: string;
  endDate?: string;
  area?: string;
}

interface Skill {
  name: string;
}

interface Job {
  job_title: string;
  company: string;
  location?: string;
  job_description?: string;
  required_skills?: string;
  similarity: number;
  salary?: string;
  job_type?: string;
}

const ResumeUpload = () => {
  const dispatch = useDispatch();
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'analyzing' | 'matching' | 'complete'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  const parsedData = useSelector((state: RootState) => state.resumeUpload.parsedData);
  const matchedJobs = useSelector((state: RootState) => state.resumeUpload.matchedJobs);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const file = event.target.files[0];
    
    setUploadStatus('uploading');
    setError(null);
    await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadStatus('uploading');
      setError(null);
      await processFile(file);
    }
  };
  
  const processFile = async (file: File) => {
    try {
      // PDF 文件处理逻辑
      if (file.type === 'application/pdf') {
        setUploadStatus('analyzing');
        console.log('开始解析PDF文件:', file.name);
        
        const parsedResume = await parseResumeFromPdf(file);
        console.log('PDF解析结果:', parsedResume);
        
        dispatch(setParsedData(parsedResume));
        
        // 保存到后端数据库
        try {
          console.log('保存解析结果到后端数据库');
          const saveResponse = await axiosService.post("/save_resume/", parsedResume);
          console.log('保存结果:', saveResponse.data);
          
          if (saveResponse.data.error) {
            console.error('保存简历失败:', saveResponse.data.error);
          }
        } catch (error) {
          console.error('保存简历到数据库时发生错误:', error);
        }
        
        setUploadStatus('matching');
        console.log('发送技能列表到后端:', parsedResume.skills);
        
        const skillNames = parsedResume.skills.map(skill => skill.name);
        const response = await axiosService.post("/match_jobs/", {
          skills: skillNames.length > 0 ? skillNames : ['general']
        });
        
        console.log('后端匹配结果:', response.data);
        dispatch(setMatchedJobs(response.data.matched_jobs));
      } 
      // TXT 文件处理逻辑
      else if (file.type === 'text/plain') {
        setUploadStatus('analyzing');
        console.log('开始解析TXT文件:', file.name);
        
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await axiosService.post("/upload/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        
        if (response.data.error) {
          throw new Error(response.data.error);
        }
        
        console.log('TXT解析结果:', response.data);
        
        // 转换后端返回的数据格式以匹配前端期望的格式
        if (response.data.parsed_resume) {
          const { parsed_resume } = response.data;
          
          // 从教育文本中提取机构名称的函数
          const extractInstitution = (eduText: string): string | null => {
            // 移除前缀符号和空格
            const cleanText = eduText.replace(/^[-•*]\s*/, '').trim();
            console.log('清理后的教育文本:', cleanText);
            
            // 尝试匹配机构名称的模式
            const patterns = [
              /(?:at|from|in)\s+(.*?(?:University|College|Institute|School|Polytechnic))/i,
              /(.*?(?:University|College|Institute|School|Polytechnic))/i,
              /(.*?大学|.*?学院)/
            ];
            
            for (const pattern of patterns) {
              const match = cleanText.match(pattern);
              if (match && match[1]) {
                console.log('匹配到机构名称:', match[1].trim());
                return match[1].trim();
              }
            }
            
            console.log('未找到任何机构名称');
            return null;
          };
          
          // 从教育文本中提取学位类型的函数
          const extractDegreeType = (eduText: string): string => {
            // 移除前缀符号和空格
            const cleanText = eduText.replace(/^[-•*]\s*/, '').trim();
            
            // 尝试匹配完整的学位名称
            const patterns = [
              // 完整的学位匹配模式
              /(Bachelor of Science|Bachelor of Arts|Master of Science|Master of Arts|Doctor of Philosophy|Post-Graduate Diploma)(?:\s+in\s+[\w\s]+)?/i,
              // 简写形式的匹配模式
              /(B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|Ph\.?D\.?)(?:\s+in\s+[\w\s]+)?/i,
              // 中文学位匹配模式
              /(学士|硕士|博士)学位/
            ];
            
            for (const pattern of patterns) {
              const match = cleanText.match(pattern);
              if (match && match[0]) {
                console.log('匹配到完整学位名称:', match[0].trim());
                return match[0].trim();
              }
            }
            
            // 如果没有匹配到完整学位，尝试提取专业领域
            const fieldMatch = cleanText.match(/(?:in|of)\s+([\w\s]+)/i);
            if (fieldMatch && fieldMatch[1]) {
              console.log('提取到专业领域:', fieldMatch[1].trim());
              return fieldMatch[1].trim();
            }
            
            console.log('使用原始文本作为学位类型:', cleanText);
            return cleanText;
          };

          console.log('原始教育数据:', parsed_resume.education);

          const formattedData = {
            basics: {
              name: parsed_resume.name || '',
              email: parsed_resume.email || '',
              phone: parsed_resume.phone || '',
              location: { address: '', postalCode: '', city: '', countryCode: '', region: '' }
            },
            education: parsed_resume.education ? parsed_resume.education
              .map((edu: string) => {
                console.log('处理教育条目:', edu);
                
                const institution = extractInstitution(edu);
                const studyType = extractDegreeType(edu);
                const yearMatch = edu.match(/\b(20\d{2})\b/);
                const year = yearMatch ? yearMatch[1] : '';
                
                // 提取专业领域
                const areaMatch = edu.match(/(?:in|of)\s+([\w\s]+)/i);
                const area = areaMatch ? areaMatch[1].trim() : 'Computer Science';
                
                const educationEntry: Record<string, string> = {
                  studyType,
                  area
                };
                
                if (institution) {
                  educationEntry.institution = institution;
                }
                
                if (year) {
                  educationEntry.startDate = year;
                  educationEntry.endDate = year;
                }
                
                return educationEntry;
              })
              .filter((edu: Record<string, string>) => edu !== null) : [],
            work: [],
            skills: parsed_resume.skills ? parsed_resume.skills.map((skill: string) => ({
              name: skill
            })) : []
          };
          
          console.log('格式化后的解析结果:', formattedData);
          dispatch(setParsedData(formattedData));
        }
        
        if (response.data.matched_jobs) {
          dispatch(setMatchedJobs(response.data.matched_jobs));
        }
      } 
      else {
        throw new Error('不支持的文件格式，请上传 PDF 或 TXT 文件');
      }

      setUploadStatus('complete');

    } catch (error: any) {
      console.error("上传失败", error);
      setError(error.message || '文件处理失败，请重试');
      setUploadStatus('idle');
    }
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="container mx-auto max-w-5xl">
        <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
          {uploadStatus !== 'idle' && uploadStatus !== 'complete' && (
            <div className="absolute inset-0 bg-gray-800/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
              <Loading />
              <p className="mt-6 text-white text-lg font-medium">
                {uploadStatus === 'uploading' && (
                  <span className="flex items-center">
                    <FiUpload className="mr-2" /> Uploading file...
                  </span>
                )}
                {uploadStatus === 'analyzing' && (
                  <span className="flex items-center">
                    <AiOutlineFileSearch className="mr-2" /> Analyzing resume...
                  </span>
                )}
                {uploadStatus === 'matching' && (
                  <span className="flex items-center">
                    <AiOutlineThunderbolt className="mr-2" /> Matching jobs...
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold flex items-center">
              <MdPerson className="mr-3 text-3xl" /> Jobseeker Portal
            </h1>
            <p className="mt-2 opacity-90">Upload your resume and find matching job opportunities</p>
          </div>
          
          <div className="p-6">
            <div 
              className={`mb-8 border-2 border-dashed rounded-lg p-8 ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              } transition-all duration-300 flex flex-col items-center justify-center text-center`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 mb-4 text-blue-500 flex items-center justify-center">
                <AiOutlineCloudUpload className="w-full h-full" />
              </div>
              
              <h3 className="text-xl font-medium text-gray-800 mb-2">Upload Your Resume</h3>
              <p className="text-gray-500 mb-4">Drag and drop a file or click the button below</p>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadStatus !== 'idle' && uploadStatus !== 'complete'}
                />
                <button
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center shadow-md transition-colors disabled:bg-gray-400"
                  disabled={uploadStatus !== 'idle' && uploadStatus !== 'complete'}
                >
                  <HiOutlineDocumentText className="mr-2" /> Select File
                </button>
              </div>
              
              <div className="flex items-center mt-6 text-sm bg-blue-50 text-blue-700 p-3 rounded-md">
                <FiInfo className="mr-2 flex-shrink-0" />
                <p>Supports PDF and TXT formats, maximum file size 10MB</p>
              </div>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md flex items-start">
                <FiInfo className="mr-3 mt-0.5 text-red-500" />
                <p>{error}</p>
              </div>
            )}

            {parsedData && (
              <div className="animate-fadeIn">
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <MdPerson className="mr-2 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start">
                        <div className="mt-1 mr-3 text-gray-500">
                          <MdPerson />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium text-gray-800">{parsedData.basics?.name || 'Not detected'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mt-1 mr-3 text-gray-500">
                          <FiMail />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-800">{parsedData.basics?.email || 'Not detected'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="mt-1 mr-3 text-gray-500">
                          <FiPhone />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium text-gray-800">{parsedData.basics?.phone || 'Not detected'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {parsedData.education && parsedData.education.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <MdSchool className="mr-2 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-800">Education</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {parsedData.education.map((edu: Education, index: number) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                          <div className="flex flex-wrap md:flex-nowrap md:items-center mb-2">
                            <h4 className="font-semibold text-gray-800 mr-2">
                              {edu.institution || 'Unknown Institution'}
                            </h4>
                            {(edu.startDate || edu.endDate) && (
                              <div className="flex items-center text-sm text-gray-500">
                                <FiCalendar className="mr-1" />
                                <span>{edu.startDate || '?'} - {edu.endDate || 'Present'}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1 text-gray-700">
                            {edu.studyType && (
                              <p className="flex items-center">
                                <MdSchool className="mr-2 text-gray-500" />
                                {edu.studyType}
                              </p>
                            )}
                            {edu.area && (
                              <p className="flex items-center">
                                <BsStars className="mr-2 text-gray-500" />
                                {edu.area}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {parsedData.skills && parsedData.skills.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center mb-4">
                      <BsStars className="mr-2 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-800">Skills</h3>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.map((skill: Skill, index: number) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {matchedJobs && matchedJobs.length > 0 && (
              <div className="mt-10 animate-fadeIn">
                <div className="flex items-center mb-6">
                  <BsLightningCharge className="mr-2 text-yellow-500 text-2xl" />
                  <h2 className="text-2xl font-bold text-gray-800">Matching Jobs ({matchedJobs.length})</h2>
                </div>
                
                <div className="space-y-4">
                  {matchedJobs.map((job: Job, index: number) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-800">{job.job_title}</h3>
                          <p className="text-blue-600 font-medium">{job.company}</p>
                        </div>
                        <div className="bg-green-100 text-green-800 rounded-full px-3 py-1 text-sm flex items-center">
                          <BsCheckCircleFill className="mr-1" />
                          匹配度: {(job.similarity * 100).toFixed(0)}%
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3 text-gray-700">
                        {job.location && (
                          <div className="flex items-center text-sm">
                            <FiMapPin className="mr-1 text-gray-500" />
                            {job.location}
                          </div>
                        )}
                        
                        {job.salary && (
                          <div className="flex items-center text-sm">
                            <BiDollarCircle className="mr-1 text-gray-500" />
                            {job.salary}
                          </div>
                        )}
                        
                        {job.job_type && (
                          <div className="flex items-center text-sm">
                            <BiTime className="mr-1 text-gray-500" />
                            {job.job_type}
                          </div>
                        )}
                      </div>
                      
                      {job.job_description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{job.job_description}</p>
                      )}
                      
                      {job.required_skills && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Required Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {job.required_skills.split(',').map((skill: string, idx: number) => (
                              <span 
                                key={idx} 
                                className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs"
                              >
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;
