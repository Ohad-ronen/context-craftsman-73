import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { experiments } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!experiments || experiments.length === 0) {
      throw new Error("No experiments provided for analysis");
    }

    const systemPrompt = `You are an expert AI research analyst specializing in prompt engineering and AI output quality. Your task is to analyze multiple AI experiments and identify patterns that lead to better outputs.

Analyze the provided experiments and identify:
1. **Context Patterns**: What types of context (raw data, extracted info) correlate with higher ratings?
2. **Prompt Patterns**: What prompt structures, lengths, or styles produce better results?
3. **Success Factors**: What common elements appear in high-rated experiments?
4. **Improvement Areas**: What patterns appear in lower-rated experiments that could be improved?
5. **Actionable Recommendations**: Specific, actionable advice for improving future experiments.

Provide your analysis in the following JSON format only, no other text:
{
  "overallInsights": "<2-3 sentence summary of key findings>",
  "contextPatterns": {
    "findings": ["<finding 1>", "<finding 2>"],
    "recommendation": "<actionable recommendation>"
  },
  "promptPatterns": {
    "findings": ["<finding 1>", "<finding 2>"],
    "recommendation": "<actionable recommendation>"
  },
  "successFactors": ["<factor 1>", "<factor 2>", "<factor 3>"],
  "improvementAreas": ["<area 1>", "<area 2>"],
  "topRecommendations": [
    { "title": "<short title>", "description": "<detailed recommendation>" },
    { "title": "<short title>", "description": "<detailed recommendation>" },
    { "title": "<short title>", "description": "<detailed recommendation>" }
  ],
  "ratingCorrelations": {
    "highRatedCommonalities": "<what high-rated experiments have in common>",
    "lowRatedCommonalities": "<what low-rated experiments have in common>"
  }
}`;

    // Prepare experiment summaries for analysis
    const experimentSummaries = experiments.map((exp: any, index: number) => `
--- Experiment ${index + 1}: "${exp.name}" ---
Rating: ${exp.rating || 'Not rated'}/5
Status: ${exp.status}
Raw Data Sources: ${exp.raw_data_sources?.substring(0, 500) || 'None'}
Extracted Context: ${exp.extracted_context?.substring(0, 500) || 'None'}
Prompt: ${exp.prompt?.substring(0, 500) || 'None'}
Output Preview: ${exp.output?.substring(0, 300) || 'None'}
Notes: ${exp.notes?.substring(0, 200) || 'None'}
`).join('\n');

    const userPrompt = `Analyze these ${experiments.length} AI experiments and identify patterns that lead to better outputs:

${experimentSummaries}

Focus on finding actionable insights that will help improve future experiments.`;

    console.log("Calling Lovable AI for experiment analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("AI analysis response:", content);

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse analysis response");
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
