import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL_NAME = 'gemini-3-flash-preview';

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPTIMIZER_API_KEY || '';
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errorBody}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { action, payload } = req.body || {};

  if (!action) {
    return res.status(400).json({ error: 'Missing "action" field in request body.' });
  }

  try {
    let prompt = '';
    let resultType: 'text' | 'json' | 'list' = 'text';

    switch (action) {
      case 'suggestEducationPoints': {
        const { school, degree, field } = payload;
        prompt = `Suggest 3 high-impact professional bullet points for a student's resume who is studying ${degree} in ${field} at ${school}.
      
REQUIREMENTS:
1. Focus on technical foundation, key projects, or specific academic achievements.
2. Use professional resume language.
3. Format: Each point on a new line starting with "• ".
4. DO NOT repeat the input parameters (school/degree) in the actual points unless necessary for context.
5. Return ONLY the bullet points.`;
        break;
      }

      case 'suggestProjectDescription': {
        const { projectName, technologies } = payload;
        prompt = `Write a concise, ARCHITECTURAL IMPACT summary (under 180 characters) for a project named "${projectName}" using technologies: ${(technologies || []).join(', ')}.
      
GOALS:
1. Highlight engineering challenges or business value.
2. Use strong action verbs.
3. Do NOT just list the technologies again.
4. Return ONLY the impact description without preamble or quotes.`;
        break;
      }

      case 'improveText': {
        const { text, context } = payload;
        prompt = `You are a professional resume writer. Your task is to REWRITE and IMPROVE the following text for a professional resume summary.
      
TEXT TO IMPROVE: "${text}"
CONTEXT: ${context}
      
GOALS:
1. Make it professional, impact-driven, and concise.
2. Use active verbs (e.g., "Led", "Developed", "Optimized").
3. Keep it under 250 characters.
4. DO NOT repeat the original text.
5. DO NOT provide any introduction, preamble, conversational text, or quotes.
      
Provide ONLY the final improved text.`;
        break;
      }

      case 'suggestSkills': {
        const { title, currentSkills, category } = payload;
        if (category) {
          prompt = `Suggest 5 highly relevant and trending ${category} skills for an IT professional with the role: ${title}. 
IMPORTANT: Exclude these existing skills: ${(currentSkills || []).join(', ')}. 
Return ONLY a comma-separated list of technology names. No extra text.`;
          resultType = 'list';
        } else {
          prompt = `You are a tech career expert. Suggest relevant professional skills for a persona working as ${title} in the IT sector.
EXCLUDE: ${(currentSkills || []).join(', ')}.
         
Provide suggestions in a structure that maps to these keys: frontend, backend, languages, database, cloud, tools, softSkills.
For each category, provide 3 distinctive skills.
         
Return ONLY a clean JSON object. No preamble, no markdown formatting.`;
          resultType = 'json';
        }
        break;
      }

      case 'suggestInterests': {
        const { title: interestTitle } = payload;
        prompt = `Suggest 5 relevant professional/tech-related interests for a ${interestTitle} (e.g., Open Source, Green Tech, AR/VR, etc.). Return only a comma-separated list.`;
        resultType = 'list';
        break;
      }

      case 'suggestSpokenLanguages': {
        const { location } = payload;
        prompt = `Suggest 3 most relevant spoken languages for someone based in ${location} or working in global IT. 
Format: "Language (Proficiency Level)". Return only a comma-separated list.`;
        resultType = 'list';
        break;
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    let rawText = await callGemini(prompt);

    // Post-process based on result type
    let result: any;
    switch (resultType) {
      case 'list':
        result = rawText.split(',').map((s: string) => s.trim()).filter(Boolean);
        break;
      case 'json':
        rawText = rawText.replace(/```json|```/g, '').trim();
        try {
          result = JSON.parse(rawText);
        } catch {
          result = null;
        }
        break;
      case 'text':
      default:
        // Clean up common prefixes
        rawText = rawText.replace(/^["']|["']$/g, '');
        rawText = rawText.replace(/^(Here are some bullet points:|Points:|Here is the improved text:|Improved text:|Summary:)\s*/i, '');
        result = rawText.trim();
        break;
    }

    return res.status(200).json({ result });
  } catch (error: any) {
    console.error('Enhance API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
