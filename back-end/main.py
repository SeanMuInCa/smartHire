from fastapi import FastAPI, UploadFile, File
from service.embedding import generate_embedding
from database.faiss_db import search_similar_jobs
import faiss
import numpy as np

app = FastAPI()

# 载入 FAISS 索引
index = faiss.read_index("database/job_embeddings.faiss")

@app.post("/upload_resume/")
async def upload_resume(file: UploadFile = File(...)):
    content = await file.read()
    embedding = generate_embedding(content.decode("utf-8"))
    scores, indices = search_similar_jobs(embedding, index)
    return {"matches": [{"score": float(s), "job_id": int(i)} for s, i in zip(scores[0], indices[0])]}

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Recruitment Backend!"}
