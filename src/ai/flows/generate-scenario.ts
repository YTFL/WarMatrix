'use server';
/**
 * @fileOverview AI flow that generates a full battlefield scenario
 * given mission context, terrain, force balance, and objective type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ── Input ─────────────────────────────────────────────────────────────────────

const GenerateScenarioInputSchema = z.object({
    missionContext: z.string().describe('A brief description of the operational situation.'),
    terrainType: z
        .enum(['Highland', 'Forest', 'Urban', 'Plains', 'Desert'])
        .describe('The dominant terrain type of the operational area.'),
    forceBalance: z
        .enum(['Balanced Forces', 'Friendly Advantage', 'Hostile Advantage'])
        .describe('The relative strength balance between friendly and hostile forces.'),
    objectiveType: z
        .enum(['Capture Territory', 'Defend Position', 'Supply Route Control', 'Recon Operation'])
        .describe('The primary mission objective type.'),
});
export type GenerateScenarioInput = z.infer<typeof GenerateScenarioInputSchema>;

// ── Output ────────────────────────────────────────────────────────────────────

const DeployedUnitSchema = z.object({
    label: z.string().describe('Tactical unit name, e.g. "Alpha Infantry Company" or "Unknown Hostile Battalion".'),
    assetClass: z
        .enum(['Infantry', 'Mechanized', 'Armor', 'Artillery', 'Recon', 'Logistics', 'Command Unit', 'Infrastructure', 'Objective'])
        .describe('The land asset class of this unit.'),
    allianceRole: z
        .enum(['FRIENDLY', 'ENEMY', 'NEUTRAL', 'INFRASTRUCTURE'])
        .describe('The alliance role: FRIENDLY, ENEMY, NEUTRAL, or INFRASTRUCTURE.'),
    x: z.number().int().min(1).max(11).describe('Grid X coordinate between 1 and 11.'),
    y: z.number().int().min(1).max(7).describe('Grid Y coordinate between 1 and 7.'),
});

const GenerateScenarioOutputSchema = z.object({
    scenarioTitle: z.string().describe('Short operational scenario title, e.g. "Operation Iron Ridge".'),
    briefing: z
        .string()
        .describe('2-sentence tactical briefing that summarises the generated scenario. Military tone.'),
    units: z
        .array(DeployedUnitSchema)
        .min(4)
        .max(10)
        .describe('Between 4 and 10 deployed entities covering a mix of friendly, hostile, objective, and support assets.'),
});
export type GenerateScenarioOutput = z.infer<typeof GenerateScenarioOutputSchema>;

// ── Exported callable ─────────────────────────────────────────────────────────

export async function generateScenario(
    input: GenerateScenarioInput
): Promise<GenerateScenarioOutput> {
    return generateScenarioFlow(input);
}

// ── Prompt ────────────────────────────────────────────────────────────────────

const generateScenarioPrompt = ai.definePrompt({
    name: 'generateScenarioPrompt',
    input: { schema: GenerateScenarioInputSchema },
    output: { schema: GenerateScenarioOutputSchema },
    prompt: `You are WARMATRIX SCENARIO ENGINE — a military AI that seeds realistic ground-combat tactical scenarios for command training simulations.

MISSION CONTEXT: {{{missionContext}}}
TERRAIN: {{{terrainType}}}
FORCE BALANCE: {{{forceBalance}}}
OBJECTIVE TYPE: {{{objectiveType}}}

INSTRUCTIONS:
1. Generate a believable ground-combat scenario with 4–10 units.
2. Unit composition must include at least: 2 FRIENDLY units, 2 ENEMY units, 1 OBJECTIVE, and optionally 1–2 INFRASTRUCTURE or NEUTRAL assets.
3. Spread unit coordinates naturally across the grid (X: 1–11, Y: 1–7). Friendly units near the left/center, enemy units near the right/center. Objectives in the middle zone.
4. Asset classes must be land-only: Infantry, Mechanized, Armor, Artillery, Recon, Logistics, Command Unit, Infrastructure, Objective.
5. Unit labels should sound authentic and military (e.g., "Bravo Armor Company", "3rd Artillery Battery", "Forward Observation Post").
6. Force balance must be reflected: Friendly Advantage → more or stronger friendly units; Hostile Advantage → more or stronger enemy units.
7. Terrain must influence composition: Highland/Forest → more Infantry/Recon; Urban → Command Unit/Infrastructure; Desert/Plains → Armor/Mechanized.

Reply ONLY in the following JSON format:
{{jsonSchema output.schema}}`,
});

// ── Flow ──────────────────────────────────────────────────────────────────────

const generateScenarioFlow = ai.defineFlow(
    {
        name: 'generateScenarioFlow',
        inputSchema: GenerateScenarioInputSchema,
        outputSchema: GenerateScenarioOutputSchema,
    },
    async (input) => {
        const { output } = await generateScenarioPrompt(input);
        return output!;
    }
);
