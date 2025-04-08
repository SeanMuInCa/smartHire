import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import sqlite3
from typing import List
import argparse

# **确保 FAISS 和数据库路径正确**
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
print(f"数据库目录: {BASE_DIR}")

JOB_FAISS_INDEX_PATH = os.path.join(BASE_DIR, "job_embeddings.faiss")
JOB_IDS_PATH = os.path.join(BASE_DIR, "job_ids.npy")
RESUME_FAISS_INDEX_PATH = os.path.join(BASE_DIR, "resume_embeddings.faiss")
RESUME_IDS_PATH = os.path.join(BASE_DIR, "resume_ids.npy")
RESUMES_DB_PATH = os.path.join(BASE_DIR, "resumes.db")
JOBS_DB_PATH = os.path.join(BASE_DIR, "jobs.db")

print(f"简历数据库路径: {RESUMES_DB_PATH}")
print(f"简历FAISS索引路径: {RESUME_FAISS_INDEX_PATH}")

# **加载 Sentence-BERT 模型**
print("正在加载 Sentence-BERT 模型...")
model = SentenceTransformer("all-mpnet-base-v2")
print("模型加载完成")

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

    # 查询 FAISS，获取更多结果以防去重后数量不足
    k = min(top_k * 2, len(job_ids))  # 获取2倍的结果，以便去重后仍有足够的数据
    similarities, indices = index.search(resume_embedding, k)

    # 解析 FAISS 结果
    matched_jobs = []
    seen_titles = set()  # 用于记录已经见过的职位标题

    for i, sim in zip(indices[0], similarities[0]):
        job_id = int(job_ids[i])
        job = get_job_details(job_id)

        if job:
            # 创建标题的规范形式（去除空格、转小写）用于比较
            normalized_title = job["title"].lower().strip()
            
            # 如果这个标题还没见过，添加到结果中
            if normalized_title not in seen_titles:
                seen_titles.add(normalized_title)
                matched_jobs.append({
                    "id": job_id,
                    "title": job["title"],
                    "company": job["company"],
                    "location": job["location"],
                    "description": job["description"],
                    "similarity": float(sim)
                })
                
                # 如果已经收集到足够的不重复职位，就停止
                if len(matched_jobs) >= top_k:
                    break

    return matched_jobs

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
        print(f"开始匹配候选人，技能要求：{required_skills}，教育要求：{education}")
        
        # 将职位要求转换为向量
        job_text = f"{' '.join(required_skills)} {education}"
        print(f"职位要求文本：{job_text}")
        
        job_embedding = model.encode(job_text, convert_to_numpy=True)
        job_embedding = job_embedding.reshape(1, -1)
        
        # 加载FAISS索引
        if not os.path.exists(RESUME_FAISS_INDEX_PATH) or not os.path.exists(RESUME_IDS_PATH):
            print("❌ 简历FAISS索引未找到，请先运行embedding.py生成索引")
            return []
            
        index = faiss.read_index(RESUME_FAISS_INDEX_PATH)
        resume_ids = np.load(RESUME_IDS_PATH)
        print(f"已加载FAISS索引，包含 {len(resume_ids)} 份简历")
        
        # 执行相似度搜索
        k = min(top_k * 5, len(resume_ids))
        similarities, indices = index.search(job_embedding, k)
        print(f"FAISS搜索完成，获取到 {k} 个结果")
        
        # 获取匹配的候选人详细信息
        matched_candidates = []
        seen_candidates = set()
        
        # 处理搜索结果
        for i, sim in zip(indices[0], similarities[0]):
            print(f"处理候选人 {i}，相似度：{sim}")
            resume_id = int(resume_ids[i])
            
            # 如果这个候选人还没见过
            if resume_id not in seen_candidates:
                candidate = get_resume_details(resume_id)
                if candidate:
                    seen_candidates.add(resume_id)
                    matched_candidates.append({
                        "id": resume_id,
                        "name": candidate["name"],
                        "education": candidate["education"],
                        "skills": candidate["skills"].split("; "),
                        "similarity": float(sim)
                    })
                    print(f"✅ 添加候选人：{candidate['name']}，技能：{candidate['skills']}")
                    
                    if len(matched_candidates) >= top_k:
                        break
        
        print(f"匹配完成，找到 {len(matched_candidates)} 个候选人")
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
    print("开始构建简历索引...")
    conn = sqlite3.connect(RESUMES_DB_PATH)
    cursor = conn.cursor()
    try:
        # 获取所有简历数据
        cursor.execute("SELECT id, education, skills FROM resumes")
        resumes = cursor.fetchall()
        
        if not resumes:
            print("❌ 没有找到简历数据")
            return
            
        print(f"找到 {len(resumes)} 份简历")
            
        # 准备文本数据
        texts = []
        resume_ids = []
        for resume_id, education, skills in resumes:
            text = f"{education} {skills}"
            texts.append(text)
            resume_ids.append(resume_id)
            
        print("正在计算嵌入向量...")
        # 计算嵌入向量
        embeddings = model.encode(texts, convert_to_numpy=True)
        print(f"嵌入向量维度: {embeddings.shape}")
        
        # 创建FAISS索引
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings)
        
        # 保存索引和ID
        print("正在保存索引...")
        faiss.write_index(index, RESUME_FAISS_INDEX_PATH)
        np.save(RESUME_IDS_PATH, resume_ids)
        print(f"✅ 已为{len(resumes)}份简历创建FAISS索引")
        
    finally:
        conn.close()

def add_resume_to_index(resume_id: int, education: str, skills: str):
    """将单个简历添加到现有的FAISS索引中"""
    try:
        # 准备文本数据
        text = f"{education} {skills}"
        
        # 计算嵌入向量
        embedding = model.encode(text, convert_to_numpy=True)
        embedding = embedding.reshape(1, -1)
        
        # 加载现有索引和ID
        if os.path.exists(RESUME_FAISS_INDEX_PATH) and os.path.exists(RESUME_IDS_PATH):
            index = faiss.read_index(RESUME_FAISS_INDEX_PATH)
            resume_ids = np.load(RESUME_IDS_PATH)
            
            # 添加新向量到索引
            index.add(embedding)
            
            # 更新ID列表
            resume_ids = np.append(resume_ids, resume_id)
            
            # 保存更新后的索引和ID
            faiss.write_index(index, RESUME_FAISS_INDEX_PATH)
            np.save(RESUME_IDS_PATH, resume_ids)
            print(f"✅ 已将简历 ID {resume_id} 添加到FAISS索引中")
        else:
            # 如果索引不存在，创建新索引
            dimension = embedding.shape[1]
            index = faiss.IndexFlatIP(dimension)
            index.add(embedding)
            
            # 保存索引和ID
            faiss.write_index(index, RESUME_FAISS_INDEX_PATH)
            np.save(RESUME_IDS_PATH, np.array([resume_id]))
            print(f"✅ 已为简历 ID {resume_id} 创建新的FAISS索引")
            
    except Exception as e:
        print(f"❌ 添加简历到索引失败: {str(e)}")
        raise e

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='构建职位或简历的FAISS索引')
    parser.add_argument('--type', choices=['jobs', 'resumes', 'all'], default='all',
                      help='要构建的索引类型：jobs（职位）, resumes（简历）, all（两者都构建）')
    args = parser.parse_args()
    
    if args.type in ['jobs', 'all']:
        print("开始构建职位索引...")
        build_job_index()
    
    if args.type in ['resumes', 'all']:
        print("开始构建简历索引...")
        build_resume_index()
    print("索引构建完成")

