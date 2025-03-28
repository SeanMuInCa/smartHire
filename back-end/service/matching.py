import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import sqlite3
from typing import List

# **确保 FAISS 和数据库路径正确**
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
JOB_FAISS_INDEX_PATH = os.path.join(BASE_DIR, "job_embeddings.faiss")
JOB_IDS_PATH = os.path.join(BASE_DIR, "job_ids.npy")
RESUME_FAISS_INDEX_PATH = os.path.join(BASE_DIR, "resume_embeddings.faiss")
RESUME_IDS_PATH = os.path.join(BASE_DIR, "resume_ids.npy")
RESUMES_DB_PATH = os.path.join(BASE_DIR, "resumes.db")
JOBS_DB_PATH = os.path.join(BASE_DIR, "jobs.db")

# **加载 Sentence-BERT 模型**
model = SentenceTransformer("all-mpnet-base-v2")

def match_jobs_with_faiss(resume_text, top_k=5):
    """使用 FAISS 进行职位匹配（从jobs.db中匹配职位）"""
    if not os.path.exists(JOB_FAISS_INDEX_PATH) or not os.path.exists(JOB_IDS_PATH):
        raise ValueError("❌ 职位FAISS索引未找到，请先运行 `embedding.py` 生成索引")

    # 加载 FAISS 索引
    index = faiss.read_index(JOB_FAISS_INDEX_PATH)
    job_ids = np.load(JOB_IDS_PATH)

    # 计算简历嵌入
    resume_text = " ".join(resume_text) if isinstance(resume_text, list) else resume_text
    resume_embedding = model.encode(resume_text, convert_to_numpy=True)
    resume_embedding = resume_embedding.reshape(1, -1)

    # 查询 FAISS
    similarities, indices = index.search(resume_embedding, top_k)

    # 解析 FAISS 结果
    matched_jobs = []
    for i, sim in zip(indices[0], similarities[0]):
        job_id = int(job_ids[i])
        job = get_job_details(job_id)

        if job:
            matched_jobs.append({
                "id": job_id,
                "title": job["title"],
                "company": job["company"],
                "location": job["location"],
                "description": job["description"],
                "similarity": float(sim)
            })
    return matched_jobs[:top_k]

def get_job_details(job_id: int):
    """从jobs.db获取职位详情"""
    conn = sqlite3.connect(JOBS_DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT job_title, company_name, location, job_description
        FROM jobs
        WHERE id = ?
        """, (job_id,))
        row = cursor.fetchone()
        if row:
            return {
                "title": row[0],
                "company": row[1],
                "location": row[2],
                "description": row[3],
            }
        return None
    finally:
        conn.close()

def match_candidates_with_faiss(required_skills: list, education: str, top_k: int = 5):
    """使用FAISS匹配候选人（从resumes.db中匹配候选人）"""
    try:
        # 将职位要求转换为向量
        job_text = f"{' '.join(required_skills)} {education}"
        job_embedding = model.encode(job_text, convert_to_numpy=True)
        job_embedding = job_embedding.reshape(1, -1)
        
        # 加载FAISS索引
        if not os.path.exists(RESUME_FAISS_INDEX_PATH) or not os.path.exists(RESUME_IDS_PATH):
            print("❌ 简历FAISS索引未找到，请先运行embedding.py生成索引")
            return []
            
        index = faiss.read_index(RESUME_FAISS_INDEX_PATH)
        resume_ids = np.load(RESUME_IDS_PATH)
        
        # 执行相似度搜索
        similarities, indices = index.search(job_embedding, top_k)
        
        # 获取匹配的候选人详细信息
        matched_candidates = []
        for i, sim in zip(indices[0], similarities[0]):
            resume_id = int(resume_ids[i])
            candidate = get_resume_details(resume_id)
            if candidate:
                matched_candidates.append({
                    "id": resume_id,
                    "name": candidate["name"],
                    "education": candidate["education"],
                    "skills": candidate["skills"].split(","),
                    "similarity": float(sim)
                })
        
        return matched_candidates
    except Exception as e:
        print(f"❌ 候选人匹配失败: {str(e)}")
        return []

def get_resume_details(resume_id: int):
    """从resumes.db获取简历详情"""
    conn = sqlite3.connect(RESUMES_DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT name, email, phone, education, skills
        FROM resumes
        WHERE id = ?
        """, (resume_id,))
        row = cursor.fetchone()
        if row:
            return {
                "name": row[0],
                "email": row[1],
                "phone": row[2],
                "education": row[3],
                "skills": row[4]
            }
        return None
    finally:
        conn.close()

def build_job_index():
    """构建职位的FAISS索引"""
    conn = sqlite3.connect(JOBS_DB_PATH)
    cursor = conn.cursor()
    try:
        # 获取所有职位数据
        cursor.execute("SELECT id, job_title, job_description FROM jobs")
        jobs = cursor.fetchall()
        
        if not jobs:
            print("❌ 没有找到职位数据")
            return
            
        # 准备文本数据
        texts = []
        job_ids = []
        for job_id, title, description in jobs:
            text = f"{title} {description}"
            texts.append(text)
            job_ids.append(job_id)
            
        # 计算嵌入向量
        embeddings = model.encode(texts, convert_to_numpy=True)
        
        # 创建FAISS索引
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        
        # 保存索引和ID
        faiss.write_index(index, JOB_FAISS_INDEX_PATH)
        np.save(JOB_IDS_PATH, job_ids)
        print(f"✅ 已为{len(jobs)}个职位创建FAISS索引")
        
    finally:
        conn.close()

def build_resume_index():
    """构建简历的FAISS索引"""
    conn = sqlite3.connect(RESUMES_DB_PATH)
    cursor = conn.cursor()
    try:
        # 获取所有简历数据
        cursor.execute("SELECT id, education, skills FROM resumes")
        resumes = cursor.fetchall()
        
        if not resumes:
            print("❌ 没有找到简历数据")
            return
            
        # 准备文本数据
        texts = []
        resume_ids = []
        for resume_id, education, skills in resumes:
            text = f"{education} {skills}"
            texts.append(text)
            resume_ids.append(resume_id)
            
        # 计算嵌入向量
        embeddings = model.encode(texts, convert_to_numpy=True)
        
        # 创建FAISS索引
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        
        # 保存索引和ID
        faiss.write_index(index, RESUME_FAISS_INDEX_PATH)
        np.save(RESUME_IDS_PATH, resume_ids)
        print(f"✅ 已为{len(resumes)}份简历创建FAISS索引")
        
    finally:
        conn.close()

if __name__ == "__main__":
    build_job_index()
    build_resume_index()

