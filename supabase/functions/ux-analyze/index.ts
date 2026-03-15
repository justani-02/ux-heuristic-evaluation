import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HEURISTICS = [
  "Visibility of system status",
  "Match between system and the real world",
  "User control and freedom",
  "Consistency and standards",
  "Error prevention",
  "Recognition rather than recall",
  "Flexibility and efficiency of use",
  "Aesthetic and minimalist design",
  "Help users recognize and recover from errors",
  "Help and documentation",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, markdown, screenshot_url } = await req.json();

    if (!markdown) {
      return new Response(
        JSON.stringify({ success: false, error: "Website content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert UX researcher and usability analyst. You evaluate websites using Jakob Nielsen's 10 Usability Heuristics from the Nielsen Norman Group.

Given website content, you must analyze it and return structured JSON data via the provided tool.

For each of the 10 heuristics, identify specific issues found on the website. Be specific and actionable. Rate severity as "Low", "Medium", or "High".

Also generate:
- An overall UX score from 0-100
- Sub-scores (0-100) for: navigation_clarity, information_hierarchy, feedback_visibility, error_prevention, interaction_efficiency
- A brief executive summary (2-3 sentences)
- 3-5 actionable recommendation cards with title, problem, impact, and solution

Be thorough but realistic. Not every heuristic will have violations.`;

    const userPrompt = `Analyze this website for UX usability issues.

URL: ${url}

Website Content:
${markdown.substring(0, 12000)}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "ux_evaluation_result",
              description: "Return the complete UX heuristic evaluation results",
              parameters: {
                type: "object",
                properties: {
                  page_title: { type: "string", description: "The title/name of the website page" },
                  summary: { type: "string", description: "Executive summary of the UX evaluation (2-3 sentences)" },
                  overall_score: { type: "integer", minimum: 0, maximum: 100 },
                  navigation_clarity_score: { type: "integer", minimum: 0, maximum: 100 },
                  information_hierarchy_score: { type: "integer", minimum: 0, maximum: 100 },
                  feedback_visibility_score: { type: "integer", minimum: 0, maximum: 100 },
                  error_prevention_score: { type: "integer", minimum: 0, maximum: 100 },
                  interaction_efficiency_score: { type: "integer", minimum: 0, maximum: 100 },
                  heuristic_violations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        heuristic: { type: "string" },
                        issue: { type: "string" },
                        severity: { type: "string", enum: ["Low", "Medium", "High"] },
                        recommendation: { type: "string" },
                      },
                      required: ["heuristic", "issue", "severity", "recommendation"],
                      additionalProperties: false,
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        problem: { type: "string" },
                        impact: { type: "string" },
                        solution: { type: "string" },
                      },
                      required: ["title", "problem", "impact", "solution"],
                      additionalProperties: false,
                    },
                  },
                },
                required: [
                  "page_title", "summary", "overall_score",
                  "navigation_clarity_score", "information_hierarchy_score",
                  "feedback_visibility_score", "error_prevention_score",
                  "interaction_efficiency_score", "heuristic_violations", "recommendations",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "ux_evaluation_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ success: false, error: "AI analysis failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.error("No tool call in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ success: false, error: "AI did not return structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    result.screenshot_url = screenshot_url || null;

    console.log("UX analysis complete, score:", result.overall_score);

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
