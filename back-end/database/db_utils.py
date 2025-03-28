import sqlite3
import os
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "recruitment.db")

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 让查询结果可以通过列名访问
    return conn

def save_job_requirement(job_data: Dict[str, Any]) -> int:
    """保存职位需求"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO job_requirements (
            title, required_skills, experience, education, location, description
        ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            job_data["title"],
            ",".join(job_data["requiredSkills"]),
            job_data["experience"],
            job_data["education"],
            job_data["location"],
            job_data["description"]
        ))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def get_all_candidates() -> List[Dict[str, Any]]:
    """获取所有候选人"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        SELECT id, name, email, phone, education, skills
        FROM candidates
        """)
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()

def save_candidate_vector(candidate_id: int, vector_data: bytes):
    """保存候选人简历的向量表示"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO resume_vectors (candidate_id, vector_data)
        VALUES (?, ?)
        """, (candidate_id, vector_data))
        conn.commit()
    finally:
        conn.close() 