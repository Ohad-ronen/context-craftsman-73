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
    console.log("Received n8n webhook request");

    if (req.method !== 'POST') {
      console.log("Invalid method:", req.method);
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
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
      // Get request_id if provided (for tracking)
      const requestId = experiment.request_id || null;
      
      // Map n8n data to experiment fields
      const experimentData: Record<string, any> = {
        name: experiment.name || `n8n Import ${new Date().toISOString()}`,
        goal: experiment.goal || '',
        mission: experiment.mission || '',
        example: experiment.example || '',
        desired: experiment.desired || '',
        rules: experiment.rules || '',
        board_name: experiment.board_name || '',
        board_full_context: experiment.board_full_context || '',
        board_pulled_context: experiment.board_pulled_context || '',
        search_terms: experiment.search_terms || '',
        search_context: experiment.search_context || '',
        agentic_prompt: experiment.agentic_prompt || '',
        output: typeof experiment.output === 'object' 
          ? JSON.stringify(experiment.output) 
          : (experiment.output || ''),
        rating: experiment.rating || null,
        notes: experiment.notes || null,
        use_websearch: experiment.use_websearch === true || experiment.use_websearch === 'true' || false,
      };

      // Link to request if request_id provided
      if (requestId) {
        experimentData.request_id = requestId;
      }

      console.log("Inserting experiment:", experimentData.name, "with request_id:", requestId);

      const { data, error } = await supabase
        .from('experiments')
        .insert(experimentData)
        .select()
        .single();

      if (error) {
        console.error("Error inserting experiment:", error);
        errors.push({ name: experimentData.name, error: error.message });
        
        // Update tracking record to failed if request_id exists
        if (requestId) {
          await supabase
            .from('experiment_requests')
            .update({ 
              status: 'failed', 
              error_message: error.message,
              updated_at: new Date().toISOString()
            })
            .eq('id', requestId);
        }
      } else {
        console.log("Successfully inserted experiment:", data.id);
        results.push(data);
        
        // Update tracking record to completed if request_id exists
        if (requestId) {
          const { error: updateError } = await supabase
            .from('experiment_requests')
            .update({ 
              status: 'completed', 
              experiment_id: data.id,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', requestId);
          
          if (updateError) {
            console.error("Error updating tracking record:", updateError);
          } else {
            console.log("Updated tracking record:", requestId);
          }
        }
      }
    }

    const response = {
      success: true,
      message: `Processed ${experiments.length} experiment(s)`,
      inserted: results.length,
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
