import { GoogleGenAI } from "@google/genai";
import { SkillSet } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const MODEL_NAME = "gemini-3-flash-preview";

export const suggestEducationPoints = async (school: string, degree: string, field: string) => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in the environment.");
    return "";
  }
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Suggest 3 high-impact professional bullet points for a student's resume who is studying ${degree} in ${field} at ${school}.
      
      REQUIREMENTS:
      1. Focus on technical foundation, key projects, or specific academic achievements.
      2. Use professional resume language.
      3. Format: Each point on a new line starting with "• ".
      4. DO NOT repeat the input parameters (school/degree) in the actual points unless necessary for context.
      5. Return ONLY the bullet points.`,
    });
    let result = response.text?.trim() || "";
    // Basic cleanup
    result = result.replace(/^(Here are some bullet points:|Points:)\s*/i, '');
    return result || "";
  } catch (error) {
    console.error("Gemini Education Error:", error);
    return "";
  }
};

export const suggestProjectDescription = async (projectName: string, technologies: string[]) => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in the environment.");
    return "";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Write a concise, ARCHITECTURAL IMPACT summary (under 180 characters) for a project named "${projectName}" using technologies: ${technologies.join(', ')}.
      
      GOALS:
      1. Highlight engineering challenges or business value.
      2. Use strong action verbs.
      3. Do NOT just list the technologies again.
      4. Return ONLY the impact description without preamble or quotes.`,
    });
    let result = response.text?.trim() || "";
    result = result.replace(/^["']|["']$/g, '');
    return result || "";
  } catch (error) {
    console.error("Gemini Project Error:", error);
    return "";
  }
};

export const improveText = async (text: string, context: string) => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in the environment.");
    return text;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `You are a professional resume writer. Your task is to REWRITE and IMPROVE the following text for a professional resume summary.
      
      TEXT TO IMPROVE: "${text}"
      CONTEXT: ${context}
      
      GOALS:
      1. Make it professional, impact-driven, and concise.
      2. Use active verbs (e.g., "Led", "Developed", "Optimized").
      3. Keep it under 250 characters.
      4. DO NOT repeat the original text.
      5. DO NOT provide any introduction, preamble, conversational text, or quotes.
      
      Provide ONLY the final improved text.`,
    });
    
    // Improved cleaning of response
    let result = response.text?.trim() || text;
    
    // Remove common AI preambles if they leak through
    result = result.replace(/^["']|["']$/g, ''); // Remove outer quotes
    result = result.replace(/^(Here is the improved text:|Improved text:|Summary:)\s*/i, '');
    
    console.log("Gemini Text Improvement Success");
    return result.trim() || text;
  } catch (error) {
    console.error("Gemini Improvement Error:", error);
    return text;
  }
};

export const suggestSkills = async (title: string, currentSkills: string[], category?: keyof SkillSet) => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in the environment.");
    return null;
  }
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: category ? 
        `Suggest 5 highly relevant and trending ${String(category)} skills for an IT professional with the role: ${title}. 
         IMPORTANT: Exclude these existing skills: ${currentSkills.join(', ')}. 
         Return ONLY a comma-separated list of technology names. No extra text.` :
        `You are a tech career expert. Suggest relevant professional skills for a persona working as ${title} in the IT sector.
         EXCLUDE: ${currentSkills.join(', ')}.
         
         Provide suggestions in a structure that maps to these keys: frontend, backend, languages, database, cloud, tools, softSkills.
         For each category, provide 3 distinctive skills.
         
         Return ONLY a clean JSON object. No preamble, no markdown formatting.`,
    });
    
    let text = response.text?.trim() || (category ? "" : "{}");
    // Clean markdown if AI included it
    text = text.replace(/```json|```/g, "").trim();
    
    console.log("Gemini Skills Suggestion Success");
    
    if (category) {
      return text.split(',').map(s => s.trim()).filter(Boolean);
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Skills Error:", error);
    return null;
  }
};

export const suggestInterests = async (title: string) => {
  if (!process.env.GEMINI_API_KEY) return [];
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Suggest 5 relevant professional/tech-related interests for a ${title} (e.g., Open Source, Green Tech, AR/VR, etc.). Return only a comma-separated list.`,
    });
    return response.text?.split(',').map(s => s.trim()) || [];
  } catch (error) {
    console.error("Gemini Interests Error:", error);
    return [];
  }
};

export const suggestSpokenLanguages = async (location: string) => {
  if (!process.env.GEMINI_API_KEY) return [];
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Suggest 3 most relevant spoken languages for someone based in ${location} or working in global IT. 
      Format: "Language (Proficiency Level)". Return only a comma-separated list.`,
    });
    return response.text?.split(',').map(s => s.trim()) || [];
  } catch (error) {
    console.error("Gemini Language Suggestion Error:", error);
    return [];
  }
};
