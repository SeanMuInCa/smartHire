import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "jobs.db")


def insert_sample_jobs():
    """插入示例职位数据"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    sample_jobs = [
        ("Software Developer - AI Trainer", "AI Solutions Inc.", "Remote",
         "Train AI models by coding diverse problems and evaluating chatbot responses.",
         "Python, JavaScript, C++, SQL, Machine Learning, Deep Learning"),

        ("Machine Learning Engineer", "Google", "San Francisco, CA",
         "Develop and optimize ML models for large-scale applications.",
         "Python, TensorFlow, PyTorch, Deep Learning, NLP"),

        ("Data Scientist", "Amazon", "Seattle, WA",
         "Analyze customer behavior and optimize recommendation algorithms.",
         "Python, SQL, Statistics, Big Data, AWS"),

        ("AI Researcher", "OpenAI", "New York, NY",
         "Work on cutting-edge research in Natural Language Processing (NLP).",
         "Deep Learning, PyTorch, NLP, Transformers"),

        ("Software Engineer", "Meta", "Menlo Park, CA",
         "Develop scalable backend systems for AI-driven applications.",
         "JavaScript, Node.js, React, SQL, AWS"),

        ("Data Analyst", "Microsoft", "Redmond, WA",
         "Process and analyze data to drive strategic business decisions.",
         "SQL, Excel, Python, Power BI, Tableau"),

        ("NLP Engineer", "AI Startups Inc.", "Boston, MA",
         "Develop and fine-tune NLP models for chatbot interactions.",
         "Python, Transformers, GPT-4, Text Classification"),

        ("Computer Vision Engineer", "Tesla", "Palo Alto, CA",
         "Enhance self-driving car AI through image processing.",
         "Python, OpenCV, Deep Learning, TensorFlow, CNNs"),

        ("Cybersecurity Analyst", "IBM", "Austin, TX",
         "Monitor and prevent security threats using AI-enhanced analytics.",
         "Network Security, Python, Ethical Hacking, SIEM, Cloud Security"),

        ("Frontend Developer", "Spotify", "Remote",
         "Develop and optimize UI components for an AI-powered music recommendation system.",
         "React, TypeScript, CSS, Web Accessibility, Figma")
    ]

    cursor.executemany('''
        INSERT INTO jobs (job_title, company, location, job_description, required_skills)
        VALUES (?, ?, ?, ?, ?)
    ''', sample_jobs)

    conn.commit()
    conn.close()
    print("✅ 示例职位数据已插入！")


if __name__ == "__main__":
    insert_sample_jobs()
