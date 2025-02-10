import sqlite3
import os

# **确保数据库路径正确**
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "jobs.db")

def connect_db():
    """创建数据库连接"""
    return sqlite3.connect(DB_PATH)

def create_tables():
    """初始化数据库表"""
    conn = connect_db()
    cursor = conn.cursor()

    # **重新创建 `jobs` 表，确保包含 `company` 字段**
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_title TEXT,
            company TEXT,
            location TEXT,
            job_description TEXT,
            required_skills TEXT
        )
    ''')
    conn.commit()
    conn.close()
    print("✅ 数据库 jobs.db 已更新！")


def get_jobs():
    """获取所有职位数据"""
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, job_description FROM jobs")  # ✅ 确保 `job_description` 字段存在
    jobs = cursor.fetchall()

    conn.close()
    return jobs

if __name__ == "__main__":
    create_tables()
