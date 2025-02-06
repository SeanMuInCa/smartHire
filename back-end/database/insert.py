import json
import sqlite3

# 读取 JSON 数据
with open("job_data.json", "r", encoding="utf-8") as f:
    job_list = json.load(f)  # ✅ job_list 是一个 "list"，里面有多个 "dict"

def insert_jobs_to_db(jobs):
    """批量插入职位数据到数据库"""
    conn = sqlite3.connect("jobs.db")
    cursor = conn.cursor()

    for job in jobs:  # ✅ 遍历列表，每个 job 是一个字典
        cursor.execute('''
            INSERT INTO jobs (
                job_title, employment_type, pay_rate, currency, location, work_schedule,
                job_description, required_skills, degree_requirement, language_requirement,
                key_qualifications, benefits, application_process
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            job["job_title"], job["employment_type"], job["pay_rate"]["base"], job["pay_rate"]["currency"],
            job["location"], json.dumps(job["work_schedule"]), job["job_description"],
            ", ".join(job["required_skills"]), job["degree_requirement"], job["language_requirement"],
            ", ".join(job["key_qualifications"]), ", ".join(job["benefits"]),
            json.dumps(job["application_process"])
        ))

    conn.commit()
    conn.close()
    print(f"✅ {len(jobs)} 条职位数据已成功存入数据库！")

# 插入所有职位
insert_jobs_to_db(job_list)
