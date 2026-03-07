import { NextResponse } from 'next/server';
import {
  generateScenario,
  type GenerateScenarioInput,
} from '@/ai/flows/generate-scenario';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: GenerateScenarioInput;
  try {
    body = (await req.json()) as GenerateScenarioInput;
  } catch {
    return NextResponse.json(
      { error: 'invalid_json', details: 'Request body must be valid JSON.' },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body.missionContext !== 'string' ||
    typeof body.terrainType !== 'string' ||
    typeof body.forceBalance !== 'string' ||
    typeof body.objectiveType !== 'string'
  ) {
    return NextResponse.json(
      {
        error: 'invalid_payload',
        details: 'Missing required fields: missionContext, terrainType, forceBalance, objectiveType.',
      },
      { status: 400 },
    );
  }

  try {
    const result = await generateScenario(body);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scenario generation failed.';
    console.error('[api/generate-scenario] generation failed:', err);
    return NextResponse.json(
      { error: 'scenario_generation_failed', details: message },
      { status: 500 },
    );
  }
}
