import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setParsedData, setMatchedJobs } from "../store/resumeUploadSlice";
import { parseResumeFromPdf } from "../utils/pdfParser";
import axiosService from "../services";
import { FiInfo } from 'react-icons/fi';
import Loading from "./Loading";
import { RootState } from "../store";

const ResumeUpload = () => {
  const dispatch = useDispatch();
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'uploading' | 'analyzing' | 'matching' | 'complete'
  >('idle');
  const [error, setError] = useState<string | null>(null);

  const parsedData = useSelector((state: RootState) => state.resumeUpload.parsedData);
  const matchedJobs = useSelector((state: RootState) => state.resumeUpload.matchedJobs);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const file = event.target.files[0];
    
    setUploadStatus('uploading');
    setError(null);
    
    try {
      // PDF 文件处理逻辑
      if (file.type === 'application/pdf') {
        setUploadStatus('analyzing');
        console.log('开始解析PDF文件:', file.name);
        
        const parsedResume = await parseResumeFromPdf(file);
        console.log('PDF解析结果:', parsedResume);
        
        dispatch(setParsedData(parsedResume));
        
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
        
        const response = await axiosService.post("/upload_resume/", formData, {
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
              .filter((edu) => edu !== null) : [],
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
    <div className="p-6 bg-white shadow-md rounded-lg relative">
      {uploadStatus !== 'idle' && uploadStatus !== 'complete' && (
        <div className="absolute inset-0 bg-gray-800/70 flex flex-col items-center justify-center z-10">
          <Loading />
          <p className="mt-4 text-white text-lg">
            {uploadStatus === 'uploading' && 'Uploading file...'}
            {uploadStatus === 'analyzing' && 'Analyzing resume...'}
            {uploadStatus === 'matching' && 'Matching jobs...'}
          </p>
        </div>
      )}

      <h2 className="text-xl font-semibold">Upload Resume</h2>
      
      <div className="mt-4">
        <input
          type="file"
          accept=".pdf,.txt"
          onChange={handleUpload}
          className="mt-4"
          disabled={uploadStatus !== 'idle' && uploadStatus !== 'complete'}
        />
        
        <div className="flex items-center mt-2 text-sm bg-orange-50 text-orange-700 p-2 rounded-md">
          <FiInfo className="mr-2 flex-shrink-0" />
          <p>Supports PDF and TXT files</p>
        </div>
        
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
            <p>{error}</p>
          </div>
        )}
      </div>

      {parsedData && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Parsing Results</h3>
          <div className="mt-2 space-y-4">
            <div>
              <p><strong>Name:</strong> {parsedData.basics?.name || 'Not detected'}</p>
              <p><strong>Email:</strong> {parsedData.basics?.email || 'Not detected'}</p>
              <p><strong>Phone:</strong> {parsedData.basics?.phone || 'Not detected'}</p>
            </div>
            
            <div>
              <h4 className="font-semibold">Education</h4>
              {parsedData.education?.length > 0 ? (
                <ul className="list-disc pl-5">
                  {parsedData.education.map((edu, index) => (
                    <li key={index}>
                      {[
                        edu.studyType,
                        edu.area,
                        edu.institution,
                        edu.startDate && edu.endDate ? `${edu.startDate}-${edu.endDate}` : null
                      ].filter(Boolean).join(' - ')}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No education history detected</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold">Skills</h4>
              {parsedData.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {skill.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No skills detected</p>
              )}
            </div>
          </div>
        </div>
      )}

      {matchedJobs && matchedJobs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Matched Jobs</h3>
          <div className="mt-2">
            {matchedJobs.map((job, index) => (
              <div key={index} className="mb-4 p-4 border rounded">
                <p><strong>Position:</strong> {job.title}</p>
                <p><strong>Company:</strong> {job.company}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Match Rate:</strong> {(job.similarity * 100).toFixed(1)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
