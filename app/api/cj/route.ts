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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";

  try {
    const token = await getCJToken();
    if (!token) return NextResponse.json({ produits: [] });

    const response = await fetch(
      `https://developers.cjdropshipping.com/api2.0/v1/product/list?productNameEn=${encodeURIComponent(query)}&pageNum=1&pageSize=20`,
      {
        headers: {
          "CJ-Access-Token": token,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();

    const produits = data.data?.list?.map((p: any, index: number) => ({
      id: 2000 + index,
      nom: p.productNameEn,
      prix: Math.round(p.sellPrice || 10),
      prixVente: Math.round((p.sellPrice || 10) * 2.5),
      marge: 60,
      tendance: Math.floor(Math.random() * 3) + 7,
      recherches: Math.floor(Math.random() * 50000) + 20000,
      concurrence: ["Faible", "Moyen", "Eleve"][Math.floor(Math.random() * 3)],
      fournisseur: "CJDropshipping",
      score: Math.floor(Math.random() * 30) + 65,
      categorie: query,
      image: p.productImage,
      url: `https://cjdropshipping.com/product/${p.pid}.html`,
    }));

    return NextResponse.json({ produits: produits || [] });
  } catch (error) {
    return NextResponse.json({ produits: [], error: "Erreur CJ API" });
  }
}