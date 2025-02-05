import faiss
import numpy as np

# 定义索引的维度（通常是 Sentence-BERT 维度，默认 384）
dimension = 384
index = faiss.IndexFlatL2(dimension)

# 随机添加一些向量（测试用，实际项目中应使用真实数据）
num_vectors = 10
vectors = np.random.rand(num_vectors, dimension).astype('float32')
index.add(vectors)

# 保存索引文件
faiss.write_index(index, "D:/mysask/AI/Project/back-end/database/job_embeddings.faiss")

print("FAISS 索引已成功创建并保存！")
