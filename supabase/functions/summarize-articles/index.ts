import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

interface Article {
  id: string;
  title: string;
  raw_excerpt: string | null;
  url: string;
}

async function generateSummary(article: Article): Promise<{
  summary_fi: string;
  why_it_matters: string;
  tags: string[];
  title_fi: string;
} | null> {
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY not configured");
    return null;
  }

  const prompt = `Olet AI-uutisasiantuntija. Analysoi seuraava artikkeli ja tuota:

1. **Otsikko suomeksi**: Käännä artikkelin otsikko sujuvasti suomeksi. Säilytä alkuperäinen merkitys, mutta tee siitä luonnollinen suomenkielinen otsikko.
2. **Tiivistelmä** (2-3 lausetta suomeksi): Kerro artikkelin pääkohdat selkeästi.
3. **Miksi tämä on tärkeää** (1 lause suomeksi): Selitä miksi tämä uutinen on merkittävä AI-alalle tai yleisölle.
4. **Tagit** (5 kappaletta englanniksi): Relevantit avainsanat artikkelista.

Artikkelin otsikko: ${article.title}
${article.raw_excerpt ? `Artikkelin ote: ${article.raw_excerpt}` : ""}
Artikkelin URL: ${article.url}

Vastaa VAIN JSON-muodossa:
{
  "title_fi": "...",
  "summary_fi": "...",
  "why_it_matters": "...",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  try {
    // Use OpenAI-compatible endpoint which may have different rate limits
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.0-flash",
          messages: [
            {
              role: "system",
              content: "Olet asiantunteva AI-uutisanalyytikko. Vastaat aina suomeksi ja JSON-muodossa.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API error (${response.status}):`, errorText);
      if (response.status === 429) {
        console.error("Rate limited by Gemini API, will retry later");
      }
      return null;
    }

    const data = await response.json();
    // OpenAI-compatible format
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in Gemini response:", JSON.stringify(data));
      return null;
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Could not find JSON in response:", content);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      summary_fi: parsed.summary_fi || "",
      why_it_matters: parsed.why_it_matters || "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      title_fi: parsed.title_fi || "",
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting AI summarization with Gemini API...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get articles without summaries OR without Finnish titles
    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("id, title, raw_excerpt, url")
      .or("summary_fi.is.null,title_fi.is.null")
      .order("created_at", { ascending: false })
      .limit(5); // Process 5 at a time to respect Gemini free tier rate limits
    
    if (articlesError) {
      console.error("Error fetching articles:", articlesError);
      throw articlesError;
    }
    
    console.log(`Found ${articles?.length || 0} articles to summarize`);
    
    let summarized = 0;
    let failed = 0;
    
    for (const article of (articles as Article[]) || []) {
      console.log(`Summarizing: ${article.title.slice(0, 50)}...`);
      
      const result = await generateSummary(article);
      
      if (result) {
        const { error: updateError } = await supabase
          .from("articles")
          .update({
            summary_fi: result.summary_fi,
            why_it_matters: result.why_it_matters,
            tags: result.tags,
            title_fi: result.title_fi,
          })
          .eq("id", article.id);
        
        if (updateError) {
          console.error(`Error updating article ${article.id}:`, updateError);
          failed++;
        } else {
          summarized++;
          console.log(`Summarized successfully: ${article.title.slice(0, 50)}...`);
        }
      } else {
        failed++;
      }
      
      // Longer delay to avoid Gemini free tier rate limits (15 req/min)
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    
    console.log(`Summarization complete. Summarized: ${summarized}, Failed: ${failed}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        summarized,
        failed,
        remaining: (articles?.length || 0) - summarized,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Summarization error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
