import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const systemPrompt = `You are the Ask Boards AI Assistant. You help users manage their AI experimentation platform.

PLATFORM OVERVIEW:
- Experiments: Track AI agent outputs with ratings (1-5★), goals, missions, and context data
- Tasks: Kanban board (To Do, In Progress, Done) for tracking improvement work
- Templates: Saved experiment configurations for quick reuse
- Views: Dashboard, Cards, Table, Compare, AI Insights, Output Battle, Task Manager

CAPABILITIES (via tools):
1. Query Tools (answer questions):
   - get_experiments_summary: Overall stats (total, rated, avg rating, success rate)
   - get_top_performers: Best experiments by rating
   - get_goal_performance: Performance breakdown by goal
   - get_recent_experiments: Latest experiments
   - get_unrated_experiments: Experiments needing evaluation
   - get_tasks_summary: Task board overview
   - search_experiments: Find experiments by name, goal, or content

2. Action Tools (do things):
   - create_task: Create a new task in Task Manager
   - trigger_experiment: Prepare n8n workflow parameters for a new experiment
   - update_task_status: Move a task between columns

BEHAVIOR:
- Be concise but thorough
- ALWAYS confirm before taking actions (create_task, trigger_experiment, update_task_status)
- Reference specific data (names, numbers, ratings) when available
- Suggest follow-up actions when appropriate
- Use emojis sparingly for visual clarity

IMPORTANT - EXPERIMENT LINKING:
When mentioning experiment names, ALWAYS format them as clickable links using this exact format:
[[experiment_name|experiment_id]]

Example: "Your top performer is [[Product Copy Test|abc123-def456]] with a 5★ rating."

This format allows users to click on experiment names to view details. Always include the experiment ID from the tool results.

When confirming actions, format clearly:
- 📝 For tasks
- 🧪 For experiments
- ✅ For completed actions`;

