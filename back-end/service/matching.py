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

# **加载 Sentence-BERT 模型**
model = SentenceTransformer("all-mpnet-base-v2")  # ✅ 确保和 `embedding.py` 使用的模型一致


def match_jobs_with_faiss(resume_text, top_k=5):
    """使用 FAISS 进行职位匹配"""
    if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(JOB_IDS_PATH):
        raise ValueError("❌ FAISS 索引未找到，请先运行 `embedding.py` 生成索引")

    # ✅ 加载 FAISS 索引
    index = faiss.read_index(FAISS_INDEX_PATH)
    job_ids = np.load(JOB_IDS_PATH)

    # ✅ 计算简历嵌入（确保是字符串）
    resume_text = " ".join(resume_text) if isinstance(resume_text, list) else resume_text
    resume_embedding = model.encode(resume_text, convert_to_numpy=True)
    resume_embedding = resume_embedding.reshape(1, -1)  # ✅ 确保是 `(1, 768)`

    # **打印 FAISS 维度和 `resume_embedding` 维度**
    print(f"📌 FAISS 索引维度: {index.d}")
    print(f"📌 Resume 嵌入维度: {resume_embedding.shape[1]}")

    # ✅ 查询 FAISS（返回最近 `top_k` 个职位）
    similarities, indices = index.search(resume_embedding, top_k)

    # ✅ 解析 FAISS 结果
    matched_jobs = []
    for i, sim in zip(indices[0], similarities[0]):
        job_id = int(job_ids[i])  # ✅ 确保 `job_id` 是 `int`
        job_details = get_job_details(job_id)

        if job_details:
            matched_jobs.append({
                "title": job_details["job_title"],
                "company": job_details["company"],
                "location": job_details["location"],
                "similarity": float(sim)
            })

    return matched_jobs


def get_job_details(job_id):
    """从数据库获取职位详情"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    job_id = int(job_id)  # ✅ 确保 `job_id` 是 Python `int`

    cursor.execute(
        "SELECT job_title, company_name, location FROM jobs WHERE id = ?", (job_id,)
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return {"job_title": row[0], "company": row[1], "location": row[2]}
    return None  # ❌ 如果找不到职位，返回 `None`
