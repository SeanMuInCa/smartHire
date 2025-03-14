import { Education } from "./types";

const EDUCATION_KEYWORDS = [
  "education",
  "academic",
  "degree",
  "university",
  "college",
  "school",
  "教育背景",
  "教育经历",
  "学历",
];

const DEGREE_KEYWORDS = [
  "bachelor",
  "master",
  "phd",
  "mba",
  "bs",
  "ba",
  "ms",
  "本科",
  "硕士",
  "博士",
  "学士",
];

export const extractEducation = (text: string): Education[] => {
  const lines = text.split("\n");
  const education: Education[] = [];
  let currentEducation: Partial<Education> = {};
  let isInEducationSection = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // 检查是否进入教育部分
    if (EDUCATION_KEYWORDS.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
      isInEducationSection = true;
      continue;
    }

    // 如果不在教育部分且已经有教育记录，说明教育部分结束
    if (!isInEducationSection && education.length > 0) {
      break;
    }

    if (isInEducationSection && line.trim()) {
      // 检查是否包含学校名称（通常包含 "University" 或 "大学"）
      if (line.includes("University") || line.includes("College") || line.includes("大学") || line.includes("学院")) {
        if (Object.keys(currentEducation).length > 0) {
          education.push(currentEducation as Education);
        }
        currentEducation = { institution: line.trim() };
      }
      // 检查是否包含学位信息
      else if (DEGREE_KEYWORDS.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
        currentEducation.studyType = line.trim();
      }
      // 检查是否包含专业信息
      else if (currentEducation.institution && !currentEducation.area) {
        currentEducation.area = line.trim();
      }
      // 检查是否包含日期信息
      else if (/\d{4}/.test(line)) {
        const dates = line.match(/\d{4}/g);
        if (dates) {
          currentEducation.startDate = dates[0];
          currentEducation.endDate = dates[1] || "Present";
        }
      }
    }
  }

  // 添加最后一条教育记录
  if (Object.keys(currentEducation).length > 0) {
    education.push(currentEducation as Education);
  }

  return education;
};
