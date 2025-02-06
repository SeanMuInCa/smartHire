import requests
import urllib.parse  # 用于 URL 编码

# Google Custom Search API 信息
API_KEY = "AIzaSyDOtzEyd61389p6dPPa4unViH8e-C9TbSs"
SEARCH_ENGINE_ID = "33cb1045575a2475e"

def google_job_search(query, num_results=5):
    """
    使用 Google Custom Search API 搜索职位信息
    :param query: 搜索关键字 (例如 "Python Developer jobs in Canada")
    :param num_results: 返回的结果数量
    :return: 匹配的职位信息列表
    """

    # 使用用户输入的 query，而不是硬编码
    query = urllib.parse.quote(query)  # 对查询进行 URL 编码

    url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={API_KEY}&cx={SEARCH_ENGINE_ID}&num={num_results}"
    response = requests.get(url)

    if response.status_code == 200:
        results = response.json().get("items", [])
        job_list = []

        for item in results:
            job_list.append({
                "title": item.get("title"),
                "link": item.get("link"),
                "snippet": item.get("snippet")  # 简要描述
            })

        return job_list

    else:
        return {"error": f"Failed to fetch data. Status code: {response.status_code}"}
