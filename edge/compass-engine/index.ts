
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const MODEL_CANDIDATES = [
  Deno.env.get("GEMINI_MODEL")?.trim() || "",
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
].filter((m, i, a) => m && a.indexOf(m) === i);
const geminiUrl = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/$/, "").toLowerCase();
}

function isLocalOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return LOCAL_HOSTNAMES.has(url.hostname) &&
      (url.protocol === "http:" || url.protocol === "https:");
  } catch {
    return false;
  }
}

function allowedProductionOrigins(): Set<string> {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const set = new Set<string>();
  for (const item of raw.split(",")) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    set.add(normalizeOrigin(trimmed));
  }
  return set;
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (isLocalOrigin(origin)) return true;
  return allowedProductionOrigins().has(normalizeOrigin(origin));
}

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin)
      ? (origin as string)
      : "null",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const MAX_CHARS = 40000;

type Action =
  | "map_situation"
  | "generate_questions"
  | "discover_conflict"
  | "generate_paths"
  | "pressure_test"
  | "future_glance"
  | "generate_north";

const stringArray = { type: "ARRAY", items: { type: "STRING" } };

const schemas: Record<Action, unknown> = {
  map_situation: {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" }, overview: { type: "STRING" },
      sections: { type: "ARRAY", minItems: 3, maxItems: 6, items: { type: "OBJECT", properties: {
        id: { type: "STRING" }, label: { type: "STRING" },
        role: { type: "STRING", enum: ["desire", "constraint", "tension", "hesitation", "unknown", "signal"] },
        insight: { type: "STRING" },
      }, required: ["id", "label", "role", "insight"] } },
    }, required: ["title", "overview", "sections"],
  },
  generate_questions: {
    type: "OBJECT", properties: { questions: { type: "ARRAY", minItems: 3, maxItems: 5, items: {
      type: "OBJECT", properties: { id: { type: "STRING" }, question: { type: "STRING" }, why_it_matters: { type: "STRING" } },
      required: ["id", "question", "why_it_matters"],
    } } }, required: ["questions"],
  },
  discover_conflict: {
    type: "OBJECT", properties: {
      apparent_decision: { type: "STRING" }, deeper_conflict: { type: "STRING" },
      signals: stringArray, uncertainty: { type: "STRING" },
    }, required: ["apparent_decision", "deeper_conflict", "signals", "uncertainty"],
  },
  generate_paths: {
    type: "OBJECT", properties: { paths: { type: "ARRAY", minItems: 2, maxItems: 4, items: {
      type: "OBJECT", properties: {
        id: { type: "STRING" }, name: { type: "STRING" }, description: { type: "STRING" },
        gains: stringArray, costs: stringArray, is_alternative: { type: "BOOLEAN" },
      }, required: ["id", "name", "description", "gains", "costs", "is_alternative"],
    } } }, required: ["paths"],
  },
  pressure_test: {
    type: "OBJECT", properties: { paths: { type: "ARRAY", items: { type: "OBJECT", properties: {
      path_id: { type: "STRING" }, path_name: { type: "STRING" }, lenses: { type: "ARRAY", items: {
        type: "OBJECT", properties: { lens: { type: "STRING" }, insight: { type: "STRING" }, pressure_point: { type: "STRING" } },
        required: ["lens", "insight", "pressure_point"],
      } },
    }, required: ["path_id", "path_name", "lenses"] } } }, required: ["paths"],
  },
  future_glance: {
    type: "OBJECT", properties: {
      disclaimer: { type: "STRING" }, scenarios: { type: "ARRAY", items: { type: "OBJECT", properties: {
        path_id: { type: "STRING" }, path_name: { type: "STRING" }, timeframe: { type: "STRING" }, scenario: { type: "STRING" },
      }, required: ["path_id", "path_name", "timeframe", "scenario"] } },
    }, required: ["disclaimer", "scenarios"],
  },
  generate_north: {
    type: "OBJECT", properties: {
      direction: { type: "STRING" }, why_it_fits: { type: "STRING" }, trade_off: { type: "STRING" },
      assumptions: stringArray, change_conditions: stringArray, next_move: { type: "STRING" },
    }, required: ["direction", "why_it_fits", "trade_off", "assumptions", "change_conditions", "next_move"],
  },
};

