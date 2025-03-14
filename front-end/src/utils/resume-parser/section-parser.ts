import { EDUCATION_KEYWORDS, EXPERIENCE_KEYWORDS, SKILLS_KEYWORDS } from './constants';

interface Section {
  title: string;
  content: string;
}

export const findSectionsByKeywords = (text: string, keywords: string[]): Section[] => {
  const lines = text.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 检查是否是新的部分标题
    const isNewSection = keywords.some(keyword => 
      line.toLowerCase().includes(keyword.toLowerCase()) &&
      line.length < 50 // 标题通常较短
    );

    if (isNewSection) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { title: line, content: '' };
    } else if (currentSection) {
      currentSection.content += line + '\n';
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
};

export const extractSections = (text: string) => {
  return {
    education: findSectionsByKeywords(text, EDUCATION_KEYWORDS),
    experience: findSectionsByKeywords(text, EXPERIENCE_KEYWORDS),
    skills: findSectionsByKeywords(text, SKILLS_KEYWORDS),
  };
};
