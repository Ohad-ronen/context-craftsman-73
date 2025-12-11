import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received n8n webhook update request");

    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') {
      console.log("Invalid method:", req.method);
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST, PUT, or PATCH" }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    console.log("Received payload:", JSON.stringify(body, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle single experiment or array of experiments
    const experiments = Array.isArray(body) ? body : [body];
    const results = [];
    const errors = [];

    for (const experiment of experiments) {
      // Determine match field - prefer id, fallback to name
      const matchById = experiment.id;
      const matchByName = experiment.name;

      if (!matchById && !matchByName) {
        console.error("No id or name provided for matching");
        errors.push({ error: "Either 'id' or 'name' is required to match an experiment" });
        continue;
      }

      // Build update data (only include fields that are provided)
      const updateData: Record<string, unknown> = {};
      
      if (experiment.goal !== undefined) updateData.goal = experiment.goal;
      if (experiment.mission !== undefined) updateData.mission = experiment.mission;
      if (experiment.example !== undefined) updateData.example = experiment.example;
      if (experiment.desired !== undefined) updateData.desired = experiment.desired;
      if (experiment.rules !== undefined) updateData.rules = experiment.rules;
      if (experiment.board_name !== undefined) updateData.board_name = experiment.board_name;
      if (experiment.board_full_context !== undefined) updateData.board_full_context = experiment.board_full_context;
      if (experiment.board_pulled_context !== undefined) updateData.board_pulled_context = experiment.board_pulled_context;
      if (experiment.search_terms !== undefined) updateData.search_terms = experiment.search_terms;
      if (experiment.search_context !== undefined) updateData.search_context = experiment.search_context;
      if (experiment.agentic_prompt !== undefined) updateData.agentic_prompt = experiment.agentic_prompt;
      if (experiment.output !== undefined) {
        updateData.output = typeof experiment.output === 'object' 
          ? JSON.stringify(experiment.output) 
          : experiment.output;
      }
      if (experiment.rating !== undefined) updateData.rating = experiment.rating;
      if (experiment.notes !== undefined) updateData.notes = experiment.notes;
      if (experiment.name !== undefined && matchById) updateData.name = experiment.name; // Allow name update when matching by id

      if (Object.keys(updateData).length === 0) {
        console.log("No fields to update");
        errors.push({ 
          id: matchById, 
          name: matchByName, 
          error: "No fields provided to update" 
        });
        continue;
      }

      console.log("Updating experiment:", matchById || matchByName, "with data:", updateData);

      // Build and execute query
      let query = supabase.from('experiments').update(updateData);
      
      if (matchById) {
        query = query.eq('id', matchById);
      } else {
        query = query.eq('name', matchByName);
      }

      const { data, error } = await query.select().maybeSingle();

      if (error) {
        console.error("Error updating experiment:", error);
        errors.push({ 
          id: matchById, 
          name: matchByName, 
          error: error.message 
        });
      } else if (!data) {
        console.log("No experiment found matching:", matchById || matchByName);
        errors.push({ 
          id: matchById, 
          name: matchByName, 
          error: "No experiment found with this id or name" 
        });
      } else {
        console.log("Successfully updated experiment:", data.id);
        results.push(data);
      }
    }

    const response = {
      success: true,
      message: `Processed ${experiments.length} experiment(s)`,
      updated: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Response:", JSON.stringify(response, null, 2));

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    console.error("Error processing webhook:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
