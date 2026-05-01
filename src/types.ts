/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
  cgpa?: string;
  currentSemester?: string;
  studyPoints?: string;
  twelfthResult?: string;
  twelfthSchool?: string;
  tenthResult?: string;
  tenthSchool?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  link?: string;
  technologies: string[];
}

export interface Achievement {
  id: string;
  title: string;
  issuer: string;
  date: string;
}

export interface OpenSource {
  id: string;
  name: string;
  description: string;
  contributionLink: string;
}

export interface Hackathon {
  id: string;
  name: string;
  year: string;
  achievement: string;
}

export interface SkillSet {
  frontend: string[];
  backend: string[];
  languages: string[];
  database: string[];
  cloud: string[];
  tools: string[];
  softSkills: string[];
}

export interface Leadership {
  id: string;
  title: string;
  description: string;
}

export interface ResumeData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    portfolio: string;
    profileImage: string;
    summary: string;
    currentInstitution: string;
  };
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: SkillSet;
  certifications: string[];
  achievements: Achievement[];
  languages: string[];
  interests: string[];
  hackathons: Hackathon[];
  openSource: OpenSource[];
  leadership: Leadership[];
  theme: 'modern' | 'minimal' | 'futuristic' | 'corporate' | 'executive';
}

export const INITIAL_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    profileImage: '',
    summary: '',
    currentInstitution: '',
  },
  education: [],
  experience: [],
  projects: [],
  skills: {
    frontend: [],
    backend: [],
    languages: [],
    database: [],
    cloud: [],
    tools: [],
    softSkills: [],
  },
  certifications: [],
  achievements: [],
  languages: [],
  interests: [],
  hackathons: [],
  openSource: [],
  leadership: [],
  theme: 'executive',
};
