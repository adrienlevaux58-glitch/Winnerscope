import { NextRequest, NextResponse } from "next/server";
const googleTrends = require("google-trends-api");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  try {
    const result = await googleTrends.interestOverTime({
      keyword: query,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      hl: "fr",
      geo: "FR",
    });

    const data = JSON.parse(result);
    const timelineData = data.default?.timelineData || [];
    
    const values = timelineData.map((d: any) => d.value[0]);
    const avg = values.length > 0 ? Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length) : 50;
    const recent = values.slice(-4);
    const recentAvg = recent.length > 0 ? Math.round(recent.reduce((a: number, b: number) => a + b, 0) / recent.length) : 50;
    
    const tendance = Math.min(10, Math.round(recentAvg / 10));
    const croissance = recentAvg > avg ? "hausse" : recentAvg < avg ? "baisse" : "stable";

    return NextResponse.json({
      query,
      tendance,
      croissance,
      scoreGoogle: recentAvg,
      historique: timelineData.slice(-12).map((d: any) => ({
        date: d.formattedTime,
        valeur: d.value[0],
      })),
    });
  } catch (error) {
    return NextResponse.json({
      query,
      tendance: 5,
      croissance: "stable",
      scoreGoogle: 50,
      historique: [],
    });
  }
}