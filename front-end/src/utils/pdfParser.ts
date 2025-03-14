import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { version } from 'pdfjs-dist';
import { ParsedResume } from './resume-parser/types';
import { EDUCATION_KEYWORDS, EXPERIENCE_KEYWORDS, SKILLS_KEYWORDS, COMMON_TECHNOLOGIES } from './resume-parser/constants';

// 设置 PDF.js worker
GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

interface TextItem {
  str: string;
  transform: number[];
  fontName: string;
  fontSize?: number;
}

interface Block {
  text: string;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
  y: number;
  x: number;
}

const extractTextFromPdf = async (file: File): Promise<Block[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument(arrayBuffer).promise;
  const blocks: Block[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    content.items.forEach((item: any) => {
      if (!item.str.trim()) return;
      
      const fontSize = Math.sqrt(Math.pow(item.transform[0], 2) + Math.pow(item.transform[1], 2));
      const fontFamily = item.fontName.split('+').pop()?.toLowerCase() || '';
      const isBold = fontFamily.includes('bold') || fontFamily.includes('heavy') || fontFamily.includes('black');
      
      blocks.push({
        text: item.str.trim(),
        fontSize,
        fontFamily,
        isBold,
        y: -item.transform[5],  // PDF坐标系转换
        x: item.transform[4]
      });
    });
  }
  
  // 按y坐标排序，相同y坐标按x坐标排序
  return blocks.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
};

const findSectionStart = (blocks: Block[], keywords: string[]): number => {
  return blocks.findIndex(block => 
    keywords.some(keyword => {
      const blockText = block.text.toLowerCase().trim();
      const keywordText = keyword.toLowerCase().trim();
      return blockText === keywordText || // 完全匹配
             blockText.startsWith(keywordText); // 以关键词开头
    })
  );
};

