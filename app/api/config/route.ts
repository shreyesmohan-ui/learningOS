export function GET() {
  return Response.json({
    supabaseUrl: process.env.SUPABASE_URL || null,
    supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || null,
    liveTutor: !!process.env.GROQ_API_KEY && process.env.ENABLE_LIVE_TUTOR === "true",
    datasetId: "northstar-v1",
  }, { headers: { "Cache-Control": "no-store" } });
}
