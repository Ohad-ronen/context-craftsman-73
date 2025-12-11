import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { sheetUrl } = await req.json();
    
    if (!sheetUrl) {
      throw new Error('Sheet URL is required');
    }

    console.log('Fetching Google Sheet:', sheetUrl);

    // Extract sheet ID from various Google Sheets URL formats
    let sheetId: string | null = null;
    
    // Format: https://docs.google.com/spreadsheets/d/SHEET_ID/...
    const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      sheetId = match[1];
    }

    if (!sheetId) {
      throw new Error('Could not extract sheet ID from URL. Please provide a valid Google Sheets URL.');
    }

    console.log('Extracted sheet ID:', sheetId);

    // Fetch the sheet as CSV using the export URL
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    const response = await fetch(exportUrl);
    
    if (!response.ok) {
      console.error('Failed to fetch sheet:', response.status, response.statusText);
      throw new Error('Failed to fetch sheet. Make sure the sheet is publicly accessible (File > Share > Anyone with the link).');
    }

    const csvText = await response.text();
    console.log('Received CSV data, length:', csvText.length);

    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('Sheet appears to be empty');
    }

    // Parse headers (first row)
    const headers = parseCSVLine(lines[0]);
    console.log('Headers:', headers);

    // Parse data rows
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    console.log('Parsed rows:', rows.length);

    return new Response(JSON.stringify({ 
      headers, 
      rows,
      totalRows: rows.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error in fetch-google-sheet function:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}
