import { SkillSet } from "../types";

/**
 * All AI requests are routed through the /api/enhance serverless function.
 * The API key is never exposed to the frontend bundle.
 */
const API_URL = '/api/enhance';

async function callEnhanceAPI(action: string, payload: Record<string, any>): Promise<any> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.result;
}

export const suggestEducationPoints = async (school: string, degree: string, field: string): Promise<string> => {
  try {
    const result = await callEnhanceAPI('suggestEducationPoints', { school, degree, field });
    return result || '';
  } catch (error) {
    console.error('Education Suggestion Error:', error);
    return '';
  }
};

export const suggestProjectDescription = async (projectName: string, technologies: string[]): Promise<string> => {
  try {
    const result = await callEnhanceAPI('suggestProjectDescription', { projectName, technologies });
    return result || '';
  } catch (error) {
    console.error('Project Suggestion Error:', error);
    return '';
  }
};

export const improveText = async (text: string, context: string): Promise<string> => {
  try {
    const result = await callEnhanceAPI('improveText', { text, context });
    return result || text;
  } catch (error) {
    console.error('Text Improvement Error:', error);
    return text;
  }
};

export const suggestSkills = async (title: string, currentSkills: string[], category?: keyof SkillSet): Promise<any> => {
  try {
    const result = await callEnhanceAPI('suggestSkills', { title, currentSkills, category: category ? String(category) : undefined });
    return result;
  } catch (error) {
    console.error('Skills Suggestion Error:', error);
    return null;
  }
};

export const suggestInterests = async (title: string): Promise<string[]> => {
  try {
    const result = await callEnhanceAPI('suggestInterests', { title });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Interests Suggestion Error:', error);
    return [];
  }
};

export const suggestSpokenLanguages = async (location: string): Promise<string[]> => {
  try {
    const result = await callEnhanceAPI('suggestSpokenLanguages', { location });
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error('Language Suggestion Error:', error);
    return [];
  }
};
