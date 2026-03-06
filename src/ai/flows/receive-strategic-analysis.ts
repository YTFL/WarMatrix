'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating AI-powered strategic battlefield analysis.
 *
 * - receiveStrategicAnalysis - A function that triggers the strategic analysis process.
 * - ReceiveStrategicAnalysisInput - The input type for the receiveStrategicAnalysis function.
 * - ReceiveStrategicAnalysisOutput - The return type for the receiveStrategicAnalysis function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReceiveStrategicAnalysisInputSchema = z.object({
  battlefieldSummary: z
    .string()
    .describe(
      'A high-level summary of the current battlefield situation, including friendly and enemy dispositions, key events, and recent intelligence reports.'
    ),
  missionObjectives: z.string().optional().describe('The primary mission objectives.'),
});
export type ReceiveStrategicAnalysisInput = z.infer<
  typeof ReceiveStrategicAnalysisInputSchema
>;

const ReceiveStrategicAnalysisOutputSchema = z.object({
  strategicOverview: z
    .string()
    .describe('A high-level strategic overview of the current battlefield situation.'),
  staffAnalysis: z.object({
    maneuver: z.string().describe('Analysis of unit movements and positioning.'),
    logistics: z.string().describe('Analysis of supply lines and resource availability.'),
    intelligence: z.string().describe('Analysis of enemy intent and capabilities.'),
  }).describe('Detailed staff-level analysis of operational variables.'),
  riskAssessment: z
    .string()
    .describe('An assessment of current operational risks and threats.'),
  predictedEnemyBehavior: z
    .string()
    .describe('Predictions regarding probable enemy actions and movements.'),
  recommendedActions: z
    .array(z.string())
    .describe('A list of recommended tactical actions for the operator to consider.'),
});
export type ReceiveStrategicAnalysisOutput = z.infer<
  typeof ReceiveStrategicAnalysisOutputSchema
>;

export async function receiveStrategicAnalysis(
  input: ReceiveStrategicAnalysisInput
): Promise<ReceiveStrategicAnalysisOutput> {

  const instruction = `OUTPUT STRICTLY VALID JSON ONLY. NO EXPLANATIONS. NO MARKDOWN.
Generate a compressed Staff Strategic Assessment as a JSON dictionary using EXACT abbreviations for keys to save tokens.

ABBREVIATION KEYS (MUST MATCH EXACTLY):
"so" = strategicOverview (string, 1 short sentence max)
"ra" = riskAssessment (string, 1 short sentence max)
"peb" = predictedEnemyBehavior (string, 1 short sentence max)
"sa" = staffAnalysis (object with "m", "l", "i")
  "m" = maneuver (string)
  "l" = logistics (string)
  "i" = intelligence (string)
"r" = recommendedActions (array of exactly 2 strings)

EXAMPLE JSON TO OUTPUT:
{"so":"...","sa":{"m":"...","l":"...","i":"..."},"ra":"...","peb":"...","r":["...","..."]}
`;

  const battlefield_data = `MISSION: ${input.missionObjectives || 'Classified Operations'}
SITUATION: ${input.battlefieldSummary}

GENERATE RAW JSON DICTIONARY ONLY:`;

  const res = await fetch('http://127.0.0.1:8000/api/sitrep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instruction,
      battlefield_data,
      max_new_tokens: 500,    // Increased cap for safety
      use_cache: true,
      do_sample: false,       // Greedy decoding ensures fast, structured predictability
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Local backend error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  let text = data.response?.trim() || '';

  // Clean up code block ticks if any slipped through
  text = text.replace(/^```(json)?/, '').replace(/```$/, '').trim();

  let jsonString = '';
  const startIndex = text.indexOf('{');
  if (startIndex === -1) {
    throw new Error("Failed to find valid JSON dictionary in local model output. Output: " + text.slice(0, 50));
  }

  let braceCount = 0;
  let endIndex = startIndex;
  let inStrCounter = false;
  let isEscape = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    if (isEscape) {
      isEscape = false;
      continue;
    }
    if (char === '\\') {
      isEscape = true;
      continue;
    }
    if (char === '"') {
      inStrCounter = !inStrCounter;
      continue;
    }
    if (!inStrCounter) {
      if (char === '{') braceCount++;
      else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          endIndex = i;
          break;
        }
      }
    }
  }

  if (braceCount === 0) {
    jsonString = text.substring(startIndex, endIndex + 1);
  } else {
    // Fallback to greedy regex if brace counting fails due to malformed string
    const match = text.match(/\{[\s\S]*\}/);
    jsonString = match ? match[0] : '';
  }

  if (!jsonString) {
    throw new Error("Failed to extract JSON from local model output.");
  }

  jsonString = jsonString.replace(/<\|.*?\|>/g, '');
  jsonString = jsonString.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]/g, '');

  // Heuristic: fix unescaped quotes and literal newlines in known strategic analysis keys
  // This handles common AI formatting glitches where quotes are not escaped within a JSON value.
  const keysToFix = ["so", "ra", "peb", "m", "l", "i"];
  for (const key of keysToFix) {
    // Regex matches the start of the value and lookahead for the probable end of the string
    const regex = new RegExp(`("${key}"\\s*:\\s*")([\\s\\S]*?)(?="\\s*[,}\\]])`, 'g');
    jsonString = jsonString.replace(regex, (match, p1, p2) => {
      // Escape any " in the value that aren't already escaped and replace literal newlines
      let val = p2.replace(/(?<!\\)"/g, '\\"');
      val = val.replace(/\n/g, '\\n');
      return p1 + val;
    });
  }

  // Handle trailing commas
  jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');

  try {
    const parsed = JSON.parse(jsonString);

    // Map short keys to expected schema keys
    const mapped = {
      strategicOverview: parsed.so || parsed.strategicOverview || 'Strategic overview generated successfully.',
      staffAnalysis: {
        maneuver: parsed.sa?.m || parsed.staffAnalysis?.maneuver || 'Maneuver elements deployed.',
        logistics: parsed.sa?.l || parsed.staffAnalysis?.logistics || 'Supply lines stable.',
        intelligence: parsed.sa?.i || parsed.staffAnalysis?.intelligence || 'Intel tracking hostile forces.',
      },
      riskAssessment: parsed.ra || parsed.riskAssessment || 'Nominal operational risk.',
      predictedEnemyBehavior: parsed.peb || parsed.predictedEnemyBehavior || 'Enemy forces holding position.',
      recommendedActions: parsed.r || parsed.recommendedActions || ['Proceed with caution.', 'Maintain perimeter.'],
    };

    // Validate with the Zod schema
    return ReceiveStrategicAnalysisOutputSchema.parse(mapped);
  } catch (e: any) {
    console.error("Failed to parse JSON from local model:", text, e);
    throw new Error(`Data mapping error: ${e.message}`);
  }
}

