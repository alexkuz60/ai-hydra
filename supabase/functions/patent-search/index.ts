import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PatentSearchRequest {
  query: string;
  jurisdiction?: string; // RU, US, EP, WO
  date_from?: string;    // YYYY
  limit?: number;
}

interface PatentResult {
  title: string;
  patent_number: string;
  abstract: string;
  applicant: string;
  date: string;
  url: string;
}

async function getUserFirecrawlKey(authHeader: string | null): Promise<string | null> {
  if (!authHeader) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data } = await supabase.rpc('get_my_api_keys');
    if (data && data.length > 0 && data[0].firecrawl_api_key) {
      return data[0].firecrawl_api_key;
    }
  } catch (e) {
    console.error('Error fetching user Firecrawl key:', e);
  }
  return null;
}

function buildGooglePatentsUrl(query: string, jurisdiction?: string, dateFrom?: string): string {
  const params = new URLSearchParams();
  params.set('q', query);
  if (jurisdiction && jurisdiction !== 'WO') {
    params.set('country', jurisdiction);
  }
  if (dateFrom) {
    params.set('after', `priority:${dateFrom}0101`);
  }
  return `https://patents.google.com/?${params.toString()}`;
}

function parsePatentResults(markdown: string, limit: number): PatentResult[] {
  const results: PatentResult[] = [];
  
  // Parse structured data from Google Patents markdown
  // Patent entries typically contain: title, patent number, abstract, applicant, date
  const lines = markdown.split('\n');
  let currentResult: Partial<PatentResult> = {};
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect patent number patterns (US1234567, WO2024/123456, RU2789012, EP3456789)
    const patentNumMatch = trimmed.match(/\b(US|WO|RU|EP|CN|JP|KR|DE|FR|GB)\s*[\d,/]+[A-Z]?\d*\b/i);
    if (patentNumMatch) {
      // Save previous result if valid
      if (currentResult.patent_number && currentResult.title) {
        results.push({
          title: currentResult.title || 'Untitled',
          patent_number: currentResult.patent_number,
          abstract: currentResult.abstract || '',
          applicant: currentResult.applicant || 'Unknown',
          date: currentResult.date || '',
          url: `https://patents.google.com/patent/${currentResult.patent_number.replace(/[\s,/]/g, '')}`,
        });
        if (results.length >= limit) break;
      }
      currentResult = { patent_number: patentNumMatch[0].trim() };
    }
    
    // Try to extract title (usually in bold or heading)
    if (trimmed.startsWith('#') || trimmed.startsWith('**')) {
      const title = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      if (title && !currentResult.title) {
        currentResult.title = title;
      }
    }
    
    // Extract date patterns (YYYY-MM-DD or similar)
    const dateMatch = trimmed.match(/\b(19|20)\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/);
    if (dateMatch && !currentResult.date) {
      currentResult.date = dateMatch[0];
    }
    
    // Accumulate text as abstract if we have a patent number
    if (currentResult.patent_number && !currentResult.abstract && trimmed.length > 50 && !trimmed.startsWith('#') && !trimmed.startsWith('|')) {
      currentResult.abstract = trimmed.substring(0, 300);
    }
  }
  
  // Push last result
  if (currentResult.patent_number && currentResult.title && results.length < limit) {
    results.push({
      title: currentResult.title || 'Untitled',
      patent_number: currentResult.patent_number,
      abstract: currentResult.abstract || '',
      applicant: currentResult.applicant || 'Unknown',
      date: currentResult.date || '',
      url: `https://patents.google.com/patent/${currentResult.patent_number.replace(/[\s,/]/g, '')}`,
    });
  }
  
  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: PatentSearchRequest = await req.json();
    const { query, jurisdiction, date_from, limit = 10 } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Firecrawl key (personal > system)
    const authHeader = req.headers.get('Authorization');
    const personalKey = await getUserFirecrawlKey(authHeader);
    const firecrawlKey = personalKey || Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Firecrawl не настроен. Добавьте ключ в профиле для патентного поиска.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const patentUrl = buildGooglePatentsUrl(query, jurisdiction, date_from);
    console.log(`[patent-search] Scraping: ${patentUrl}`);

    // Use Firecrawl to scrape Google Patents results
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: patentUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000, // Google Patents loads dynamically
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('[patent-search] Firecrawl error:', scrapeData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: scrapeData.error || `Firecrawl scrape failed: ${scrapeResponse.status}`,
          search_url: patentUrl,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const patents = parsePatentResults(markdown, limit);

    console.log(`[patent-search] Found ${patents.length} patents for query: "${query}"`);

    return new Response(
      JSON.stringify({
        success: true,
        query,
        jurisdiction: jurisdiction || 'WO',
        search_url: patentUrl,
        results_count: patents.length,
        results: patents,
        raw_content_length: markdown.length,
        // Include raw markdown for AI to analyze if structured parsing misses things
        raw_excerpt: markdown.substring(0, 2000),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[patent-search] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
