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
    const { prompt, output, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert AI output evaluator. Analyze the quality of AI-generated content and provide structured feedback.

Evaluate the output based on these criteria:
1. **Relevance** (1-5): How well does the output address the prompt and use the provided context?
2. **Accuracy** (1-5): Is the information factually correct and consistent with the context?
3. **Clarity** (1-5): Is the output well-structured, clear, and easy to understand?
4. **Completeness** (1-5): Does the output fully address all aspects of the prompt?
5. **Creativity** (1-5): Does the output demonstrate appropriate creativity and originality?

Provide your evaluation in the following JSON format only, no other text:
{
  "overallScore": <number 1-5>,
  "criteria": {
    "relevance": { "score": <1-5>, "feedback": "<brief feedback>" },
    "accuracy": { "score": <1-5>, "feedback": "<brief feedback>" },
    "clarity": { "score": <1-5>, "feedback": "<brief feedback>" },
    "completeness": { "score": <1-5>, "feedback": "<brief feedback>" },
    "creativity": { "score": <1-5>, "feedback": "<brief feedback>" }
  },
  "summary": "<2-3 sentence overall assessment>",
  "suggestions": ["<improvement suggestion 1>", "<improvement suggestion 2>"]
}`;

    const userPrompt = `Evaluate this AI output:

**Context Provided:**
${context || 'No context provided'}

**Agentic Prompt Given:**
${prompt}

**AI Output:**
${output}`;

    console.log("Calling Lovable AI for evaluation...");

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

    console.log("AI evaluation response:", content);

    // Parse the JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse evaluation response");
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ evaluation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
