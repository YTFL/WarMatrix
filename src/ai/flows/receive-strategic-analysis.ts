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
});
export type ReceiveStrategicAnalysisInput = z.infer<
  typeof ReceiveStrategicAnalysisInputSchema
>;

const ReceiveStrategicAnalysisOutputSchema = z.object({
  strategicOverview: z
    .string()
    .describe('A high-level strategic overview of the current battlefield situation.'),
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
  prompt: `You are an expert military strategist and tactical analyst operating a highly advanced battlefield command console. Your task is to analyze the current battlefield situation and provide a strategic assessment, including risks, predicted enemy behavior, and recommended actions.

Here is the current battlefield situation summary:
{{{battlefieldSummary}}}

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
