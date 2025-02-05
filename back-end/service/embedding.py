from sentence_transformers import SentenceTransformer
import faiss
import numpy as np

# 加载 Sentence-BERT 模型
model = SentenceTransformer('all-MiniLM-L6-v2')

# 加载 FAISS 索引
index = faiss.read_index("database/job_embeddings.faiss")  # 确保路径正确


def generate_embedding(content: bytes):
    """
    根据简历内容生成语义嵌入。
    Args:
        content (bytes): 简历的二进制内容。
    Returns:
        np.array: 生成的嵌入向量。
    """
    text = content.decode('utf-8')  # 将二进制转换为文本
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding


def match_jobs(embedding: np.array, top_k: int = 5):
    """
    使用 FAISS 匹配嵌入，返回最相似的工作岗位。
    Args:
        embedding (np.array): 简历生成的嵌入。
        top_k (int): 返回的匹配数量。
    Returns:
        list: 包含匹配的工作岗位和相似度得分的列表。
    """
    # 查询嵌入
    distances, indices = index.search(np.array([embedding]), top_k)

    # 解析匹配结果（确保 job_id 是 int 类型）
    matches = []
    for i, score in zip(indices[0], distances[0]):
        job_id = int(i)  # 强制转换为 Python int 类型
        similarity = 1 / (1 + float(score)) # 将距离转换为相似度
        matches.append({"job_id": job_id, "similarity": round(similarity, 4)})  # similarity 转为 float 类型

    return matches

