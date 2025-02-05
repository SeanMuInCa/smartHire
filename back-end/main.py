from fastapi import FastAPI, File, UploadFile, HTTPException
from service.resume_parser import parse_resume

# 创建 FastAPI 实例
app = FastAPI()

@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    """
    解析 TXT 简历文件，提取姓名、邮箱、电话、教育背景、技能等信息。
    """
    # 检查文件扩展名是否为 .txt
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Only .txt files are supported")

    # 读取上传的文件内容
    try:
        content = await file.read()
        parsed_resume = parse_resume(content, file.filename)  # 调用解析函数
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing the file: {str(e)}")

    return {"parsed_resume": parsed_resume}
