import os
import sys
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# **手动添加 `database/` 目录到 Python 路径**
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database")))

from database import get_jobs  # ✅ 确保 `get_jobs` 方法存在

# **FAISS 和数据库路径**
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
FAISS_INDEX_PATH = os.path.join(BASE_DIR, "job_embeddings.faiss")
JOB_IDS_PATH = os.path.join(BASE_DIR, "job_ids.npy")

# 加载 Sentence-BERT
model = SentenceTransformer("all-MiniLM-L6-v2")

def normalize(vecs):
    """归一化向量，使其适用于 Cosine Similarity"""
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    return vecs / norms

def build_faiss_index():
    """从数据库加载职位描述，并构建 FAISS 余弦相似度索引"""
    jobs = get_jobs()
    if not jobs:
        print("❌ 没有找到职位数据，请检查 jobs.db 是否已填充数据")
        return

    job_descriptions = [job[1] for job in jobs]
    job_ids = [job[0] for job in jobs]

    # 计算职位描述的嵌入向量
    job_embeddings = model.encode(job_descriptions, convert_to_numpy=True)
    job_embeddings = normalize(job_embeddings)  # ✅ 归一化向量，确保 Cosine Similarity 正确计算

    # **创建 FAISS 余弦相似度索引**
    dimension = job_embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)  # ✅ 使用 Inner Product 代替 L2
    index.add(job_embeddings)

    # 存储索引和职位 ID
    faiss.write_index(index, FAISS_INDEX_PATH)
    np.save(JOB_IDS_PATH, job_ids)
    print(f"✅ {len(jobs)} 条职位数据已存入 FAISS（Cosine Similarity）！")

if __name__ == "__main__":
    build_faiss_index()
