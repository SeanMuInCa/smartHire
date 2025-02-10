import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import sqlite3

# **确保 FAISS 和数据库路径正确**
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "job_embeddings.faiss")
JOB_IDS_PATH = os.path.join(BASE_DIR, "job_ids.npy")
DB_PATH = os.path.join(BASE_DIR, "jobs.db")

# 加载 Sentence-BERT 模型
model = SentenceTransformer("all-MiniLM-L6-v2")

def normalize(vecs):
    """归一化向量"""
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    return vecs / norms

def match_jobs_with_faiss(resume_text, top_k=5):
    """使用 FAISS 查询与简历最相似的职位"""
    if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(JOB_IDS_PATH):
        print("❌ FAISS 索引或 job_ids.npy 文件不存在，请先运行 `embedding.py` 训练索引！")
        return []

    # 读取 FAISS 索引
    index = faiss.read_index(FAISS_INDEX_PATH)
    job_ids = np.load(JOB_IDS_PATH)

    # 计算简历的嵌入向量
    resume_embedding = model.encode([resume_text], convert_to_numpy=True)
    resume_embedding = normalize(resume_embedding)  # ✅ 归一化，确保 Cosine Similarity 正确计算

    # 进行相似度查询
    similarities, indices = index.search(resume_embedding, top_k)

    # **解析匹配结果**
    matched_jobs = []
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    for i, score in zip(indices[0], similarities[0]):
        job_id = int(job_ids[i])
        cursor.execute("SELECT job_title, company, location FROM jobs WHERE id=?", (job_id,))
        job_data = cursor.fetchone()

        if job_data:
            matched_jobs.append({
                "title": job_data[0],
                "company": job_data[1],
                "location": job_data[2],
                "similarity": round(float(score), 3)  # ✅ 确保相似度在 0~1 之间
            })

    conn.close()
    return matched_jobs
