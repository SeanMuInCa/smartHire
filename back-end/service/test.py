import sqlite3


def get_all_resumes():
    """查询数据库中的所有简历"""
    conn = sqlite3.connect("resumes.db")
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM resumes")
    resumes = cursor.fetchall()

    conn.close()

    for resume in resumes:
        print(resume)  # 输出每一条数据
