import faiss
import numpy as np

def create_faiss_index(dimension=384):
    """ 创建 FAISS 索引 """
    index = faiss.IndexFlatL2(dimension)
    return index

def search_similar_jobs(query_embedding, index, top_k=5):
    """ 在 FAISS 中搜索最相似的职位 """
    scores, indices = index.search(np.array([query_embedding]), top_k)
    return scores, indices
