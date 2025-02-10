from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from service.resume_parser import parse_resume
from service.google_search import google_job_search
from service.embedding import match_jobs_with_faiss
import sqlite3
import os
import time  # 添加时间戳防止缓存


# 创建 FastAPI 实例
app = FastAPI()

# 允许前端跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def read_root():
    return {"message": "Welcome to AI Recruitment Backend!"}


# **确保 `resumes.db` 路径正确**
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "database"))
DB_PATH = os.path.join(BASE_DIR, "resumes.db")


@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    """上传简历并存入数据库"""
    content = await file.read()
    parsed_resume = parse_resume(content, file.filename)

    # 查询数据库是否成功存储
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM resumes")
    data = cursor.fetchall()
    conn.close()

    return {"parsed_resume": parsed_resume, "db_data": data}
@app.get("/resumes/")
def get_resumes():
    """API 端点：获取所有已存储的简历"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, email, phone, education, skills FROM resumes")
    resumes = [
        {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "phone": row[3],
            "education": row[4].split("; "),  # 转换回列表
            "skills": row[5].split("; ")  # 转换回列表
        }
        for row in cursor.fetchall()
    ]

    conn.close()
    return {"resumes": resumes}

@app.get("/search_jobs/")
def search_jobs(query: str):
    """搜索职位信息，确保 Google API 不缓存"""
    # print(f"🔎 搜索查询: {query}")  # Debug 输出

    results = google_job_search(query)  # 传递 `query` 直接调用 API
    return {'jobs':results}


@app.get("/jobs/")
def get_jobs():
    """从数据库获取所有职位数据"""
    conn = sqlite3.connect("./database/jobs.db")
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM jobs")
    jobs = cursor.fetchall()
    conn.close()

    # 格式化 JSON 响应
    job_list = [
        {
            "id": job[0],
            "job_title": job[1],
            "employment_type": job[2],
            "pay_rate": job[3],
            "currency": job[4],
            "location": job[5],
            "work_schedule": job[6],
            "job_description": job[7],
            "required_skills": job[8].split(", "),
            "degree_requirement": job[9],
            "language_requirement": job[10],
            "key_qualifications": job[11].split(", "),
            "benefits": job[12].split(", "),
            "application_process": job[13]
        }
        for job in jobs
    ]

    return {"jobs": job_list}