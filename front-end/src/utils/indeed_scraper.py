# indeed_scraper.py

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import json
import time

def scrape_indeed_jobs():
    # 获取已打开的Chrome浏览器
    driver = webdriver.Chrome()
    
    # 访问Indeed网站
    driver.get("https://ca.indeed.com/")
    
    # 等待职位列表加载
    wait = WebDriverWait(driver, 10)
    job_list = wait.until(EC.presence_of_all_elements_located((By.CLASS_NAME, "job_seen_beacon")))
    
    jobs_data = []
    
    # 获取前10个职位信息
    for i in range(min(10, len(job_list))):
        try:
            # 点击职位列表项
            job_list[i].click()
            time.sleep(2)  # 等待详情加载
            
            # 获取职位详情
            job_title = driver.find_element(By.CLASS_NAME, "jobsearch-JobInfoHeader-title").text
            company = driver.find_element(By.CLASS_NAME, "jobsearch-CompanyInfoContainer").text
            description = driver.find_element(By.CLASS_NAME, "jobsearch-jobDescriptionText").text
            
            job_info = {
                "title": job_title,
                "company": company,
                "description": description
            }
            
            jobs_data.append(job_info)
            
        except Exception as e:
            print(f"获取第{i+1}个职位信息时出错: {str(e)}")
            continue
    
    # 保存数据到JSON文件
    with open("indeed_jobs.json", "w", encoding="utf-8") as f:
        json.dump(jobs_data, f, ensure_ascii=False, indent=4)
    
    print("数据已保存到indeed_jobs.json文件中")
    driver.quit()

if __name__ == "__main__":
    scrape_indeed_jobs()