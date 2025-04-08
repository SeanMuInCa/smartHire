from fastapi import FastAPI, File, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
import os
import sqlite3
from service.resume_parser import parse_resume, save_parsed_resume
from service.matching import match_jobs_with_faiss, match_candidates_with_faiss
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

app = FastAPI()

# ✅ **强制设置 CORS**
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有 Headers
)

# ✅ **手动设置 CORS 头部**
@app.middleware("http")
async def add_cors_header(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# ✅ **允许 OPTIONS 预检请求**
@app.options("/{full_path:path}")
async def preflight(full_path: str):
    return Response(headers={
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*"
    })

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Recruitment Backend!"}

class SkillsInput(BaseModel):
    skills: List[str]

class JobRequirement(BaseModel):
    title: str
    requiredSkills: List[str]
    experience: str
    education: str
    location: str
    description: str

# 简历数据模型
class Education(BaseModel):
    institution: str
    studyType: str
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    area: Optional[str] = None

class Skill(BaseModel):
    name: str

class Location(BaseModel):
    address: Optional[str] = ""
    postalCode: Optional[str] = ""
    city: Optional[str] = ""
    countryCode: Optional[str] = ""
    region: Optional[str] = ""

class Basics(BaseModel):
    name: str
    email: str
    phone: str
    location: Optional[Location] = None

class ParsedResume(BaseModel):
    basics: Basics
    education: List[Education]
    work: List[Dict[str, Any]] = []
    skills: List[Skill]

@app.post("/upload/")
async def upload_resume(file: UploadFile = File(...)):
    """接收文件上传并解析简历"""
    try:
        print(f"接收到文件上传请求：{file.filename}")
        content = await file.read()
        
        # 解析简历
        print("开始解析简历...")
        parsed_resume = parse_resume(content, file.filename)

        if isinstance(parsed_resume, dict) and "error" in parsed_resume:
            print(f"❌ 简历解析失败：{parsed_resume['error']}")
            return parsed_resume

        print("简历解析成功，开始匹配职位...")
        matched_jobs = match_jobs_with_faiss(parsed_resume["skills"], top_k=5)
        print(f"职位匹配完成，找到 {len(matched_jobs)} 个匹配的职位")

        return {
            "status": "success",
            "message": "简历上传并解析成功",
            "parsed_resume": parsed_resume,
            "matched_jobs": matched_jobs
        }
    except Exception as e:
        print(f"❌ 处理简历上传请求时发生错误：{str(e)}")
        return {
            "status": "error",
            "message": f"处理简历失败：{str(e)}",
            "error": str(e)
        }

@app.post("/match_jobs/")
async def match_jobs(skills_input: SkillsInput):
    """只进行职位匹配的接口"""
    try:
        matched_jobs = match_jobs_with_faiss(skills_input.skills, top_k=5)
        return {"matched_jobs": matched_jobs}
    except Exception as e:
        return {"error": str(e)}

@app.post("/match_candidates/")
async def match_candidates(job_requirement: JobRequirement):
    """根据职位要求匹配候选人"""
    try:
        matched_candidates = match_candidates_with_faiss(
            job_requirement.requiredSkills,
            job_requirement.education,
            top_k=5
        )
        return {"matched_candidates": matched_candidates}
    except Exception as e:
        return {"error": str(e)}

@app.post("/save_resume/")
async def save_resume(resume: ParsedResume):
    """接收前端解析的简历数据并保存到数据库"""
    try:
        print(f"接收到前端解析的简历数据: {resume.basics.name}")
        
        # 准备数据格式
        parsed_data = {
            "name": resume.basics.name,
            "email": resume.basics.email,
            "phone": resume.basics.phone,
            "education": [
                f"{edu.studyType} from {edu.institution}" 
                for edu in resume.education
            ],
            "skills": [skill.name for skill in resume.skills]
        }
        
        # 保存到数据库
        resume_id = save_parsed_resume(parsed_data)
        
        # 匹配职位
        skill_names = [skill.name for skill in resume.skills]
        matched_jobs = match_jobs_with_faiss(skill_names, top_k=5)
        
        return {
            "status": "success", 
            "message": "简历已保存到数据库",
            "resume_id": resume_id,
            "matched_jobs": matched_jobs
        }
    except Exception as e:
        print(f"❌ 保存简历失败: {str(e)}")
        return {"status": "error", "message": f"保存简历失败: {str(e)}"}