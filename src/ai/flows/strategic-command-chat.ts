'use server';
/**
 * @fileOverview AI flow for the Strategic Operations Chat Console.
 * Handles commander directives and routes them to the appropriate
 * AI response type: scenario narrative, intel update, fog-of-war event,
 * or explainable decision reasoning.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ─── Input / Output Schemas ───────────────────────────────────────────────────

const StrategicChatInputSchema = z.object({
    directive: z.string().describe('The tactical directive or question from the operator.'),
    mode: z
        .enum(['SCENARIO_SEED', 'INTEL_UPDATE', 'FOG_OF_WAR', 'EXPLAIN_DECISION', 'GENERAL'])
        .describe('The operational mode determining the type of AI response.'),
    context: z.string().optional().describe('Current battlefield context for grounding the response.'),
});
export type StrategicChatInput = z.infer<typeof StrategicChatInputSchema>;

const StrategicChatOutputSchema = z.object({
    source: z
        .enum(['AI_STRATEGIST', 'SIMULATION_ENGINE', 'INTEL_DIVISION', 'FOG_OF_WAR_MODULE'])
        .describe('The system component generating this response.'),
    headline: z.string().describe('Short tactical headline for the message, max 12 words.'),
    body: z.string().describe('Full tactical response body. 2–5 sentences. Military tone.'),
    classification: z
        .enum(['TOP_SECRET', 'SECRET', 'CONFIDENTIAL', 'UNCLASSIFIED'])
        .describe('Classification level of the information.'),
    metrics: z
        .array(
            z.object({
                label: z.string(),
                value: z.string(),
            })
        )
        .optional()
        .describe('Optional key metrics to display alongside the response.'),
});
export type StrategicChatOutput = z.infer<typeof StrategicChatOutputSchema>;

// ─── Exported function ────────────────────────────────────────────────────────

export async function strategicCommandChat(
    input: StrategicChatInput
): Promise<StrategicChatOutput> {
    return strategicCommandChatFlow(input);
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const strategicChatPrompt = ai.definePrompt({
    name: 'strategicCommandChatPrompt',
    input: { schema: StrategicChatInputSchema },
    output: { schema: StrategicChatOutputSchema },
    prompt: `You are WARMATRIX — an advanced military AI operating within a secure command-and-control system. You respond to operator directives with precision, authority, and tactical realism.

OPERATIONAL MODE: {{{mode}}}
BATTLEFIELD CONTEXT: {{{context}}}
OPERATOR DIRECTIVE: {{{directive}}}

MODE INSTRUCTIONS:
- SCENARIO_SEED: Generate a detailed scenario narrative including strategic context, battlefield situation, and initial intelligence briefing. Source = AI_STRATEGIST.
- INTEL_UPDATE: Produce an intelligence summary including enemy movements, signals intercepts, and threat assessments. Source = INTEL_DIVISION.
- FOG_OF_WAR: Inject an uncertainty event (lost comms, unidentified units, weather disruption, civilian interference). Source = FOG_OF_WAR_MODULE.
- EXPLAIN_DECISION: Provide structured explainable reasoning for simulation results, predicted outcomes, or risk signals. Source = SIMULATION_ENGINE. Include metrics (probability%, risk level, etc.).
- GENERAL: Respond as the AI STRATEGIST with the most appropriate analysis.

Maintain military brevity. Use authoritative, technical language. Never break character.
Respond in the following JSON format:
{{jsonSchema output.schema}}`,
});

// ─── Flow ─────────────────────────────────────────────────────────────────────

const strategicCommandChatFlow = ai.defineFlow(
    {
        name: 'strategicCommandChatFlow',
        inputSchema: StrategicChatInputSchema,
        outputSchema: StrategicChatOutputSchema,
    },
    async (input) => {
        const { output } = await strategicChatPrompt(input);
        return output!;
    }
);
