"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { products } from "../../data";

type Category = keyof typeof products;

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const categories = Object.keys(products) as Category[];

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const allProducts = Object.values(products).flat();

  const filteredProducts = selectedCategory
    ? products[selectedCategory].filter((p) =>
        p.nom.toLowerCase().includes(search.toLowerCase())
      )
    : search.length > 1
    ? allProducts.filter((p) =>
        p.nom.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-orange-500">WinnerScope 🏆</h1>
        <p className="text-gray-400 text-sm">Trouve les produits gagnants</p>
      </header>

      {/* Hero */}
      <section className="text-center py-12 px-6">
        <h2 className="text-4xl font-bold mb-4">
          Trouve les produits <span className="text-orange-500">gagnants</span>
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Compare les meilleurs produits dropshipping par catégorie
        </p>

        {/* Barre de recherche */}
        <div className="max-w-xl mx-auto mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un produit..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-5 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 text-lg"
          />
        </div>

        {/* Catégories */}
        <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat === selectedCategory ? null : cat);
                setSearch("");
              }}
              className={`rounded-xl px-6 py-3 text-lg font-medium transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-orange-500 text-white"
                  : "bg-gray-800 hover:bg-orange-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Résultats */}
      {filteredProducts.length > 0 && (
        <section className="px-6 pb-12 max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-6 text-orange-400">
            {selectedCategory
              ? `${selectedCategory} — Produits gagnants`
              : `Résultats pour "${search}"`}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/produit/${p.id}`)}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 cursor-pointer hover:border-orange-500 transition-colors"
              >
                <h4 className="text-lg font-semibold mb-4">{p.nom}</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Prix fournisseur</span>
                    <span className="font-bold">{p.prix}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prix de vente</span>
                    <span className="font-bold">{p.prixVente}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Marge</span>
                    <span className="font-bold text-green-400">{p.marge}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recherches/mois</span>
                    <span className="font-bold">{p.recherches.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Concurrence</span>
                    <span className="font-bold">{p.concurrence}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fournisseur</span>
                    <span className="font-bold text-blue-400">{p.fournisseur}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
                  <span className="text-gray-400">Winning Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(p.score)}`}>
                    {p.score}/100
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Message si aucun résultat */}
      {search.length > 1 && filteredProducts.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          Aucun produit trouvé pour <span className="text-white">"{search}"</span>
        </div>
      )}
    </main>
  );
}