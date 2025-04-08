import re
import sqlite3
import os
import fitz  # ✅ PyMuPDF 用于解析 PDF
import spacy
from .matching import add_resume_to_index

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


def extract_name(text, file_type="pdf"):
    """提取姓名"""
    try:
        if file_type == "pdf":
            # ✅ **尝试匹配以 `Name:` 为前缀的姓名**
            match = re.search(r"Name:\s*(.+?)(?:\s+[A-Z][a-z]+:|$|\n)", text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
    except Exception as e:
        print(f"Error extracting name: {e}")
    
    # ✅ 如果没找到或出错，使用 spaCy 提取人名
    doc = nlp(text[:1000])  # ✅ 仅处理开头部分
    
    # ✅ **寻找 PERSON 实体**
    for ent in doc.ents:
        if ent.label_ == "PERSON":
            return ent.text
            
    # ✅ 如果还是没找到，取首行或者返回默认名称
    first_line = text.split("\n")[0].strip()
    if first_line and len(first_line) < 50:  # 避免首行是很长的描述文本
        return first_line
        
    return "Candidate"  # 默认名称


def extract_email(text):
    """提取邮箱"""
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else "N/A"


def extract_phone(text):
    """提取电话"""
    patterns = [
        r"\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",  # +1 (123) 456-7890 或变体
        r"\d{3}[-.\s]?\d{3}[-.\s]?\d{4}",  # 123-456-7890 或变体
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
            
    return "N/A"


def extract_education(text):
    """提取教育信息"""
    education = []
    
    # ✅ **搜索教育相关段落**
    education_section = re.search(r"(?:EDUCATION|Education|学历)(?:.*?)(?=EXPERIENCE|Experience|工作经验|SKILLS|Skills|技能|\Z)", text, re.DOTALL)
    if education_section:
        edu_text = education_section.group(0)
        
        # ✅ **分割为条目**
        items = re.split(r"\n\s*\n|\n(?=[A-Z])", edu_text)
        
        for item in items:
            if len(item.strip()) > 10 and ("university" in item.lower() or "college" in item.lower() or "bachelor" in item.lower() or "master" in item.lower() or "phd" in item.lower() or "degree" in item.lower() or "diploma" in item.lower()):
                education.append(item.strip())
    
    # ✅ **如果没有找到教育信息，使用关键词匹配**
    if not education:
        keywords = ["Bachelor", "Master", "PhD", "University", "College", "Degree", "Diploma"]
        lines = text.split("\n")
        
        for line in lines:
            if any(keyword.lower() in line.lower() for keyword in keywords) and len(line.strip()) > 10:
                education.append(line.strip())
    
    return education if education else ["Not specified"]


def extract_skills(text):
    """提取技能信息"""
    skills = []
    
    # ✅ **搜索技能相关段落**
    skills_section = re.search(r"(?:SKILLS|Skills|技能)(?:.*?)(?=EXPERIENCE|Experience|工作经验|EDUCATION|Education|PROJECT|Project|项目|\Z)", text, re.DOTALL)
    
    if skills_section:
        skill_text = skills_section.group(0)
        
        # ✅ **匹配技能（含编程语言、工具、框架）**
        common_skills = [
            "Python", "Java", "JavaScript", "React", "Vue", "Angular", "Node.js", "Express", 
            "Django", "Flask", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Docker", 
            "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Git", "HTML", "CSS", "PHP", "Ruby",
            "C\\+\\+", "C#", "Swift", "Kotlin", "Go", "Rust", "TypeScript", "TensorFlow", 
            "PyTorch", "Pandas", "NumPy", "SciPy", "Scikit-learn", "MATLAB", "R"
        ]
        
        pattern = r"\b(" + "|".join(common_skills) + r")\b"
        found_skills = re.findall(pattern, skill_text, re.IGNORECASE)
        
        # ✅ **添加找到的技能**
        for skill in found_skills:
            if skill not in skills:
                skills.append(skill)
    
    # ✅ **如果在技能段落中没找到，在整个文本中搜索**
    if not skills:
        common_skills = [
            "Python", "Java", "JavaScript", "React", "Vue", "Angular", "Node.js", "Express", 
            "Django", "Flask", "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Docker", 
            "Kubernetes", "AWS", "Azure", "GCP", "Linux", "Git", "HTML", "CSS", "PHP", "Ruby",
            "C\\+\\+", "C#", "Swift", "Kotlin", "Go", "Rust", "TypeScript", "TensorFlow", 
            "PyTorch", "Pandas", "NumPy", "SciPy", "Scikit-learn", "MATLAB", "R", "Machine Learning", 
            "Deep Learning", "AI", "Data Science", "Data Analysis", "Big Data", "Hadoop", "Spark"
        ]
        
        pattern = r"\b(" + "|".join(common_skills) + r")\b"
        found_skills = re.findall(pattern, text, re.IGNORECASE)
        
        for skill in found_skills:
            if skill not in skills:
                skills.append(skill)
    
    return skills if skills else ["General"]


# ✅ **数据库路径**
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "database"))
DB_PATH = os.path.join(BASE_DIR, "resumes.db")


