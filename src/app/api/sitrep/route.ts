import { NextResponse } from 'next/server';

const AI_SERVER_BASE = process.env.AI_SERVER_BASE_URL ?? 'http://127.0.0.1:8000';
const SIM_SERVER_BASE = process.env.SIM_SERVER_BASE_URL ?? 'http://127.0.0.1:8001';
const INFERENCE_TIMEOUT_MS = 300_000; // 5 min — CPU inference can be slow
const HEALTH_TIMEOUT_MS = 5_000;     // 5 s  — quick ping only
const SIM_TIMEOUT_MS = 120_000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SitrepRequestBody {
    /** The operator's raw tactical directive / question */
    directive?: string;
    /** Current battlefield state (units, grid positions, weather, etc.) */
    battlefield_data?: string;
    /**
     * Optional operational mode — used to enrich the instruction sent to the
     * model so it frames its response correctly.
     */
    mode?: 'SCENARIO_SEED' | 'INTEL_UPDATE' | 'FOG_OF_WAR' | 'EXPLAIN_DECISION' | 'GENERAL';
    /** Max tokens for the model to emit (clamped to 64-1024). */
    max_new_tokens?: number;
    /** Sampling temperature (clamped to 0.0-2.0). */
    temperature?: number;
    /** Nucleus sampling top-p (clamped to 0.1-1.0). */
    top_p?: number;

    // Simulation-tick payload
    command?: unknown;
    current_state?: unknown;
    end_simulation?: boolean;
    initialize_scenario?: boolean;
    scenario?: unknown;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps the UI mode into a concrete instruction passed to the wargaming model. */
function buildInstruction(directive: string, mode: SitrepRequestBody['mode']): string {
    const prefixes: Record<NonNullable<SitrepRequestBody['mode']>, string> = {
        SCENARIO_SEED:
            'Generate a full operational scenario briefing including strategic context, battlefield situation, and initial intelligence based on the following:',
        INTEL_UPDATE:
            'Provide a detailed intelligence update including enemy movements, signal intercepts, and threat assessments based on the following:',
        FOG_OF_WAR:
            'Inject a realistic fog-of-war uncertainty event (lost comms, unidentified units, weather disruption) into the following scenario:',
        EXPLAIN_DECISION:
            'Provide structured explainable reasoning for the simulation results, predicted outcomes, and risk signals based on the following:',
        GENERAL: 'Generate a tactical SITREP in response to the following commander directive:',
    };

    const prefix = prefixes[mode ?? 'GENERAL'];
    return `${prefix}\n\n${directive}`;
}

/** Safely clamps a number within a min/max range. */
function clamp(val: number | undefined, min: number, max: number, def: number): number {
    if (val === undefined || isNaN(Number(val))) return def;
    return Math.max(min, Math.min(max, Number(val)));
}

// ─── GET  /api/sitrep  (health check proxy) ───────────────────────────────────

export async function GET() {
    try {
        const res = await fetch(`${AI_SERVER_BASE}/health`, {
            signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch {
        return NextResponse.json(
            { ok: false, error: 'ai_server_offline', model_loaded: false },
            { status: 503 }
        );
    }
}

// ─── POST /api/sitrep ─────────────────────────────────────────────────────────

function isSimulationTickRequest(raw: SitrepRequestBody): boolean {
    return (
        raw.command !== undefined ||
        raw.current_state !== undefined ||
        raw.end_simulation === true
    );
}

function isScenarioInitializationRequest(raw: SitrepRequestBody): boolean {
    return raw.initialize_scenario === true || raw.scenario !== undefined;
}

export async function POST(req: Request) {
    // 1. Parse incoming body
    let raw: SitrepRequestBody;
    try {
        raw = (await req.json()) as SitrepRequestBody;
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // 2. Branch by payload type
    if (isScenarioInitializationRequest(raw)) {
        const payload = {
            scenario: raw.scenario,
        };

        try {
            const res = await fetch(`${SIM_SERVER_BASE}/api/initialize_scenario`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(SIM_TIMEOUT_MS),
            });

            const data = await res.json();
            return NextResponse.json(data, { status: res.status });
        } catch (err: unknown) {
            const isTimeout =
                (err instanceof DOMException && err.name === 'TimeoutError') ||
                (err instanceof Error && err.name === 'TimeoutError');

            if (isTimeout) {
                return NextResponse.json(
                    {
                        error: 'scenario_initialization_timeout',
                        details: `Scenario initialization timed out after ${SIM_TIMEOUT_MS / 1000}s.`,
                    },
                    { status: 504 }
                );
            }

            return NextResponse.json(
                {
                    error: 'simulation_backend_offline',
                    details: 'Could not reach the Python simulation backend. Is backend/main.py running on port 8001?',
                },
                { status: 503 }
            );
        }
    }

    if (isSimulationTickRequest(raw)) {
        const payload = {
            command: raw.command ?? raw.directive ?? 'hold position',
            current_state: raw.current_state,
            end_simulation: raw.end_simulation ?? false,
            max_new_tokens: clamp(raw.max_new_tokens, 32, 512, 320),
            temperature: clamp(raw.temperature, 0.0, 2.0, 0.45),
            top_p: clamp(raw.top_p, 0.1, 1.0, 0.9),
        };

        try {
            const res = await fetch(`${SIM_SERVER_BASE}/api/simulate_tick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(SIM_TIMEOUT_MS),
            });

            const data = await res.json();
            return NextResponse.json(data, { status: res.status });
        } catch (err: unknown) {
            const isTimeout =
                (err instanceof DOMException && err.name === 'TimeoutError') ||
                (err instanceof Error && err.name === 'TimeoutError');

            if (isTimeout) {
                return NextResponse.json(
                    {
                        error: 'simulation_timeout',
                        details: `Simulation backend did not respond within ${SIM_TIMEOUT_MS / 1000}s.`,
                    },
                    { status: 504 }
                );
            }

            return NextResponse.json(
                {
                    error: 'simulation_backend_offline',
                    details: 'Could not reach the Python simulation backend. Is backend/main.py running on port 8001?',
                },
                { status: 503 }
            );
        }
    }

    // 3. Validate required fields for AI-only endpoint
    const directive = (raw.directive ?? '').trim();
    const battlefield_data = (raw.battlefield_data ?? '').trim();

    if (!directive && !battlefield_data) {
        return NextResponse.json(
            { error: 'At least one of directive or battlefield_data is required.' },
            { status: 400 }
        );
    }

    // 4. Structure / enrich the payload before forwarding
    const payload = {
        instruction: buildInstruction(directive || 'Generate a tactical SITREP.', raw.mode),
        battlefield_data: battlefield_data || directive,
        max_new_tokens: clamp(raw.max_new_tokens, 32, 512, 150),
        temperature: clamp(raw.temperature, 0.0, 2.0, 0.45),
        top_p: clamp(raw.top_p, 0.1, 1.0, 0.9),
    };

    // 5. Forward to the Python AI server
    try {
        const res = await fetch(`${AI_SERVER_BASE}/api/sitrep`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(INFERENCE_TIMEOUT_MS),
        });

        const data = await res.json();

        if (!res.ok) {
            // Python server is reachable but returned an error (e.g. inference failed)
            return NextResponse.json(
                {
                    error: 'ai_inference_error',
                    details: data?.details ?? data?.error ?? 'Inference failed on the AI server.',
                },
                { status: res.status }
            );
        }

        return NextResponse.json(data, { status: res.status });
    } catch (err: unknown) {
        const isTimeout =
            (err instanceof DOMException && err.name === 'TimeoutError') ||
            (err instanceof Error && err.name === 'TimeoutError');

        if (isTimeout) {
            // Server is alive but inference took too long — NOT the same as offline
            return NextResponse.json(
                {
                    error: 'ai_inference_timeout',
                    details: `AI server did not respond within ${INFERENCE_TIMEOUT_MS / 1000}s. The model may still be running.`,
                },
                { status: 504 }
            );
        }

        return NextResponse.json(
            {
                error: 'ai_server_offline',
                details: 'Could not reach the local AI server. Is backend_server.py running?',
            },
            { status: 503 }
        );
    }
}