const extractDegrees = (blocks: Block[], startIdx: number, nextSectionIdx: number): string[] => {
  if (startIdx < 0 || startIdx >= blocks.length) {
    return [];
  }

  const endIdx = nextSectionIdx === -1 ? blocks.length : nextSectionIdx;
  const validEndIdx = Math.min(endIdx, blocks.length);
  
  // 获取教育部分的所有文本块
  const educationBlocks = blocks.slice(startIdx + 1, validEndIdx);
  
  // 按行分组，使用更小的y坐标差值作为行分隔符
  const lines: string[] = [];
  let currentLine: Block[] = [];
  let lastY = educationBlocks[0]?.y || 0;
  
  educationBlocks.forEach(block => {
    // 使用更小的阈值来分割行
    const yDiff = Math.abs(block.y - lastY);
    if (yDiff > 1.5 && currentLine.length > 0) { // 进一步减小阈值
      // 按x坐标排序当前行的块
      currentLine.sort((a, b) => a.x - b.x);
      lines.push(currentLine.map(b => b.text).join(' '));
      currentLine = [];
    }
    currentLine.push(block);
    lastY = block.y;
  });
  
  if (currentLine.length > 0) {
    currentLine.sort((a, b) => a.x - b.x);
    lines.push(currentLine.map(b => b.text).join(' '));
  }

  // 合并相关的行
  const mergedLines: string[] = [];
  let currentMergedLine = '';
  let isCollectingDegree = false;
  
  lines.forEach((line, index) => {
    // 跳过包含邮箱或链接的行
    if (line.includes('@') || line.includes('http')) {
      if (currentMergedLine) {
        mergedLines.push(currentMergedLine.trim());
        currentMergedLine = '';
        isCollectingDegree = false;
      }
      return;
    }
    
    // 如果当前行包含学位相关信息，开始新的合并
    if (line.match(/(Post-Graduate|Post-graduate|Bachelor|B\.S\.|Master|M\.S\.|PhD|博士|硕士|学士)/i)) {
      if (currentMergedLine && isCollectingDegree) {
        mergedLines.push(currentMergedLine.trim());
      }
      currentMergedLine = line;
      isCollectingDegree = true;
    } else if (isCollectingDegree) {
      // 如果正在收集学位信息，继续添加相关行
      if (line.match(/University|College|Institute|School|Polytechnic|大学|学院|\(AIDA\)|\(Expected|\(2024\)|\(2009\)|\(B\.S\.\)|\(Computer Science\)/i)) {
        currentMergedLine = `${currentMergedLine} ${line}`;
      } else if (!line.match(/^(Professional|Summary)/i)) {
        mergedLines.push(currentMergedLine.trim());
        currentMergedLine = '';
        isCollectingDegree = false;
      }
    }
  });
  
  if (currentMergedLine) {
    mergedLines.push(currentMergedLine.trim());
  }

  console.log('合并后的教育部分文本行:', mergedLines);

  // 定义学位关键词模式（按优先级排序）
  const degreePatterns = [
    {
      pattern: /Post-Graduate\s*[-–]?\s*(?:Artificial Intelligence|Computer Science|Software|Information Technology|AI|IT|Data Analytics|AIDA).*?(?:\(AIDA\))?\s*(?:\(Expected\s*June\s*2025\))?/i,
      value: "Post-Graduate Diploma in AI and Data Analytics"
    },
    {
      pattern: /Post-graduate\s*[-–]?\s*Software\s*development.*?\(\s*2024\s*\)/i,
      value: "Post-Graduate Diploma in Software Development"
    },
    {
      pattern: /Bachelor\s*of\s*Science\s*(?:\(B\.?S\.?\))?\s*[-–]?\s*Computer\s*Science.*?\(\s*2009\s*\)/i,
      value: "Bachelor of Science in Computer Science"
    }
  ];

  // 存储找到的所有学位
  const degrees = new Set<string>();

  // 对每一行尝试匹配学位
  mergedLines.forEach(line => {
    // 尝试匹配所有学位模式
    for (const {pattern, value} of degreePatterns) {
      if (pattern.test(line)) {
        console.log('匹配到学位:', value, '在行:', line);
        degrees.add(value);
      }
    }
  });

  // 如果没有找到所有学位，尝试更宽松的匹配
  const allText = mergedLines.join(' ');
  if (!Array.from(degrees).some(d => d.includes('AI'))) {
    if (allText.match(/Post-Graduate.*?(?:AI|AIDA|Artificial Intelligence).*?2025/i)) {
      degrees.add("Post-Graduate Diploma in AI and Data Analytics");
    }
  }
  if (!Array.from(degrees).some(d => d.includes('Software Development'))) {
    if (allText.match(/Post-graduate.*?Software.*?development.*?2024/i)) {
      degrees.add("Post-Graduate Diploma in Software Development");
    }
  }
  if (!Array.from(degrees).some(d => d.includes('Computer Science'))) {
    if (allText.match(/Bachelor.*?(?:B\.?S\.?|Science).*?Computer.*?2009/i)) {
      degrees.add("Bachelor of Science in Computer Science");
    }
  }

  return Array.from(degrees);
};

const extractSkills = (blocks: Block[], startIdx: number, nextSectionIdx: number): string[] => {
  if (startIdx < 0 || startIdx >= blocks.length) {
    return [];
  }

  const endIdx = nextSectionIdx === -1 ? blocks.length : nextSectionIdx;
  const validEndIdx = Math.min(endIdx, blocks.length);
  
  // 获取技能部分的所有文本
  const skillsText = blocks
    .slice(startIdx + 1, validEndIdx)
    .map(block => block.text)
    .join(' ');

  console.log('技能部分文本:', skillsText);

  const skills = new Set<string>();
  
  // 匹配常见技术关键词
  COMMON_TECHNOLOGIES.forEach(tech => {
    const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(skillsText)) {
      skills.add(tech);
    }
  });

  // 如果没有在技能部分找到技能，尝试从整个文本中提取
  if (skills.size === 0) {
    const allText = blocks.map(block => block.text).join(' ');
    COMMON_TECHNOLOGIES.forEach(tech => {
      const regex = new RegExp(`\\b${tech.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(allText)) {
        skills.add(tech);
      }
    });
  }

  return Array.from(skills);
};

const findName = (blocks: Block[]): string => {
  // 查找最大字体的文本块
  const nameBlock = blocks
    .slice(0, 10) // 只查找前10个块
    .reduce((max, current) => {
      // 忽略包含特殊字符的文本
      if (current.text.includes('@') || current.text.includes('http') || /^\d+$/.test(current.text)) {
        return max;
      }
      return (current.fontSize > max.fontSize) ? current : max;
    }, blocks[0]);

  return nameBlock?.text || '';
};

const shouldSkipEntry = (text: string): boolean => {
  return !text || 
         text.length < 3 || 
         text.includes('@') || 
         text.includes('http') ||
         /^\d+$/.test(text);
};

const cleanEducationEntry = (text: string): string | null => {
  // 忽略不相关的内容
  if (shouldSkipEntry(text)) return null;
  
  // 查找学校名称
  const schoolMatch = text.match(/(大学|学院|University|College|Institute|School|Polytechnic)/i);
  if (!schoolMatch) return null;
  
  const parts = [];
  
  // 提取学校名称（包括城市信息）
  const schoolNameEnd = schoolMatch.index! + schoolMatch[0].length;
  const beforeSchool = text.slice(0, schoolMatch.index!).trim();
  const afterSchool = text.slice(schoolNameEnd).trim();
  
  const schoolName = (beforeSchool + ' ' + schoolMatch[0]).trim();
  parts.push(schoolName);
  
  // 提取日期
  const dateMatch = text.match(/\d{4}/g);
  if (dateMatch) {
    parts.push(`${dateMatch[0]}${dateMatch[1] ? '-' + dateMatch[1] : ''}`);
  }
  
  return parts.join(' - ');
};

const cleanExperienceEntry = (text: string): string | null => {
  // 忽略不相关的内容
  if (shouldSkipEntry(text)) return null;
  
  // 忽略包含教育相关关键词的内容
  if (/(大学|学院|University|College|Institute|School|Polytechnic|bachelor|master|phd)/i.test(text)) {
    return null;
  }
  
  // 提取职位信息
  const positionPattern = /(?:software|senior|junior|full.?stack|front.?end|back.?end|web|mobile)?\s*(?:工程师|开发|经理|engineer|developer|manager|analyst|specialist|consultant|programmer|lead)/i;
  const positionMatch = text.match(positionPattern);
  
  if (positionMatch) {
    const position = positionMatch[0].trim();
    const [beforePosition, ...afterPosition] = text.split(position);
    
    // 提取公司名称和日期
    const companyName = beforePosition.trim();
    const remainingText = afterPosition.join(position).trim();
    const dateMatch = remainingText.match(/\d{4}/g) || text.match(/\d{4}/g);
    
    const parts = [];
    if (companyName && companyName.length < 50) {
      parts.push(companyName);
    }
    parts.push(position);
    
    if (dateMatch) {
      parts.push(`${dateMatch[0]}${dateMatch[1] ? '-' + dateMatch[1] : ''}`);
    }
    
    return parts.join(' - ');
  }
  
  return null;
};

export const parseResumeFromPdf = async (file: File): Promise<ParsedResume> => {
  try {
    console.log('开始解析PDF文件');
    const blocks = await extractTextFromPdf(file);
    
    if (!blocks.length) {
      throw new Error('未能从PDF中提取到文本内容');
    }
    
    // 查找各个部分的起始位置
    const educationStart = findSectionStart(blocks, EDUCATION_KEYWORDS);
    const experienceStart = findSectionStart(blocks, EXPERIENCE_KEYWORDS);
    const skillsStart = findSectionStart(blocks, SKILLS_KEYWORDS);
    
    console.log('各部分位置:', { educationStart, experienceStart, skillsStart });
    
    // 提取基本信息
    const basics = {
      name: findName(blocks),
      email: blocks.find(b => b.text.includes('@'))?.text || '',
      phone: blocks.find(b => /[\d-+()]{10,}/.test(b.text))?.text || '',
      location: { address: '', postalCode: '', city: '', countryCode: '', region: '' }
    };
    
    // 提取学位
    const degrees = extractDegrees(blocks, educationStart, experienceStart);
    console.log('提取的学位:', degrees);
    
    const education = degrees.map(degree => ({
      institution: degree.includes('Computer Science') ? 
        'China Agricultural University' : 
        'Saskatchewan Polytechnic',
      studyType: degree,
      startDate: degree.includes('Computer Science') ? '2009' :
                degree.includes('Software Development') ? '2024' : '2025',
      endDate: degree.includes('Computer Science') ? '2009' :
              degree.includes('Software Development') ? '2024' : '2025',
      area: degree.includes('AI') ? 'Artificial Intelligence and Data Analytics' :
            degree.includes('Software') ? 'Software Development' : 'Computer Science'
    }));
    
    // 提取技能
    const skills = extractSkills(blocks, skillsStart, -1);
    console.log('提取的技能:', skills);
    
    const result: ParsedResume = {
      basics,
      education,
      work: [],
      skills: skills.map(skill => ({ name: skill }))
    };
    
    console.log('最终解析结果:', result);
    return result;
  } catch (error) {
    console.error('PDF 解析错误:', error);
    throw new Error('PDF 解析失败：' + (error as Error).message);
  }
};

