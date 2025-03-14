import { Skill } from "./types";
import { COMMON_TECHNOLOGIES } from "./constants";

const SKILLS_KEYWORDS = [
  "skills",
  "technologies",
  "technical skills",
  "技能",
  "技术栈",
  "专业技能",
];

export const extractSkills = (text: string): Skill[] => {
  const lines = text.split("\n");
  const skills: Skill[] = [];
  let isInSkillsSection = false;
  const foundSkills = new Set<string>();

  // 首先从技能部分提取
  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // 检查是否进入技能部分
    if (SKILLS_KEYWORDS.some(keyword => lowerLine.includes(keyword.toLowerCase()))) {
      isInSkillsSection = true;
      continue;
    }

    // 如果不在技能部分且已经有技能记录，说明技能部分结束
    if (!isInSkillsSection && skills.length > 0) {
      break;
    }

    if (isInSkillsSection && line.trim()) {
      // 将行分割成单独的技能
      const lineSkills = line
        .split(/[,，、;\s]+/)
        .map(s => s.trim())
        .filter(s => s.length >= 2);

      lineSkills.forEach(skill => {
        if (!foundSkills.has(skill)) {
          foundSkills.add(skill);
          skills.push({ name: skill });
        }
      });
    }
  }

  // 然后从全文中查找常见技术关键词
  COMMON_TECHNOLOGIES.forEach(tech => {
    const regex = new RegExp(tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(text) && !foundSkills.has(tech)) {
      foundSkills.add(tech);
      skills.push({ name: tech });
    }
  });

  return skills;
};
