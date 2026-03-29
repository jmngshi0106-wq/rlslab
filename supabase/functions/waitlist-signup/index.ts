import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405)
  }

  try {
    const { email, source } = await req.json()

    if (!email || typeof email !== "string") {
      return json({ error: "Email is required" }, 400)
    }

    const normalizedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(normalizedEmail)) {
      return json({ error: "Invalid email address" }, 400)
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing Supabase environment variables" }, 500)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await supabase.from("waitlist_signups").insert({
      email: normalizedEmail,
      source: typeof source === "string" ? source : "unknown",
    })

    if (error) {
      if (error.code === "23505") {
        return json({ ok: true, message: "Already on the list" }, 200)
      }

      return json({ error: error.message }, 500)
    }

    return json({ ok: true, message: "Joined waitlist" }, 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error"
    return json({ error: message }, 500)
  }
})
