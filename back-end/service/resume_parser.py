import re
import spacy

# 加载 spaCy 预训练 NLP 模型（支持实体识别）
nlp = spacy.load("en_core_web_sm")

def extract_text_from_txt(content: bytes):
    """解析 TXT 简历"""
    return content.decode("utf-8").strip()

def extract_name(text):
    """使用 NLP 提取姓名（基于文本开头）"""
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ == "PERSON":  # 识别人名
            return ent.text
    return "N/A"

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
    """自动提取教育背景"""
    education_keywords = ["Bachelor", "Master", "PhD", "BSc", "MSc", "BA", "MA", "BS", "MS", "Doctorate"]
    doc = nlp(text)
    education_list = [sent.text for sent in doc.sents if any(word in sent.text for word in education_keywords)]
    return education_list if education_list else ["N/A"]


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

def parse_resume(content: bytes, filename: str):
    """
    解析 TXT 简历，提取关键信息。
    """
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

    return parsed_resume
