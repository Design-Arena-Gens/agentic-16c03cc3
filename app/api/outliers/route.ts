import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase";
import { getConfig } from "@/lib/config";

export async function GET() {
  try {
    const { SUPABASE_URL } = getConfig();
    const client = supabaseClient();
    const { data, error } = await client
      .from("shein_outliers")
      .select("payload")
      .order("collected_at", { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      source: SUPABASE_URL,
      items: (data || []).map((row) => row.payload)
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}
