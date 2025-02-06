import sqlite3

# 连接数据库（如果文件不存在，则创建）
conn = sqlite3.connect("jobs.db")
cursor = conn.cursor()

# 创建 `jobs` 表
cursor.execute('''
    CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_title TEXT,
        employment_type TEXT,
        pay_rate REAL,
        currency TEXT,
        location TEXT,
        work_schedule TEXT,
        job_description TEXT,
        required_skills TEXT,
        degree_requirement TEXT,
        language_requirement TEXT,
        key_qualifications TEXT,
        benefits TEXT,
        application_process TEXT
    )
''')

# 提交更改并关闭连接
conn.commit()
conn.close()

print("✅ 数据库 `jobs.db` 已创建，并初始化 `jobs` 表！")
