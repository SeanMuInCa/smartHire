import { Work } from "./types";

const EXPERIENCE_KEYWORDS = [
  "experience",
  "employment",
  "work history",
  "工作经验",
  "工作经历",
  "实习经历",
];

const POSITION_KEYWORDS = [
  "position",
  "title",
  "role",
  "职位",
  "岗位",
];

export const extractExperience = (text: string): Work[] => {
  const lines = text.split("\n");
  const experience: Work[] = [];
  let currentWork: Partial<Work> = {};
  let isInExperienceSection = false;
  let currentHighlights: string[] = [];

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // 检查是否进入工作经验部分
    if (EXPERIENCE_KEYWORDS.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
      isInExperienceSection = true;
      continue;
    }

    // 如果不在工作经验部分且已经有记录，说明工作经验部分结束
    if (!isInExperienceSection && experience.length > 0) {
      break;
    }

    if (isInExperienceSection && line.trim()) {
      // 检查是否是新的工作经历（通常包含公司名称和日期）
      if (line.includes("Company") || line.includes("公司") || /\d{4}/.test(line)) {
        // 保存之前的工作经历
        if (Object.keys(currentWork).length > 0) {
          currentWork.highlights = currentHighlights;
          experience.push(currentWork as Work);
          currentHighlights = [];
        }
        currentWork = { name: line.trim() };
      }
      // 检查是否包含职位信息
      else if (POSITION_KEYWORDS.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
        currentWork.position = line.replace(/^[^:：]*[：:]\s*/, "").trim();
      }
      // 检查是否包含日期信息
      else if (/\d{4}/.test(line)) {
        const dates = line.match(/\d{4}/g);
        if (dates) {
          currentWork.startDate = dates[0];
          currentWork.endDate = dates[1] || "Present";
        }
      }
      // 其他内容作为工作描述
      else if (line.trim().length > 10) {
        currentHighlights.push(line.trim());
      }
    }
  }

  // 添加最后一条工作经历
  if (Object.keys(currentWork).length > 0) {
    currentWork.highlights = currentHighlights;
    experience.push(currentWork as Work);
  }

  return experience;
};
