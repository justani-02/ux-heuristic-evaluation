import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const systemPrompt = `You are an expert UX researcher, usability analyst, and product strategist. You evaluate websites using Jakob Nielsen's 10 Usability Heuristics and provide actionable decision intelligence.

Given website content, analyze it and return structured JSON data via the provided tool.

For each of the 10 heuristics, identify specific issues found on the website. Be specific and actionable. Rate severity as "Low", "Medium", or "High".

For each heuristic result, also provide:
- sub_scores (0-100) for: Navigation Clarity, Information Hierarchy, Feedback Visibility, Error Prevention, Interaction Efficiency
- impact: "High", "Medium", or "Low" — based on how much this issue affects user goals and business outcomes
- effort: "High", "Medium", or "Low" — based on implementation complexity to fix
- kpi_impact: which business KPI this most affects (e.g., "Conversion Rate", "Task Completion", "User Retention", "Bounce Rate", "Time on Task", "Error Rate")
- risk_level: "High", "Medium", or "Low" — the risk of NOT fixing this issue
- task_title: a short actionable fix description (e.g., "Add breadcrumb navigation")
- task_description: a detailed description of what needs to be done to fix this issue

Also generate:
- An overall UX score from 0-100
- A page title
- A brief executive summary (2-3 sentences)

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
              description: "Return the complete UX heuristic evaluation results with decision intelligence data",
              parameters: {
                type: "object",
                properties: {
                  page_title: { type: "string", description: "The title/name of the website page" },
                  summary: { type: "string", description: "Executive summary of the UX evaluation (2-3 sentences)" },
                  overall_score: { type: "integer", minimum: 0, maximum: 100 },
                  heuristic_results: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        heuristic_name: { type: "string", description: "Name of the Nielsen heuristic" },
                        issue: { type: "string", description: "Specific issue found" },
                        severity: { type: "string", enum: ["Low", "Medium", "High"] },
                        recommendation: { type: "string", description: "Actionable recommendation to fix the issue" },
                        impact: { type: "string", enum: ["Low", "Medium", "High"], description: "Effect on user goals and business outcomes" },
                        effort: { type: "string", enum: ["Low", "Medium", "High"], description: "Implementation complexity" },
                        kpi_impact: { type: "string", description: "Business KPI most affected (e.g., Conversion Rate, Task Completion, User Retention)" },
                        risk_level: { type: "string", enum: ["Low", "Medium", "High"], description: "Risk of not fixing this issue" },
                        task_title: { type: "string", description: "Short actionable fix description" },
                        task_description: { type: "string", description: "Detailed description of what needs to be done" },
                        sub_scores: {
                          type: "object",
                          properties: {
                            "Navigation Clarity": { type: "integer", minimum: 0, maximum: 100 },
                            "Information Hierarchy": { type: "integer", minimum: 0, maximum: 100 },
                            "Feedback Visibility": { type: "integer", minimum: 0, maximum: 100 },
                            "Error Prevention": { type: "integer", minimum: 0, maximum: 100 },
                            "Interaction Efficiency": { type: "integer", minimum: 0, maximum: 100 },
                          },
                          required: ["Navigation Clarity", "Information Hierarchy", "Feedback Visibility", "Error Prevention", "Interaction Efficiency"],
                          additionalProperties: false,
                        },
                      },
                      required: ["heuristic_name", "issue", "severity", "recommendation", "impact", "effort", "kpi_impact", "risk_level", "task_title", "task_description", "sub_scores"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["page_title", "summary", "overall_score", "heuristic_results"],
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
