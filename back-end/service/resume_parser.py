import re
import sqlite3
import os
import spacy

# 加载 spaCy 预训练 NLP 模型（支持实体识别）
nlp = spacy.load("en_core_web_sm")

def extract_text_from_txt(content: bytes):
    """解析 TXT 简历"""
    return content.decode("utf-8").strip()

def extract_name(text):
    """使用正则表达式匹配姓名"""
    name_pattern = re.compile(r"(?i)^\s*Name:\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)", re.MULTILINE)
    match = name_pattern.search(text)
    return match.group(1).strip() if match else "N/A"


def extract_email(text):
    """提取邮箱"""
    email_pattern = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
    match = email_pattern.search(text)
    return match.group(0) if match else "N/A"

def extract_phone(text):
    """提取电话号码"""
    phone_pattern = re.compile(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
    match = phone_pattern.search(text)
    return match.group(0) if match else "N/A"


def extract_education(text):
    """使用正则表达式匹配教育背景"""
    education_pattern = re.compile(r"(?i)Education:\s*([\s\S]+?)(?=\n(?:Skills?:|\Z))", re.MULTILINE)
    match = education_pattern.search(text)

    if match:
        education_text = match.group(1)

        # 以换行、逗号、分号分割教育信息
        education_list = re.split(r"[\n;,]+", education_text)
        education_list = [edu.strip().lstrip("-").strip() for edu in education_list if edu.strip()]

        return education_list if education_list else ["N/A"]

    return ["N/A"]


def extract_skills(text):
    """使用正则表达式从 'Skills:' 段落提取技能"""
    skills_pattern = re.compile(r"(?i)Skills?:\s*([\s\S]+?)(?:\n\n|\Z)")
    match = skills_pattern.search(text)

    if match:
        # 提取技能部分文本
        skills_text = match.group(1)

        # 以逗号、分号、换行、制表符等分隔技能
        skills_list = re.split(r"[,\n;\t]+", skills_text)

        # 去除空白字符，并返回去重后的技能列表
        skills_list = [skill.strip() for skill in skills_list if skill.strip()]
        return list(set(skills_list)) if skills_list else ["N/A"]

    return ["N/A"]


BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # 获取当前脚本的目录
DB_PATH = os.path.join(BASE_DIR, "resumes.db")  # 数据库存储在当前目录

def save_to_db(parsed_resume):
    """存储解析后的简历数据到 SQLite"""
    conn = sqlite3.connect(DB_PATH)  # 使用绝对路径
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO resumes (name, email, phone, education, skills)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        parsed_resume["name"],
        parsed_resume["email"],
        parsed_resume["phone"],
        "; ".join(parsed_resume["education"]),
        "; ".join(parsed_resume["skills"])
    ))

    conn.commit()
    conn.close()
    print("Resume saved to database!")

def parse_resume(content: bytes, filename: str):
    """解析 TXT 简历，提取信息并存入数据库"""
    if not filename.endswith(".txt"):
        return {"error": "Only .txt files are supported"}

    text = extract_text_from_txt(content)

    parsed_resume = {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "education": extract_education(text),
        "skills": extract_skills(text),
    }

    save_to_db(parsed_resume)  # 存入数据库
    return parsed_resume

