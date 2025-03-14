export interface Location {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
  region?: string;
}

export interface ResumeBasics {
  name: string;
  email: string;
  phone: string;
  url?: string;
  summary?: string;
  location: Location;
}

export interface Education {
  institution: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

export interface Work {
  name: string;
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface Skill {
  name: string;
  level?: string;
  keywords?: string[];
}

export interface ParsedResume {
  basics: ResumeBasics;
  education: Education[];
  work: Work[];
  skills: Skill[];
}
