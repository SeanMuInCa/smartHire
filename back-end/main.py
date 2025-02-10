import os
import sqlite3
from fastapi import FastAPI, File, UploadFile
from service.resume_parser import parse_resume
from service.matching import match_jobs_with_faiss  # ✅ AI 语义匹配

app = FastAPI()

# **确保 `database/` 目录正确**
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "database"))
RESUMES_DB_PATH = os.path.join(BASE_DIR, "resumes.db")
JOBS_DB_PATH = os.path.join(BASE_DIR, "jobs.db")

@app.get("/")
def read_root():
    """默认路由，测试服务器是否运行"""
    return {"message": "Welcome to AI Recruitment Backend!"}

@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    """上传简历并存入数据库，同时匹配最合适的职位"""
    content = await file.read()
    parsed_resume = parse_resume(content, file.filename)

    if isinstance(parsed_resume, dict) and "error" in parsed_resume:
        return parsed_resume

    # **使用 AI 语义匹配找到最佳职位**
    matched_jobs = match_jobs_with_faiss(parsed_resume["skills"], top_k=5)

    return {"parsed_resume": parsed_resume, "matched_jobs": matched_jobs}

@app.get("/resumes/")
def get_resumes():
    """获取所有存储的简历"""
    conn = sqlite3.connect(RESUMES_DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, email, phone, education, skills FROM resumes")
    resumes = [
        {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "phone": row[3],
            "education": row[4].split("; "),
            "skills": row[5].split("; ")
        }
        for row in cursor.fetchall()
    ]

    conn.close()
    return {"resumes": resumes}

@app.get("/jobs/")
def get_jobs():
    """获取所有存储的职位"""
    conn = sqlite3.connect(JOBS_DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT id, job_title, company, location FROM jobs")
    jobs = [
        {
            "id": row[0],
            "title": row[1],
            "company": row[2],
            "location": row[3]
        }
        for row in cursor.fetchall()
    ]

    conn.close()
    return {"jobs": jobs}
