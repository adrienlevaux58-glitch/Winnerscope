import { NextRequest, NextResponse } from "next/server";

async function getCJToken() {
  const response = await fetch(
    "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: process.env.CJ_API_KEY }),
    }
  );
  const data = await response.json();
  return data.data?.accessToken;
}

const googleTrends = require("google-trends-api");

async function getTrends(query: string) {
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
    return { tendance, croissance, scoreGoogle: recentAvg };
  } catch {
    return { tendance: 5, scoreGoogle: 50, croissance: "stable" };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  try {
    const token = await getCJToken();
    if (!token) return NextResponse.json({ produits: [] });

    const [cjResponse, trendsData] = await Promise.all([
      fetch(
        `https://developers.cjdropshipping.com/api2.0/v1/product/list?productNameEn=${encodeURIComponent(query)}&pageNum=1&pageSize=20`,
        {
          headers: {
            "CJ-Access-Token": token,
            "Content-Type": "application/json",
          },
        }
      ),
      getTrends(query),
    ]);

    const data = await cjResponse.json();

    const produits = data.data?.list?.map((p: any, index: number) => {
      const prixFournisseur = p.sellPrice ? Math.round(p.sellPrice) : null;
const prixVente = prixFournisseur ? Math.round(prixFournisseur * 2.5) : null;
const marge = prixFournisseur ? Math.round(((prixVente! - prixFournisseur) / prixVente!) * 100) : null;
      
      const scoreGoogle = trendsData.scoreGoogle || 50;
      const scoreMarge = marge ? Math.min(40, Math.round((marge / 100) * 40)) : 20;
      const scoreTendance = Math.min(30, Math.round((scoreGoogle / 100) * 30));
      const scoreConcurrence = Math.floor(Math.random() * 20) + 5;
      const winningScore = Math.min(100, scoreMarge + scoreTendance + scoreConcurrence);

      return {
        id: 2000 + index,
        nom: p.productNameEn,
        prix: prixFournisseur,
        prixVente,
        marge,
        tendance: trendsData.tendance || 5,
        croissance: trendsData.croissance || "stable",
        scoreGoogle,
        recherches: Math.floor(Math.random() * 50000) + 20000,
        concurrence: ["Faible", "Moyen", "Eleve"][Math.floor(Math.random() * 3)],
        fournisseur: "CJDropshipping",
        score: winningScore,
        categorie: query,
        image: p.productImage,
        url: `https://www.cjdropshipping.com/product-detail.html?id=${p.pid}`,
      };
    });
const produitsValides = produits?.filter((p: any) => p.prix !== null);
    return NextResponse.json({ produits: produitsValides || [], trends: trendsData });
  } catch (error) {
    return NextResponse.json({ produits: [], error: "Erreur CJ API" });
  }
}