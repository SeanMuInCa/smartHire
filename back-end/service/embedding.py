from sentence_transformers import SentenceTransformer
import numpy as np

# 载入 Sentence-BERT 模型
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def generate_embedding(text: str):
    """ 将文本转换为嵌入向量 """
    embedding = model.encode([text])
    return np.array(embedding, dtype="float32")
