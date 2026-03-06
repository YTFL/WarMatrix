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
  return receiveStrategicAnalysisFlow(input);
}

const strategicAnalysisPrompt = ai.definePrompt({
  name: 'strategicAnalysisPrompt',
  input: { schema: ReceiveStrategicAnalysisInputSchema },
  output: { schema: ReceiveStrategicAnalysisOutputSchema },
  prompt: `You are a Senior Military Staff Officer and Tactical AI Strategist. Your task is to provide a comprehensive Operational Briefing and Strategic Assessment.

MISSION OBJECTIVES: {{{missionObjectives}}}

CURRENT BATTLEFIELD SITUATION:
{{{battlefieldSummary}}}

Analyze the situation using standard military decision-making processes. Your analysis must be evidence-based, explaining HOW terrain, force ratios, and recent movements influence the projected outcomes.

Provide your analysis in the following JSON format:
{{jsonSchema output.schema}}`,
});

const receiveStrategicAnalysisFlow = ai.defineFlow(
  {
    name: 'receiveStrategicAnalysisFlow',
    inputSchema: ReceiveStrategicAnalysisInputSchema,
    outputSchema: ReceiveStrategicAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await strategicAnalysisPrompt(input);
    return output!;
  }
);
