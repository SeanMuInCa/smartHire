import sys
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# **确保可以正确导入数据库**
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database")))

from database import get_jobs

# 确保 FAISS 和数据库路径正确
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../database"))
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "job_embeddings.faiss")
JOB_IDS_PATH = os.path.join(BASE_DIR, "job_ids.npy")
DB_PATH = os.path.join(BASE_DIR, "jobs.db")

# 加载 Sentence-BERT 模型
model = SentenceTransformer("all-MiniLM-L6-v2")

def build_faiss_index():
    """从数据库加载职位描述，并构建 FAISS 索引"""
    jobs = get_jobs()
    if not jobs:
        print("❌ 没有找到职位数据，请检查 jobs.db 是否已填充数据")
        return

    job_descriptions = [job[1] for job in jobs]
    job_ids = [job[0] for job in jobs]

    # 计算职位描述的嵌入向量
    job_embeddings = model.encode(job_descriptions, convert_to_numpy=True)

    # 创建 FAISS 索引
    dimension = job_embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(job_embeddings)

    # 存储索引和职位 ID
    faiss.write_index(index, FAISS_INDEX_PATH)
    np.save(JOB_IDS_PATH, job_ids)
    print(f"✅ {len(jobs)} 条职位数据已存入 FAISS！")

def match_jobs_with_faiss(resume_text, top_k=5):
    """使用 FAISS 查询与简历最相似的职位"""
    if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(JOB_IDS_PATH):
        print("❌ FAISS 索引或 job_ids.npy 文件不存在，请先运行 `build_faiss_index()` 训练索引！")
        return []

    # 读取 FAISS 索引
    index = faiss.read_index(FAISS_INDEX_PATH)
    job_ids = np.load(JOB_IDS_PATH)

    # 计算简历的嵌入向量
    resume_embedding = model.encode([resume_text], convert_to_numpy=True)

    # 进行相似度查询
    distances, indices = index.search(resume_embedding, top_k)

    # 解析匹配结果
    matched_jobs = []
    for i, score in zip(indices[0], distances[0]):
        matched_jobs.append({"job_id": int(job_ids[i]), "similarity": float(1 - score)})

    return matched_jobs

if __name__ == "__main__":
    build_faiss_index()
