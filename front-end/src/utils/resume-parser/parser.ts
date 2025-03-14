import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { version } from 'pdfjs-dist';
import { ParsedResume } from './types';
import { EDUCATION_KEYWORDS, EXPERIENCE_KEYWORDS, SKILLS_KEYWORDS, COMMON_TECHNOLOGIES } from './constants';

// 设置 PDF.js worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

interface TextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[];
  fontName: string;
}

interface Block {
  text: string;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
}

const extractTextFromPdf = async (file: File): Promise<Block[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument(arrayBuffer).promise;
  const blocks: Block[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    content.items.forEach((item: TextItem) => {
      if (!item.str.trim()) return;
      
      const fontSize = Math.sqrt(Math.pow(item.transform[0], 2) + Math.pow(item.transform[1], 2));
      const fontFamily = item.fontName.split('+').pop()?.toLowerCase() || '';
      const isBold = fontFamily.includes('bold') || fontFamily.includes('heavy') || fontFamily.includes('black');
      
      blocks.push({
        text: item.str.trim(),
        fontSize,
        fontFamily,
        isBold
      });
    });
  }
  
  return blocks;
};

const findSectionStart = (blocks: Block[], keywords: string[]): number => {
  return blocks.findIndex(block => 
    keywords.some(keyword => 
      block.text.toLowerCase().includes(keyword.toLowerCase()) && 
      (block.isBold || block.fontSize >= 12)
    )
  );
};

const extractSection = (blocks: Block[], startIdx: number, nextSectionIdx: number): string[] => {
  const sectionContent: string[] = [];
  let currentLine = '';
  
  for (let i = startIdx + 1; i < (nextSectionIdx === -1 ? blocks.length : nextSectionIdx); i++) {
    const block = blocks[i];
    if (block.fontSize >= 12 || block.isBold) {
      if (currentLine) {
        sectionContent.push(currentLine);
        currentLine = '';
      }
      currentLine = block.text;
    } else {
      currentLine += ' ' + block.text;
    }
  }
  
  if (currentLine) {
    sectionContent.push(currentLine);
  }
  
  return sectionContent;
};

const extractSkillsFromText = (text: string): string[] => {
  const skills = new Set<string>();
  
  // 从文本中提取常见技术关键词
  COMMON_TECHNOLOGIES.forEach(tech => {
    const regex = new RegExp(tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(text)) {
      skills.add(tech);
    }
  });
  
  // 提取大写字母开头的单词（可能是技术名称）
  const words = text.split(/[\s,，、;；]+/);
  words.forEach(word => {
    if (/^[A-Z][a-zA-Z0-9+#]*$/.test(word) && word.length >= 2) {
      skills.add(word);
    }
  });
  
  return Array.from(skills);
};

export const parseResumeFromPdf = async (file: File): Promise<ParsedResume> => {
  try {
    console.log('开始解析PDF文件');
    const blocks = await extractTextFromPdf(file);
    
    // 查找各个部分的起始位置
    const educationStart = findSectionStart(blocks, EDUCATION_KEYWORDS);
    const experienceStart = findSectionStart(blocks, EXPERIENCE_KEYWORDS);
    const skillsStart = findSectionStart(blocks, SKILLS_KEYWORDS);
    
    // 提取基本信息（假设在文档开头）
    const basics = {
      name: blocks[0]?.text || '',
      email: blocks.find(b => b.text.includes('@'))?.text || '',
      phone: blocks.find(b => /[\d-+()]{10,}/.test(b.text))?.text || '',
      location: { address: '', postalCode: '', city: '', countryCode: '', region: '' }
    };
    
    // 提取各个部分的内容
    const educationContent = educationStart !== -1 ? 
      extractSection(blocks, educationStart, Math.min(...[experienceStart, skillsStart].filter(x => x > educationStart))) : [];
    
    const experienceContent = experienceStart !== -1 ?
      extractSection(blocks, experienceStart, Math.min(...[skillsStart].filter(x => x > experienceStart))) : [];
    
    const skillsContent = skillsStart !== -1 ?
      extractSection(blocks, skillsStart, blocks.length) : [];
    
    // 解析教育经历
    const education = educationContent.map(text => ({
      institution: text.split(',')[0] || '',
      area: text.split(',')[1] || '',
      studyType: text.match(/(?:bachelor|master|phd|本科|硕士|博士)/i)?.[0] || '',
      startDate: text.match(/\d{4}/)?.[0] || '',
      endDate: text.match(/\d{4}/g)?.[1] || 'Present'
    }));
    
    // 解析工作经验
    const work = experienceContent.map(text => ({
      name: text.split(/[,，]|(?=\d{4})/)[0] || '',
      position: text.match(/(?<=^|\s)(engineer|developer|manager|工程师|开发|经理)(?=\s|$)/i)?.[0] || '',
      startDate: text.match(/\d{4}/)?.[0] || '',
      endDate: text.match(/\d{4}/g)?.[1] || 'Present',
      highlights: [text]
    }));
    
    // 解析技能
    const allText = blocks.map(b => b.text).join(' ');
    const skills = extractSkillsFromText(allText).map(skill => ({
      name: skill
    }));
    
    const result: ParsedResume = {
      basics,
      education,
      work,
      skills
    };
    
    console.log('解析结果:', result);
    return result;
  } catch (error) {
    console.error('PDF 解析错误:', error);
    throw new Error('PDF 解析失败：' + (error as Error).message);
  }
}; 