def save_to_db(parsed_resume):
    """存储解析后的简历数据到 SQLite"""
    try:
        print(f"开始保存简历到数据库，解析结果：{parsed_resume}")
        
        if not os.path.exists(BASE_DIR):
            os.makedirs(BASE_DIR)
            print(f"创建数据库目录：{BASE_DIR}")

        print(f"连接数据库：{DB_PATH}")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 创建 resumes 表（如果不存在）
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
        print("确保数据库表已创建")

        # 插入数据
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
        
        # 获取新插入的简历ID
        resume_id = cursor.lastrowid
        print(f"简历已插入数据库，ID：{resume_id}")
        
        conn.commit()
        conn.close()
        
        # 更新FAISS索引
        try:
            add_resume_to_index(
                resume_id=resume_id,
                education="; ".join(parsed_resume["education"]),
                skills="; ".join(parsed_resume["skills"])
            )
            print(f"✅ 简历已保存到数据库并更新FAISS索引")
            return resume_id
        except Exception as e:
            print(f"⚠️ 简历已保存到数据库但FAISS索引更新失败: {str(e)}")
            return resume_id
            
    except Exception as e:
        print(f"❌ 保存简历到数据库失败: {str(e)}")
        if 'conn' in locals():
            conn.close()
        raise e


def save_parsed_resume(parsed_data):
    """保存前端解析的简历数据到数据库"""
    try:
        print(f"准备保存前端解析的简历数据：{parsed_data['name']}")
        
        # 确保数据库目录存在
        if not os.path.exists(BASE_DIR):
            os.makedirs(BASE_DIR)
            print(f"创建数据库目录：{BASE_DIR}")

        # 连接数据库
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 创建 resumes 表（如果不存在）
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

        # 插入数据
        cursor.execute('''
            INSERT INTO resumes (name, email, phone, education, skills)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            parsed_data["name"],
            parsed_data["email"],
            parsed_data["phone"],
            "; ".join(parsed_data["education"]),
            "; ".join(parsed_data["skills"])
        ))
        
        # 获取新插入的简历ID
        resume_id = cursor.lastrowid
        print(f"简历已插入数据库，ID：{resume_id}")
        
        conn.commit()
        conn.close()
        
        # 更新FAISS索引
        try:
            add_resume_to_index(
                resume_id=resume_id,
                education="; ".join(parsed_data["education"]),
                skills="; ".join(parsed_data["skills"])
            )
            print(f"✅ 前端解析的简历已保存到数据库并更新FAISS索引")
            return resume_id
        except Exception as e:
            print(f"⚠️ 前端解析的简历已保存到数据库但FAISS索引更新失败: {str(e)}")
            return resume_id
            
    except Exception as e:
        print(f"❌ 保存前端解析的简历到数据库失败: {str(e)}")
        if 'conn' in locals():
            conn.close()
        raise e


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
