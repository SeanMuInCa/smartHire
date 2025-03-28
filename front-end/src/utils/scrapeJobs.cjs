const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://ca.indeed.com/');

  // 确保页面加载完成
  await page.waitForSelector('.jobsearch-SerpJobCard');

  const jobDetails = [];

  for (let i = 0; i < 10; i++) {
    // 点击左侧的职位列表项
    await page.click(`.jobsearch-SerpJobCard:nth-child(${i + 1})`);

    // 等待右侧的职位详情加载
    await page.waitForSelector('.jobsearch-JobComponent');

    // 获取职位详情
    const jobDetail = await page.evaluate(() => {
      const title = document.querySelector('.jobsearch-JobInfoHeader-title')?.innerText || '';
      const company = document.querySelector('.jobsearch-InlineCompanyRating div:first-child')?.innerText || '';
      const location = document.querySelector('.jobsearch-JobInfoHeader-subtitle div')?.innerText || '';
      const description = document.querySelector('.jobsearch-jobDescriptionText')?.innerText || '';
      return { title, company, location, description };
    });

    jobDetails.push(jobDetail);

    // 返回到职位列表页面
    await page.goBack();
  }

  // 将数据保存为 JSON 文件
  fs.writeFileSync('jobDetails.json', JSON.stringify(jobDetails, null, 2));

  await browser.close();
})(); 