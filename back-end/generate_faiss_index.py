import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

# 初始化 Sentence-BERT 模型
model = SentenceTransformer('all-MiniLM-L6-v2')

# 模拟职位数据
job_descriptions = [
    "Software engineer with experience in Python and JavaScript.",
    "Data scientist with expertise in machine learning and deep learning.",
    "Frontend developer proficient in React and CSS.",
    "Backend engineer skilled in Node.js and databases.",
    "AI researcher with a focus on NLP and computer vision."
]

# 生成职位描述的嵌入
print("Generating embeddings for job descriptions...")
job_embeddings = model.encode(job_descriptions, convert_to_numpy=True)

# 创建 FAISS 索引
dimension = job_embeddings.shape[1]  # 嵌入的维度
index = faiss.IndexFlatL2(dimension)  # 使用 L2 距离
print("Adding embeddings to the FAISS index...")
index.add(job_embeddings)  # 添加嵌入到索引

# 保存索引文件
faiss.write_index(index, "database/job_embeddings.faiss")
print("FAISS index saved successfully to 'database/job_embeddings.faiss'.")
