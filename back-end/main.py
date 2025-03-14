from fastapi import FastAPI, File, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
import os
import sqlite3
from service.resume_parser import parse_resume
from service.matching import match_jobs_with_faiss
from typing import List
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

@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    """接收文件上传并解析简历"""
    try:
        content = await file.read()
        parsed_resume = parse_resume(content, file.filename)

        if isinstance(parsed_resume, dict) and "error" in parsed_resume:
            return parsed_resume

        matched_jobs = match_jobs_with_faiss(parsed_resume["skills"], top_k=5)

        return {"parsed_resume": parsed_resume, "matched_jobs": matched_jobs}
    except Exception as e:
        return {"error": str(e)}

@app.post("/match_jobs/")
async def match_jobs(skills_input: SkillsInput):
    """只进行职位匹配的接口"""
    try:
        matched_jobs = match_jobs_with_faiss(skills_input.skills, top_k=5)
        return {"matched_jobs": matched_jobs}
    except Exception as e:
        return {"error": str(e)}