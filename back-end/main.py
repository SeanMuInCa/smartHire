from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from service.resume_parser import parse_resume
from service.google_search import google_job_search
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
@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    """
    解析 TXT 简历文件，提取姓名、邮箱、电话、教育背景、技能等信息。
    """
    # 检查文件扩展名是否为 .txt
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")

    # 读取上传的文件内容
    try:
        content = await file.read()
        parsed_resume = parse_resume(content, file.filename)  # 调用解析函数
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing the file: {str(e)}")

    return {"parsed_resume": parsed_resume}

# 获取数据库路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "./service/resumes.db")

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