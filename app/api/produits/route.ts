import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "dropshipping products";
  const categorie = searchParams.get("categorie") || "";

  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.RAPIDAPI_KEY!,
      "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
    },
  };

  try {
    const response = await fetch(
      `https://real-time-amazon-data.p.rapidapi.com/search?query=${encodeURIComponent(
        query + " " + categorie
      )}&limit=20&country=FR`,
      options
    );
    const data = await response.json();

    const produits = data.data?.products?.map((p: any, index: number) => ({
      id: index + 1000,
      nom: p.product_title,
      prix: Math.round(parseFloat(p.product_price?.replace("€", "").replace(",", ".") || "10")),
      prixVente: Math.round(parseFloat(p.product_price?.replace("€", "").replace(",", ".") || "10") * 2.5),
      marge: 60,
      tendance: Math.floor(Math.random() * 3) + 7,
      recherches: Math.floor(Math.random() * 50000) + 20000,
      concurrence: ["Faible", "Moyen", "Eleve"][Math.floor(Math.random() * 3)],
      fournisseur: "Amazon",
      score: Math.floor(Math.random() * 30) + 65,
      categorie: categorie || "Tous",
      image: p.product_photo,
      url: p.product_url,
      rating: p.product_star_rating,
      avis: p.product_num_ratings,
    }));

    return NextResponse.json({ produits: produits || [] });
  } catch (error) {
    return NextResponse.json({ produits: [], error: "Erreur API" });
  }
}