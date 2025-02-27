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
    """解析 PDF 简历"""
    temp_path = "temp_resume.pdf"

    # ✅ **写入临时 PDF 文件**
    with open(temp_path, "wb") as f:
        f.write(content)

    # ✅ **使用 `with` 确保文件正确关闭**
    with fitz.open(temp_path) as doc:
        text = "\n".join([page.get_text("text") for page in doc])

    os.remove(temp_path)  # ✅ 关闭后删除 PDF 文件
    return text.strip()


def extract_name(text):
    """优先从 'Name:' 提取姓名，否则使用 spaCy 或正则匹配第一行"""

    # ✅ 1️⃣ **检查 `Name:` 关键字**
    name_match = re.search(r"(?i)\bName\s*:\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)", text)
    if name_match:
        return name_match.group(1).strip()  # ✅ **确保只获取 `Name:` 后面的文本**

    # ✅ 2️⃣ **尝试用 spaCy 识别人名**
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text.strip()

    # ✅ 3️⃣ **如果 `spaCy` 也失败，尝试匹配第一行可能的姓名**
    first_line = text.strip().split("\n")[0]
    first_name_match = re.search(r"([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)", first_line)

    return first_name_match.group(1).strip() if first_name_match else "N/A"


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
    """解析简历（支持 TXT & PDF）"""
    if filename.endswith(".txt"):
        text = extract_text_from_txt(content)
    elif filename.endswith(".pdf"):
        text = extract_text_from_pdf(content)
    else:
        return {"error": "Only .txt and .pdf files are supported"}

    parsed_resume = {
        "name": extract_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "education": extract_education(text),
        "skills": extract_skills(text),
    }

    save_to_db(parsed_resume)  # ✅ 存入 `database/resumes.db`
    return parsed_resume
