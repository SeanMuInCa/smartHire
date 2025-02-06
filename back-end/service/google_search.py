
import requests
import urllib.parse  # 进行 URL 编码

# Google Custom Search API 信息
API_KEY = "AIzaSyDOtzEyd61389p6dPPa4unViH8e-C9TbSs"
SEARCH_ENGINE_ID = "33cb1045575a2475e"

def google_job_search(query, num_results=5):
    """
    使用 Google Custom Search API 搜索职位信息
    :param query: 用户输入的查询字符串 (例如 "Python Developer jobs in Canada")
    :param num_results: 需要返回的结果数量
    :return: 匹配的职位信息列表
    """
    print(f"🔎in function query: {query}")
    # ✅ 添加 `tbs=qdr:s` 强制 Google 返回最新结果
    url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={API_KEY}&cx={SEARCH_ENGINE_ID}"

    response = requests.get(url)

    job_descriptions = []


        # 将招聘标题作为职位描述（如果没有完整描述可用）

    results = response.json()
    for item in results.get('items', []):
        title = item.get('title', '')
        link = item.get('link', '')
        job_descriptions.append((title, link))

    return job_descriptions