const tools = [
  {
    type: "function",
    function: {
      name: "get_experiments_summary",
      description: "Get overall statistics about experiments including total count, rated count, average rating, and success rate",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_top_performers",
      description: "Get the top performing experiments sorted by rating",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of top experiments to return (default 5)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_goal_performance",
      description: "Get performance breakdown by goal, showing average rating and experiment count per goal",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_recent_experiments",
      description: "Get the most recent experiments",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of experiments to return (default 5)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_unrated_experiments",
      description: "Get experiments that haven't been rated yet",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Number of unrated experiments to return (default 10)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_tasks_summary",
      description: "Get summary of tasks grouped by status (todo, in_progress, done)",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "search_experiments",
      description: "Search experiments by name, goal, or content",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          goal: { type: "string", description: "Filter by specific goal" },
          min_rating: { type: "number", description: "Minimum rating filter" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task in the Task Manager. ALWAYS ask for user confirmation before calling this.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Task description" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
          status: { type: "string", enum: ["todo", "in_progress", "done"], description: "Task status (default: todo)" },
          experiment_id: { type: "string", description: "Optional: Link task to an experiment ID" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "trigger_experiment",
      description: "Prepare parameters for triggering an n8n workflow to create a new experiment. Returns the parameters that would be sent.",
      parameters: {
        type: "object",
        properties: {
          goal: { type: "string", description: "Experiment goal" },
          mission: { type: "string", description: "Experiment mission" },
          example: { type: "string", description: "Example content" },
          rules: { type: "string", description: "Rules for the experiment" },
          use_websearch: { type: "boolean", description: "Enable web search (default: false)" }
        },
        required: ["goal"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_task_status",
      description: "Update the status of an existing task. ALWAYS ask for user confirmation before calling this.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string", description: "The task ID to update" },
          new_status: { type: "string", enum: ["todo", "in_progress", "done"], description: "New status" }
        },
        required: ["task_id", "new_status"]
      }
    }
  }
];

async function executeTool(supabase: any, toolName: string, args: any, userId: string | null): Promise<any> {
  console.log(`Executing tool: ${toolName}`, args);

  switch (toolName) {
    case "get_experiments_summary": {
      const { data: experiments, error } = await supabase
        .from("experiments")
        .select("rating");
      
      if (error) throw error;
      
      const total = experiments.length;
      const rated = experiments.filter((e: any) => e.rating !== null);
      const avgRating = rated.length > 0 
        ? (rated.reduce((sum: number, e: any) => sum + e.rating, 0) / rated.length).toFixed(2)
        : 0;
      const successCount = rated.filter((e: any) => e.rating >= 4).length;
      const successRate = rated.length > 0 
        ? ((successCount / rated.length) * 100).toFixed(1)
        : 0;

      return {
        total,
        rated: rated.length,
        unrated: total - rated.length,
        averageRating: avgRating,
        successRate: `${successRate}%`,
        successCount
      };
    }

    case "get_top_performers": {
      const limit = args.limit || 5;
      const { data, error } = await supabase
        .from("experiments")
        .select("id, name, goal, rating, created_at")
        .not("rating", "is", null)
        .order("rating", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    }

    case "get_goal_performance": {
      const { data: experiments, error } = await supabase
        .from("experiments")
        .select("goal, rating")
        .not("rating", "is", null);
      
      if (error) throw error;

      const goalStats: Record<string, { total: number; sum: number }> = {};
      experiments.forEach((exp: any) => {
        if (!goalStats[exp.goal]) {
          goalStats[exp.goal] = { total: 0, sum: 0 };
        }
        goalStats[exp.goal].total++;
        goalStats[exp.goal].sum += exp.rating;
      });

      return Object.entries(goalStats)
        .map(([goal, stats]) => ({
          goal,
          experimentCount: stats.total,
          averageRating: (stats.sum / stats.total).toFixed(2)
        }))
        .sort((a, b) => parseFloat(b.averageRating) - parseFloat(a.averageRating));
    }

    case "get_recent_experiments": {
      const limit = args.limit || 5;
      const { data, error } = await supabase
        .from("experiments")
        .select("id, name, goal, rating, created_at")
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    }

    case "get_unrated_experiments": {
      const limit = args.limit || 10;
      const { data, error } = await supabase
        .from("experiments")
        .select("id, name, goal, created_at")
        .is("rating", null)
        .order("created_at", { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { count: data.length, experiments: data };
    }

    case "get_tasks_summary": {
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select("id, title, status, priority")
        .eq("user_id", userId);
      
      if (error) throw error;

      const summary = {
        todo: tasks.filter((t: any) => t.status === "todo"),
        in_progress: tasks.filter((t: any) => t.status === "in_progress"),
        done: tasks.filter((t: any) => t.status === "done")
      };

      return {
        todoCount: summary.todo.length,
        inProgressCount: summary.in_progress.length,
        doneCount: summary.done.length,
        totalPending: summary.todo.length + summary.in_progress.length,
        tasks: summary
      };
    }

    case "search_experiments": {
      let query = supabase
        .from("experiments")
        .select("id, name, goal, rating, output, created_at");

      if (args.query) {
        query = query.or(`name.ilike.%${args.query}%,goal.ilike.%${args.query}%,output.ilike.%${args.query}%`);
      }
      if (args.goal) {
        query = query.ilike("goal", `%${args.goal}%`);
      }
      if (args.min_rating) {
        query = query.gte("rating", args.min_rating);
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data;
    }

    case "create_task": {
      if (!userId) throw new Error("User must be authenticated to create tasks");

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: args.title,
          description: args.description || null,
          priority: args.priority || "medium",
          status: args.status || "todo",
          experiment_id: args.experiment_id || null,
          user_id: userId
        })
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, task: data };
    }

    case "trigger_experiment": {
      // Return the prepared parameters - actual triggering happens client-side
      return {
        prepared: true,
        parameters: {
          goal: args.goal,
          mission: args.mission || "",
          example: args.example || "",
          rules: args.rules || "",
          use_websearch: args.use_websearch || false
        },
        message: "Experiment parameters prepared. The user can trigger the n8n workflow with these settings."
      };
    }

    case "update_task_status": {
      const { data, error } = await supabase
        .from("tasks")
        .update({ 
          status: args.new_status,
          completed_at: args.new_status === "done" ? new Date().toISOString() : null
        })
        .eq("id", args.task_id)
        .eq("user_id", userId)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, task: data };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id || null;
    }

    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build context-aware system prompt
    let contextPrompt = systemPrompt;
    if (context) {
      contextPrompt += `\n\nCURRENT CONTEXT:
- Total Experiments: ${context.totalExperiments || 0}
- Average Rating: ${context.averageRating || "N/A"}
- Unrated Experiments: ${context.unratedCount || 0}
- Pending Tasks: ${context.pendingTaskCount || 0}
- Current View: ${context.currentView || "unknown"}`;
    }

    const apiMessages = [
      { role: "system", content: contextPrompt },
      ...messages
    ];

    console.log("Calling Lovable AI with tools...");

    // Initial call with tools
    let response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
        tools,
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    let data = await response.json();
    let assistantMessage = data.choices?.[0]?.message;

    // Handle tool calls in a loop
    const toolResults: any[] = [];
    let iterations = 0;
    const maxIterations = 5;

    while (assistantMessage?.tool_calls && iterations < maxIterations) {
      iterations++;
      console.log(`Processing ${assistantMessage.tool_calls.length} tool calls (iteration ${iterations})`);

      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

        try {
          const result = await executeTool(supabase, toolName, toolArgs, userId);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result)
          });
        } catch (error) {
          console.error(`Tool execution error for ${toolName}:`, error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" })
          });
        }
      }

      // Continue conversation with tool results
      const continueMessages = [
        ...apiMessages,
        assistantMessage,
        ...toolResults
      ];

      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: continueMessages,
          tools,
          tool_choice: "auto"
        }),
      });

      if (!response.ok) {
        throw new Error(`AI gateway error: ${response.status}`);
      }

      data = await response.json();
      assistantMessage = data.choices?.[0]?.message;
    }

    const finalContent = assistantMessage?.content || "I apologize, but I couldn't generate a response.";

    return new Response(
      JSON.stringify({ 
        content: finalContent,
        toolsUsed: toolResults.length > 0
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in platform-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
