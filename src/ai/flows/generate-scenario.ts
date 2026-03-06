'use server';

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
    x: z.number().int().min(1).max(44).describe('Grid X coordinate between 1 and 44.'),
    y: z.number().int().min(1).max(28).describe('Grid Y coordinate between 1 and 28.'),
});

const MapPeakSchema = z.object({
    cx: z.number(),
    cy: z.number(),
    h: z.number(),
    r2: z.number(),
});

const GenerateScenarioOutputSchema = z.object({
    scenarioTitle: z.string().describe('Short operational scenario title, e.g. "Operation Iron Ridge".'),
    briefing: z
        .string()
        .describe('2-sentence tactical briefing that summarises the generated scenario. Military tone.'),
    units: z
        .array(DeployedUnitSchema)
        .min(4)
        .max(20)
        .describe('Between 4 and 20 deployed entities covering a mix of friendly, hostile, objective, and support assets.'),
    mapPeaks: z.array(MapPeakSchema).optional(),
});
export type GenerateScenarioOutput = z.infer<typeof GenerateScenarioOutputSchema>;

// ── Exported callable ─────────────────────────────────────────────────────────

export async function generateScenario(
    input: GenerateScenarioInput
): Promise<GenerateScenarioOutput> {

    const toRole = (raw?: string): 'FRIENDLY' | 'ENEMY' | 'NEUTRAL' | 'INFRASTRUCTURE' => {
        const r = String(raw || '').toUpperCase();
        if (r.includes('FRIEND') || r.includes('BLUE')) return 'FRIENDLY';
        if (r.includes('ENEMY') || r.includes('HOSTILE') || r.includes('RED')) return 'ENEMY';
        if (r.includes('INFRA')) return 'INFRASTRUCTURE';
        return 'NEUTRAL';
    };

    const toAssetClass = (raw?: string): z.infer<typeof DeployedUnitSchema>['assetClass'] => {
        const v = String(raw || '').toLowerCase();
        if (v.includes('mechan')) return 'Mechanized';
        if (v.includes('armor') || v.includes('armour') || v.includes('tank')) return 'Armor';
        if (v.includes('artill')) return 'Artillery';
        if (v.includes('recon') || v.includes('scout')) return 'Recon';
        if (v.includes('logist') || v.includes('supply')) return 'Logistics';
        if (v.includes('command') || v.includes('hq')) return 'Command Unit';
        if (v.includes('infra') || v.includes('facility') || v.includes('structure')) return 'Infrastructure';
        if (v.includes('objective') || v.includes('outpost')) return 'Objective';
        return 'Infantry';
    };

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

    const seedFrom = (key: string) => {
        let s = 2166136261;
        for (let i = 0; i < key.length; i++) {
            s ^= key.charCodeAt(i);
            s = Math.imul(s, 16777619);
        }
        return () => {
            s = Math.imul(s ^ (s >>> 13), 1274126177);
            s ^= s >>> 16;
            return (s >>> 0) / 4294967296;
        };
    };

    const fallbackFromText = (rawText: string): GenerateScenarioOutput => {
        const rng = seedFrom(`${input.missionContext}|${input.terrainType}|${input.forceBalance}|${input.objectiveType}|${rawText.slice(0, 500)}`);
        const units: Array<z.infer<typeof DeployedUnitSchema>> = [];

        const re = /([A-Za-z][A-Za-z0-9\-\s]{2,40})\s*\[(\d{1,2})\s*,\s*(\d{1,2})\]/g;
        const clean = rawText.replace(/\s+/g, ' ');
        const roleHints = {
            friendly: /friendly|blue team|blue_team/i,
            enemy: /enemy|hostile|red team|red_team/i,
            infra: /infrastructure|facility|structure/i,
        };

        let m: RegExpExecArray | null;
        while ((m = re.exec(clean)) !== null && units.length < 12) {
            const label = m[1].trim();
            const x = clamp(Number(m[2]) || Math.floor(rng() * 44) + 1, 1, 44);
            const y = clamp(Number(m[3]) || Math.floor(rng() * 28) + 1, 1, 28);

            const ctxStart = Math.max(0, m.index - 40);
            const ctx = clean.slice(ctxStart, m.index + label.length + 40);
            let role: 'FRIENDLY' | 'ENEMY' | 'NEUTRAL' | 'INFRASTRUCTURE' = 'NEUTRAL';
            if (roleHints.friendly.test(ctx)) role = 'FRIENDLY';
            else if (roleHints.enemy.test(ctx)) role = 'ENEMY';
            else if (roleHints.infra.test(ctx)) role = 'INFRASTRUCTURE';

            units.push({
                label,
                assetClass: toAssetClass(label),
                allianceRole: role,
                x,
                y,
            });
        }

        const forcePreferred = input.forceBalance === 'Friendly Advantage'
            ? 'FRIENDLY'
            : input.forceBalance === 'Hostile Advantage'
                ? 'ENEMY'
                : 'NEUTRAL';

        while (units.length < 10) {
            const i = units.length + 1;
            const role = i % 3 === 0 ? 'ENEMY' : i % 4 === 0 ? 'NEUTRAL' : 'FRIENDLY';
            const finalRole = forcePreferred !== 'NEUTRAL' && i % 5 === 0 ? forcePreferred as 'FRIENDLY' | 'ENEMY' : role;
            const assetClass = finalRole === 'NEUTRAL' ? 'Objective' : i % 2 === 0 ? 'Mechanized' : 'Infantry';
            units.push({
                label: `${finalRole === 'FRIENDLY' ? 'Alpha' : finalRole === 'ENEMY' ? 'Iron' : 'Objective'} ${assetClass} ${i}`,
                assetClass,
                allianceRole: finalRole,
                x: Math.floor(rng() * 44) + 1,
                y: Math.floor(rng() * 28) + 1,
            });
        }

        const mapPeaks = Array.from({ length: 3 }).map(() => ({
            cx: Math.floor(rng() * 44) + 1,
            cy: Math.floor(rng() * 28) + 1,
            h: Number((0.6 + rng() * 0.8).toFixed(2)),
            r2: (rng() * 44 * 0.25 + 44 * 0.05) ** 2,
        }));

        const titleByTerrain: Record<GenerateScenarioInput['terrainType'], string> = {
            Highland: 'Ridge',
            Forest: 'Canopy',
            Urban: 'Sector',
            Plains: 'Strike',
            Desert: 'Dune',
        };

        return GenerateScenarioOutputSchema.parse({
            scenarioTitle: `Operation ${titleByTerrain[input.terrainType]} Vector`,
            briefing: `${input.missionContext} Forces are deployed for ${input.objectiveType.toLowerCase()} under ${input.terrainType.toLowerCase()} conditions.`,
            units,
            mapPeaks,
        });
    };

    const instruction = `OUTPUT STRICTLY VALID JSON DICTIONARY ONLY. NO EXPLANATIONS. NO MARKDOWN.
Generate a tactical scenario as a highly compressed JSON dictionary containing "u" (units array, max 4) and "p" (terrain peaks array, EXACTLY 3).

FORMAT KEY FOR "u" (4 UNITS):
"l" = label (String, short military unit name)
"c" = class (Must be: Infantry, Mechanized, Armor, Artillery, Recon, Logistics, Command Unit, Infrastructure, Objective)
"r" = role (Must be: FRIENDLY, ENEMY, NEUTRAL, INFRASTRUCTURE)
"x" = 1 to 44
"y" = 1 to 28

FORMAT KEY FOR "p" (3 TERRAIN PEAKS - Determines Map Topography):
"x" = 1 to 44
"y" = 1 to 28
"h" = Peak Height (Float 0.5 to 1.5)

EXAMPLE OUPUT (NO MARKDOWN TICK BLOCKS, RAW DICT ONLY):
{"u":[{"l":"Bravo Armor","c":"Armor","r":"FRIENDLY","x":12,"y":14},{"l":"Outpost","c":"Objective","r":"NEUTRAL","x":36,"y":20}],"p":[{"x":22,"y":12,"h":1.2},{"x":10,"y":20,"h":0.8}]}
`;

    const battlefield_data = `MISSION: ${input.missionContext}
TERRAIN: ${input.terrainType}
BALANCE: ${input.forceBalance}
OBJS: ${input.objectiveType}

GENERATE RAW JSON SECURE DICTIONARY:`;

    const res = await fetch('http://127.0.0.1:8000/api/sitrep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            instruction,
            battlefield_data,
            max_new_tokens: 500,    // Increased cap for safety
            use_cache: true,
            do_sample: false,       // Greedy decoding
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
        console.warn('No JSON start token found in scenario output. Using fallback mapper.');
        return fallbackFromText(text);
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
        console.warn('JSON extraction failed in scenario output. Using fallback mapper.');
        return fallbackFromText(text);
    }

    // ── JSON Repair Heuristics ──────────────────────────────────────────────────

    // 1. Handle missing commas between key-value pairs: "val" "key": -> "val", "key":
    jsonString = jsonString.replace(/"\s+("[\w_]+"\s*:)/g, '", $1');

    // 2. Handle missing commas between objects in arrays: } { -> }, {
    jsonString = jsonString.replace(/\}\s*\{/g, '}, {');

    // 3. Fix unquoted keys: {key: -> {"key":
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

    // 4. Fix unescaped quotes and literal newlines in labels
    const keysToFix = ["l"];
    for (const key of keysToFix) {
        const regex = new RegExp(`("${key}"\\s*:\\s*")([\\s\\S]*?)(?="\\s*[,}\\]])`, 'g');
        jsonString = jsonString.replace(regex, (match, p1, p2) => {
            let val = p2.replace(/(?<!\\)"/g, '\\"');
            val = val.replace(/\n/g, '\\n');
            return p1 + val;
        });
    }

    // 5. Handle trailing commas
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');

    // 6. Close any unclosed braces/brackets (common if max_tokens is hit)
    let openBraces = (jsonString.match(/\{/g) || []).length - (jsonString.match(/\}/g) || []).length;
    while (openBraces > 0) { jsonString += '}'; openBraces--; }
    let openBrackets = (jsonString.match(/\[/g) || []).length - (jsonString.match(/\]/g) || []).length;
    while (openBrackets > 0) { jsonString += ']'; openBrackets--; }

    try {
        const parsedObj = JSON.parse(jsonString);
        if (!parsedObj.u || !Array.isArray(parsedObj.u)) throw new Error("Parsed JSON missing 'u' array");

        // Map short keys to expected schema keys
        const units = parsedObj.u.map((u: any) => ({
            label: String(u.l || u.label || 'Unknown Unit'),
            assetClass: String(u.c || u.assetClass || 'Infantry'),
            allianceRole: String(u.r || u.role || u.allianceRole || 'NEUTRAL'),
            x: Number(u.x || Math.floor(Math.random() * 44) + 1),
            y: Number(u.y || Math.floor(Math.random() * 28) + 1),
        }));

        // Map Topography Peaks
        const pArray = Array.isArray(parsedObj.p) ? parsedObj.p : [];
        const mapPeaks = pArray.map((p: any) => ({
            cx: Number(p.x || Math.floor(Math.random() * 44)),
            cy: Number(p.y || Math.floor(Math.random() * 28)),
            h: Number(p.h || 0.5 + Math.random() * 0.5),
            r2: (Math.random() * 44 * 0.25 + 44 * 0.05) ** 2,
        }));

        // Procedurally inflate unit count up to 10-12 minimum
        const requiredExtras = Math.max(0, 10 - units.length);
        const roles = ['FRIENDLY', 'ENEMY', 'NEUTRAL'];
        const classes = ['Infantry', 'Mechanized', 'Armor', 'Recon', 'Command Unit', 'Infrastructure'];
        for (let i = 0; i < requiredExtras + Math.floor(Math.random() * 3); i++) {
            const role = roles[Math.floor(Math.random() * roles.length)];
            const assetClass = classes[Math.floor(Math.random() * classes.length)];
            const labelPrefixes = role === 'FRIENDLY' ? ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'] : ['Red', 'Vanguard', 'Iron', 'Shadow'];
            const prefix = labelPrefixes[Math.floor(Math.random() * labelPrefixes.length)];

            // Bias coordinates based on side
            const isFriendly = role === 'FRIENDLY';
            const randomX = isFriendly ? Math.floor(Math.random() * 20) + 1 : Math.floor(Math.random() * 20) + 24;

            units.push({
                label: `${prefix} ${assetClass}`,
                assetClass,
                allianceRole: role,
                x: randomX,
                y: Math.floor(Math.random() * 28) + 1,
            });
        }

        // Dynamically compute the Title and Briefing so the model doesn't waste tokens
        const adjs = ['Iron', 'Silent', 'Crimson', 'Midnight', 'Shattered', 'Phantom', 'Cobalt', 'Steel'];
        const nouns: Record<string, string> = {
            'Highland': 'Ridge', 'Forest': 'Canopy', 'Urban': 'Sector', 'Plains': 'Strike', 'Desert': 'Dune'
        };
        const scenarioTitle = `Operation ${adjs[Math.floor(Math.random() * adjs.length)]} ${nouns[input.terrainType] || 'Storm'}`;
        const briefing = `${input.missionContext} Tactical deployment required to achieve ${input.objectiveType.toLowerCase()}.`;

        // Validate with the Zod schema
        return GenerateScenarioOutputSchema.parse({
            scenarioTitle,
            briefing,
            units,
            mapPeaks
        });
    } catch (e: any) {
        console.error("Failed to parse JSON from local model:", text, e);
        return fallbackFromText(text);
    }
}