const SYSTEM = `You are Z-COMPASS. You sound like a smart, calm, emotionally aware friend helping someone untangle a messy situation.
Think deeply, but talk like a human.

Voice rules:
- Use simple, everyday English. Never use a complicated word when a simple one works.
- Write like you're talking to one person: "Here's what I'm seeing." "That makes sense." "This is a tough one."
- Short sentences. Short paragraphs. Easy to scan. No dense blocks of text.
- A teenager and a grandparent should both understand every line without re-reading.
- Never sound like a professor, therapist, consultant, life coach, textbook or motivational speaker.
- Banned vocabulary style: "underlying", "novelty-seeking", "implementation friction", "directional priorities", "exhibit", "demonstrate", "leverage", "optimise", "framework", "cognitive", and similar jargon.
- Be emotionally aware without pretending to know how the user feels. Use "It sounds like...", "It looks like...", "You may be feeling...".
- Never diagnose, never make psychological claims as facts, never act like you have the perfect answer.
- Never say "you should", "you must", "the correct decision is". Offer direction; the user chooses.
- Use only what the user told you. Don't invent facts, numbers, names or motives.
- No scores, rankings, percentages or decision-matrix language.
- No hype, no clichés, no emojis. Calm and warm, still premium.
- For medical, legal, financial or mental-health matters, gently suggest speaking to a qualified professional.
- Always answer with JSON matching the provided schema, and write every text field in this voice.`;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    // --- 1. Authenticate the caller -------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // --- 2. Validate input ----------------------------------------------
    const body = await req.json().catch(() => null) as
      | { action?: Action; decisionId?: string; payload?: unknown }
      | null;

    const action = body?.action;
    if (!action || !(action in schemas)) {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const payloadText = JSON.stringify(body?.payload ?? {});
    if (payloadText.length > MAX_CHARS) {
      return new Response(
        JSON.stringify({ error: "Your input is too long. Please shorten it." }),
        { status: 413, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    // --- 3. Confirm the decision belongs to the caller -------------------
    if (body?.decisionId) {
      const { data: row, error } = await supabase
        .from("decisions")
        .select("id, user_id")
        .eq("id", body.decisionId)
        .maybeSingle();
      if (error || !row || row.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    // --- 4. Call Gemini ---------------------------------------------------
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI is not configured yet." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const prompts: Record<Action, string> = {
      map_situation: "Lay out what's going on, the way a friend would say 'okay, here's what I'm seeing'. Give a short plain title and a warm 2-3 sentence overview, then 3 to 6 sections that only cover what actually matters here. Short snake_case ids. Point out what's pulling at them and what we still don't know, in plain words.",
      generate_questions: "Ask 3 to 5 curious, easy questions whose answers could really change the direction. Sound interested, not like a form. Keep each question one or two short sentences a teenager would understand. Short snake_case ids. Say why the answer matters in one simple line.",
      discover_conflict: "Say what this looked like at first, then what might really be going on underneath, in everyday words. Only use what they told you. Use 'It sounds like', 'It looks like', 'There might be something deeper here'. Be kind about it, never clinical. End with the one thing we honestly still don't know, and say that's okay.",
      generate_paths: "Give 2 to 4 realistic, clearly different paths, including one they may not have thought of. Short snake_case ids. For each: a plain-English name, what this actually looks like day to day, what they gain, what they give up. Simple sentences. Don't rank them.",
      pressure_test: "Be honest about the hard part of each path, the way a friend who cares would be. For each path use only the angles that matter here (time, going back on it, energy, risk, regret). Write each one as plain talk, e.g. 'What happens when this gets frustrating?'. No scores, no jargon. Only name a pressure point if their own words support it.",
      future_glance: "For each path, write one short, believable 'a few weeks from now...' picture. This is not a prediction. Use 'You might', 'You could', 'One possible outcome is'. Warm and human, a few short sentences. Keep path ids unchanged.",
      generate_north: "Give the direction that seems to fit best right now, based only on what they shared. Start like 'Based on what you've told me...'. Never call it the answer or the correct choice. Explain simply why it fits, name one honest trade-off, list the assumptions as 'this makes sense if...', list when it would make sense to rethink this, and give exactly one small, doable next move that doesn't overwhelm them.",
    };

    const requestBody = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{
        role: "user",
        parts: [{ text: `${prompts[action]}\n\nSession data:\n${payloadText}` }],
      }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: schemas[action],
      },
    });

    let geminiRes: Response | null = null;
    let usedModel = MODEL_CANDIDATES[0];
    const triedModels: string[] = [];
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    // Ask the API which models this key can actually use, then try those first.
    async function discoverModels(): Promise<string[]> {
      try {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models?pageSize=100",
          { headers: { "x-goog-api-key": apiKey! } },
        );
        if (!res.ok) return [];
        const json = await res.json() as {
          models?: { name?: string; supportedGenerationMethods?: string[] }[];
        };
        // Exclude non-text models (speech, image, embedding, live, etc.) —
        // they reject TEXT responses with a 400.
        const EXCLUDE = /(tts|audio|image|vision-only|embedding|embed|live|realtime|native-audio|dialog)/i;
        return (json.models ?? [])
          .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m) => (m.name ?? "").replace(/^models\//, ""))
          .filter((n) => n && n.includes("flash") && !n.includes("thinking") && !EXCLUDE.test(n));
      } catch {
        return [];
      }
    }

    const discovered = await discoverModels();
    const candidates = [...MODEL_CANDIDATES, ...discovered]
      .filter((m, i, a) => m && a.indexOf(m) === i);

    // Try each model; if a model is missing (404) or overloaded (503/429),
    // retry it briefly and then fall back to the next candidate model.
    outer:
    for (const model of candidates) {
      usedModel = model;
      triedModels.push(model);
      for (let attempt = 0; attempt < 3; attempt++) {
        geminiRes = await fetch(geminiUrl(model), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: requestBody,
        });
        if (geminiRes.status === 404) {
          console.warn(`Gemini model unavailable: ${model}`);
          continue outer;
        }
        // Some models only return AUDIO/IMAGE and reject a TEXT/JSON response.
        if (geminiRes.status === 400) {
          const detail = await geminiRes.clone().text();
          if (/response modalities/i.test(detail)) {
            console.warn(`Gemini model not text-capable: ${model}`);
            continue outer;
          }
        }
        if (geminiRes.status === 503 || geminiRes.status === 429) {
          console.warn(`Gemini ${geminiRes.status} on ${model}, attempt ${attempt + 1}`);
          if (attempt < 2) {
            await sleep(600 * (attempt + 1));
            continue;
          }
          continue outer; // try the next model
        }
        break outer;
      }
    }


    if (!geminiRes) {
      return new Response(JSON.stringify({ error: "No Gemini model is configured." }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (geminiRes.status === 429 || geminiRes.status === 503) {
      return new Response(
        JSON.stringify({ error: "The Compass is busy right now. Please try again in a moment." }),
        { status: 429, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }
    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      console.error("Gemini error", geminiRes.status, usedModel, detail);
      let upstreamMessage = "";
      try {
        const parsed = JSON.parse(detail) as { error?: { message?: string } };
        upstreamMessage = parsed.error?.message?.trim() ?? "";
      } catch {
        upstreamMessage = "";
      }

      const message = geminiRes.status === 400
        ? `Gemini rejected the request${upstreamMessage ? `: ${upstreamMessage}` : "."}`
        : geminiRes.status === 401 || geminiRes.status === 403
        ? `Gemini access was denied${upstreamMessage ? `: ${upstreamMessage}` : "."} Check that GEMINI_API_KEY is a valid Google AI Studio key, that the Generative Language API is enabled for its project, and that no HTTP-referrer/IP restriction blocks server calls.`
        : geminiRes.status === 404
        ? `No Gemini model is available for this API key (tried: ${triedModels.join(", ")}). Check that the Generative Language API is enabled for the key, or set the GEMINI_MODEL secret to a model your key can use.`
        : upstreamMessage || "The Compass could not respond. Please try again.";
      return new Response(
        JSON.stringify({ error: message }),
        {
          status: geminiRes.status >= 500 ? 502 : geminiRes.status,
          headers: { ...cors, "Content-Type": "application/json" },
        },
      );
    }

    const gemini = await geminiRes.json();
    const text = gemini?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    let result: unknown;
    try {
      result = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: "The Compass returned an unreadable answer. Please try again." }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    if (!result || typeof result !== "object") {
      return new Response(
        JSON.stringify({ error: "The Compass returned an incomplete answer. Please try again." }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ action, result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
