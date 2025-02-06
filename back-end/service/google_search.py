


# Google Custom Search API 信息
API_KEY = "AIzaSyDOtzEyd61389p6dPPa4unViH8e-C9TbSs"
SEARCH_ENGINE_ID = "33cb1045575a2475e"

import requests
import urllib.parse




def google_job_search(query, num_results=5):
    """使用 Google Custom Search API 搜索具体职位"""
    query = urllib.parse.quote(f"{query} ")  # ✅ 限制在 Indeed 但放宽关键词

    url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={API_KEY}&cx={SEARCH_ENGINE_ID}&num={num_results}&tbs=qdr:m"  # ✅ tbs=qdr:w 让 Google 只返回最近 1 周的岗位

    response = requests.get(url)

    print(f"🔍 [DEBUG] Google API 请求 URL: {url}")  # ✅ Debug 请求的 URL
    print(f"🔍 [DEBUG] Google API 返回的原始数据: {response.text}")  # ✅ Debug Google 返回的 JSON

    if response.status_code == 200:
        try:
            json_data = response.json()
            if "items" not in json_data:
                return {"error": "Google API 返回了空搜索结果"}
            results = json_data.get("items", [])

            # ✅ 保留所有搜索结果，确保不会过滤掉具体岗位
            job_list = [
                {"title": item.get("title"), "link": item.get("link"), "snippet": item.get("snippet")}
                for item in results
            ]

            return job_list if job_list else {"error": "未找到具体的职位信息"}

        except requests.exceptions.JSONDecodeError:
            return {"error": "无法解析 Google API 返回的数据"}
    else:
        return {"error": f"Google API 请求失败，状态码: {response.status_code}"}
