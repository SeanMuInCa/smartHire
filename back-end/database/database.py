import sqlite3

from service.resume_parser import DB_PATH


def init_db():
    """初始化 SQLite 数据库，创建 resumes 表"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            phone TEXT,
            education TEXT,
            skills TEXT
        )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized successfully!")


# 运行一次，确保表存在
init_db()
