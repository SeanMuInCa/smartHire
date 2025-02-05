from fastapi import FastAPI, File, UploadFile
from service.resume_parser import parse_resume

app = FastAPI()

@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    """
    解析 TXT 简历文件，提取姓名、邮箱、电话、教育背景、技能等信息。
    """
    if not file.filename.endswith(".txt"):
        return {"error": "Only .txt files are supported"}

    content = await file.read()
    parsed_resume = parse_resume(content, file.filename)

    return {"parsed_resume": parsed_resume}
