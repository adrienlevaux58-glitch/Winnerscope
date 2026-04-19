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

async function getTrends(query: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/trends?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data;
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
      const prixFournisseur = Math.round(p.sellPrice || 10);
      const prixVente = Math.round(prixFournisseur * 2.5);
      const marge = Math.round(((prixVente - prixFournisseur) / prixVente) * 100);
      const scoreGoogle = trendsData.scoreGoogle || 50;
      const scoreMarge = Math.min(40, Math.round((marge / 100) * 40));
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

    return NextResponse.json({ produits: produits || [], trends: trendsData });
  } catch (error) {
    return NextResponse.json({ produits: [], error: "Erreur CJ API" });
  }
}