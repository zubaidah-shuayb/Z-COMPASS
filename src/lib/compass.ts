import { supabase } from "@/integrations/supabase/client";

export const MAX_SITUATION_CHARS = 6000;
export const MAX_ANSWER_CHARS = 1600;
export const MAX_PAYLOAD_CHARS = 40000;

export type CompassAction =
  | "map_situation"
  | "generate_questions"
  | "discover_conflict"
  | "generate_paths"
  | "pressure_test"
  | "future_glance"
  | "generate_north";

export type MapRole = "desire" | "constraint" | "tension" | "hesitation" | "unknown" | "signal";

export type MapSection = {
  id: string;
  label: string;
  role: MapRole;
  insight: string;
};

export type CompassMap = {
  title: string;
  overview: string;
  sections: MapSection[];
};

export type CompassQuestion = {
  id: string;
  question: string;
  why_it_matters: string;
};

export type QuestionSet = { questions: CompassQuestion[] };

export type QuestionAnswer = {
  question_id: string;
  answer: string;
  skipped: boolean;
};

export type Discovery = {
  apparent_decision: string;
  deeper_conflict: string;
  signals: string[];
  uncertainty: string;
};

export type CompassPath = {
  id: string;
  name: string;
  description: string;
  gains: string[];
  costs: string[];
  is_alternative: boolean;
};

export type PathsResult = { paths: CompassPath[] };

export type PressureLens = {
  lens: string;
  insight: string;
  pressure_point: string;
};

export type PressurePath = {
  path_id: string;
  path_name: string;
  lenses: PressureLens[];
};

export type PressureTest = { paths: PressurePath[] };

export type FutureScenario = {
  path_id: string;
  path_name: string;
  timeframe: string;
  scenario: string;
};

export type FutureGlance = {
  disclaimer: string;
  scenarios: FutureScenario[];
};

export type FutureReaction = "right" | "unsure" | "not_me";

export type NorthResult = {
  direction: string;
  why_it_fits: string;
  trade_off: string;
  assumptions: string[];
  change_conditions: string[];
  next_move: string;
};

export type DiscoveryStage =
  | "situation"
  | "map"
  | "questions"
  | "discovery"
  | "paths"
  | "pressure"
  | "future"
  | "north";

export type CompassDraftV2 = {
  version: 2;
  situation: string;
  current_stage?: DiscoveryStage | undefined;
  map?: CompassMap | undefined;
  questions?: CompassQuestion[] | undefined;
  answers?: QuestionAnswer[] | undefined;
  discovery?: Discovery | undefined;
  paths?: CompassPath[] | undefined;
  pressure_test?: PressureTest | undefined;
  future_glance?: FutureGlance | undefined;
  reactions?: Record<string, FutureReaction> | undefined;
  north?: NorthResult | undefined;
  completed_stages?: DiscoveryStage[] | undefined;
  stale_from?: DiscoveryStage | undefined;
};

export class CompassError extends Error {}

function assertPayload(payload: unknown) {
  const text = JSON.stringify(payload ?? {});
  if (text.length > MAX_PAYLOAD_CHARS) {
    throw new CompassError("This session has grown too large to analyse safely. Please shorten your situation or answers.");
  }
  return text;
}

export async function callCompass<T>(
  action: CompassAction,
  decisionId: string,
  payload: unknown,
): Promise<T> {
  assertPayload(payload);
  const { data, error } = await supabase.functions.invoke<{ result: T; error?: string }>(
    "compass-engine",
    { body: { action, decisionId, payload } },
  );

  if (error) {
    const context = (error as { context?: Response }).context;
    const status = context?.status;
    let responseMessage = "";
    if (context) {
      try {
        const body = (await context.clone().json()) as { error?: string };
        responseMessage = body.error?.trim() ?? "";
      } catch {
        responseMessage = "";
      }
    }
    if (status === 429) throw new CompassError("The Compass is busy right now. Please try again in a moment.");
    if (status === 401) throw new CompassError("Your session expired. Please sign in again.");
    throw new CompassError(responseMessage || "The Compass couldn't respond. Please try again.");
  }
  if (!data || data.error) throw new CompassError(data?.error || "The Compass couldn't respond.");
  return data.result;
}

export function answerFor(answers: QuestionAnswer[] | undefined, questionId: string) {
  return answers?.find((answer) => answer.question_id === questionId);
}
