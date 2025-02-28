import re
import sqlite3
import os
import fitz  # ✅ PyMuPDF 用于解析 PDF
import spacy

# ✅ 加载 spaCy 预训练 NLP 模型（支持实体识别）
nlp = spacy.load("en_core_web_sm")


def extract_text_from_txt(content: bytes):
    """解析 TXT 简历"""
    return content.decode("utf-8").strip()




def extract_text_from_pdf(content: bytes):
    """解析 PDF 简历，去除换行，确保 `Name:` 关键字后内容连贯"""
    temp_path = "temp_resume.pdf"

    # ✅ **写入临时 PDF**
    with open(temp_path, "wb") as f:
        f.write(content)

    text = []
    with fitz.open(temp_path) as doc:
        for page in doc:
            text.append(page.get_text("text").strip())  # ✅ 去掉前后空格

    os.remove(temp_path)  # ✅ 解析后删除 PDF

    clean_text = " ".join(text)  # ✅ **合并所有页文本，确保 `Name:` 关键字后内容不换行**
    return clean_text


def extract_name(text, file_type="txt"):
    """根据文件类型（TXT 或 PDF）选择不同的姓名提取方法"""

    # ✅ **先尝试匹配 `Name:` 后面的人名**
    name_match = re.search(r"(?i)\bName\s*:\s*([^\n,]*)", text)
    if name_match:
        extracted_name = name_match.group(1).strip()

        # ✅ **避免误匹配 Email**
        if "@" not in extracted_name and len(extracted_name.split()) <= 4:
            return extracted_name

    # ✅ **TXT 解析：尝试匹配第一行**
    if file_type == "txt":
        first_line = text.strip().split("\n")[0]
        first_name_match = re.search(r"([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)", first_line)
        if first_name_match:
            return first_name_match.group(1).strip()

    # ✅ **PDF 解析：使用 spaCy 提取人名**
    if file_type == "pdf":
        text = text.replace("\n", " ")  # ✅ 去掉换行符
        doc = nlp(text)

        for ent in doc.ents:
            if ent.label_ == "PERSON":
                return ent.text.strip()

    return "N/A"


def extract_email(text):
    """提取邮箱"""
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else "N/A"


def extract_phone(text):
    """提取电话号码"""
    match = re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    return match.group(0) if match else "N/A"


def extract_education(text):
    """使用正则表达式匹配教育背景"""
    education_keywords = ["Bachelor", "Master", "PhD", "BSc", "MSc", "BA", "MA", "BS", "MS", "Doctorate"]
    lines = text.split("\n")
    education = [line for line in lines if any(word in line for word in education_keywords)]
    return education if education else ["N/A"]


def extract_skills(text):
    """使用正则表达式从 'Skills:' 段落提取技能"""
    skills_pattern = re.compile(r"(?i)Skills?:\s*([\s\S]+?)(?:\n\n|\Z)")
    match = skills_pattern.search(text)

    if match:
        skills_text = match.group(1)
        skills_list = re.split(r"[,\n;\t]+", skills_text)
        return [skill.strip() for skill in skills_list if skill.strip()]

    return ["N/A"]


# ✅ **数据库路径**
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
DB_PATH = os.path.join(BASE_DIR, "resumes.db")


def save_to_db(parsed_resume):
    """存储解析后的简历数据到 SQLite"""
    if not os.path.exists(BASE_DIR):
        os.makedirs(BASE_DIR)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ✅ **创建 `resumes` 表（如果不存在）**
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
    print(f"✅ Resume saved to database: {DB_PATH}")


def parse_resume(content: bytes, filename: str):
    """解析 TXT 和 PDF 简历"""
    if filename.endswith(".txt"):
        text = extract_text_from_txt(content)
        file_type = "txt"
    elif filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
        file_type = "pdf"
    else:
        return {"error": "Only .txt and .pdf files are supported"}

    parsed_resume = {
        "name": extract_name(text, file_type),  # ✅ **按不同文件类型解析姓名**
        "email": extract_email(text),
        "phone": extract_phone(text),
        "education": extract_education(text),
        "skills": extract_skills(text),
    }

    save_to_db(parsed_resume)  # ✅ 存入 `database/resumes.db`
    return parsed_resume
