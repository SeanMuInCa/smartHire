import pandas as pd
import sqlite3

import kagglehub

# Download latest version
path = kagglehub.dataset_download("promptcloud/indeed-job-posting-dataset")

print("Path to dataset files:", path)

# **加载 Kaggle 数据**
df = pd.read_csv(path+"/home/sdf/marketing_sample_for_trulia_com-real_estate__20190901_20191031__30k_data.csv")  # ✅ 替换成你的 Kaggle 数据文件

# **选择重要的字段**
df = df[["Job Title", "Job Description", "Job Type", "Categories", "Location", "Company Name", "Industry"]]
print(df)
# **连接 SQLite 数据库**
conn = sqlite3.connect('jobs.db')
cursor = conn.cursor()

# **手动创建 `jobs` 表**
cursor.execute('''
    CREATE TABLE jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ✅ 自动生成 ID
        job_title TEXT,
        job_description TEXT,
        job_type TEXT,
        categories TEXT,
        location TEXT,
        company_name TEXT,
        industry TEXT
    )
''')

# **手动插入数据**
for _, row in df.iterrows():
    cursor.execute('''
        INSERT INTO jobs (job_title, job_description, job_type, categories, location, company_name, industry)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        row["Job Title"], row["Job Description"], row["Job Type"],
        row["Categories"], row["Location"], row["Company Name"], row["Industry"]
    ))

conn.commit()
conn.close()

print("✅ `jobs.db` 重新创建，并成功插入数据！")
