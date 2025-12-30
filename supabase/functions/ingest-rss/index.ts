import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Keywords for scoring
const BREAKTHROUGH_KEYWORDS = [
  "benchmark", "sota", "state-of-the-art", "release", "paper", "breakthrough",
  "eu ai act", "regulation", "gpt-5", "gemini", "claude", "llama", "mistral",
  "openai", "anthropic", "google", "meta", "microsoft", "nvidia",
  "arxiv", "neurips", "icml", "iclr", "research", "model", "training",
  "fine-tuning", "rlhf", "multimodal", "vision", "language model"
];

interface RSSItem {
  title: string;
  link: string;
  guid?: string;
  pubDate?: string;
  description?: string;
}

interface Source {
  id: string;
  name: string;
  rss_url: string;
  category: string;
  weight: number;
}

// Parse RSS XML
function parseRSS(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Simple regex-based XML parsing for RSS items
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const title = extractTag(itemContent, "title");
    const link = extractTag(itemContent, "link");
    const guid = extractTag(itemContent, "guid") || extractTag(itemContent, "id");
    const pubDate = extractTag(itemContent, "pubDate") || extractTag(itemContent, "published");
    const description = extractTag(itemContent, "description") || extractTag(itemContent, "content:encoded") || extractTag(itemContent, "summary");
    
    if (title && link) {
      items.push({
        title: decodeEntities(title),
        link: decodeEntities(link),
        guid: guid ? decodeEntities(guid) : undefined,
        pubDate: pubDate || undefined,
        description: description ? decodeEntities(stripHtml(description)).slice(0, 500) : undefined,
      });
    }
  }
  
  // Also try Atom format
  const entryRegex = /<entry[^>]*>([\s\S]*?)<\/entry>/gi;
  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entryContent = match[1];
    
    const title = extractTag(entryContent, "title");
    const linkMatch = entryContent.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/);
    const link = linkMatch ? linkMatch[1] : extractTag(entryContent, "link");
    const guid = extractTag(entryContent, "id");
    const pubDate = extractTag(entryContent, "published") || extractTag(entryContent, "updated");
    const description = extractTag(entryContent, "summary") || extractTag(entryContent, "content");
    
    if (title && link) {
      items.push({
        title: decodeEntities(title),
        link: decodeEntities(link),
        guid: guid ? decodeEntities(guid) : undefined,
        pubDate: pubDate || undefined,
        description: description ? decodeEntities(stripHtml(description)).slice(0, 500) : undefined,
      });
    }
  }
  
  return items;
}

function extractTag(content: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>|<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = content.match(regex);
  return match ? (match[1] || match[2] || "").trim() : null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Calculate breakthrough score
function calculateScore(item: RSSItem, sourceWeight: number): number {
  let score = sourceWeight * 5; // Base score from source weight
  
  const textToCheck = `${item.title} ${item.description || ""}`.toLowerCase();
  
  for (const keyword of BREAKTHROUGH_KEYWORDS) {
    if (textToCheck.includes(keyword.toLowerCase())) {
      score += 10;
    }
  }
  
  // Bonus for recent items
  if (item.pubDate) {
    const pubDate = new Date(item.pubDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      score += 20;
    } else if (hoursDiff < 48) {
      score += 10;
    }
  }
  
  return Math.min(score, 100); // Cap at 100
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting RSS ingestion...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get active sources
    const { data: sources, error: sourcesError } = await supabase
      .from("sources")
      .select("*")
      .eq("is_active", true);
    
    if (sourcesError) {
      console.error("Error fetching sources:", sourcesError);
      throw sourcesError;
    }
    
    console.log(`Found ${sources?.length || 0} active sources`);
    
    let totalInserted = 0;
    let totalSkipped = 0;
    
    for (const source of (sources as Source[]) || []) {
      try {
        console.log(`Fetching RSS from ${source.name}: ${source.rss_url}`);
        
        const response = await fetch(source.rss_url, {
          headers: {
            "User-Agent": "AI-Uutisvahti/1.0",
          },
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch ${source.name}: ${response.status}`);
          continue;
        }
        
        const xmlText = await response.text();
        const items = parseRSS(xmlText);
        
        console.log(`Parsed ${items.length} items from ${source.name}`);
        
        for (const item of items.slice(0, 20)) { // Limit to 20 items per source
          // Check if article already exists
          const { data: existing } = await supabase
            .from("articles")
            .select("id")
            .eq("url", item.link)
            .single();
          
          if (existing) {
            totalSkipped++;
            continue;
          }
          
          const score = calculateScore(item, source.weight);
          const isSignificant = score >= 50;
          
          const { error: insertError } = await supabase.from("articles").insert({
            source_id: source.id,
            title: item.title,
            url: item.link,
            guid: item.guid,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            raw_excerpt: item.description,
            score,
            is_significant: isSignificant,
          });
          
          if (insertError) {
            console.error(`Error inserting article: ${insertError.message}`);
          } else {
            totalInserted++;
            console.log(`Inserted: ${item.title.slice(0, 50)}... (score: ${score})`);
          }
        }
      } catch (sourceError) {
        console.error(`Error processing source ${source.name}:`, sourceError);
      }
    }
    
    console.log(`Ingestion complete. Inserted: ${totalInserted}, Skipped: ${totalSkipped}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        inserted: totalInserted,
        skipped: totalSkipped,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Ingestion error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
