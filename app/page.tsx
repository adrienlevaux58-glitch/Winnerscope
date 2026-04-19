"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Product = {
  id: number;
  nom: string;
  prix: number;
  prixVente: number;
  marge: number;
  tendance: number;
  recherches: number;
  concurrence: string;
  fournisseur: string;
  score: number;
  categorie: string;
};

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const categories = ["Mode", "Electronique", "Beaute", "Maison", "Sport"];

  const categoryEmojis: Record<string, string> = {
    Mode: "👗", Electronique: "⚡", Beaute: "💄", Maison: "🏠", Sport: "🏋️",
  };

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase.from("produits").select("*");
      if (!error && data) setAllProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const searchAmazon = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/produits?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.produits && data.produits.length > 0) {
        setAllProducts(data.produits);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const filteredProducts = selectedCategory
    ? allProducts.filter((p) =>
        p.categorie === selectedCategory &&
        p.nom.toLowerCase().includes(search.toLowerCase()))
    : search.length > 1
    ? allProducts.filter((p) =>
        p.nom.toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span className="text-xl font-bold">Winner<span className="text-orange-500">Scope</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#produits" className="hover:text-white transition-colors">Produits</a>
          <a href="#tarifs" className="hover:text-white transition-colors">Tarifs</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-gray-400 hover:text-white transition-colors">Connexion</button>
          <button className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-semibold">Essai gratuit</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-8 text-center">
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-96 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-1.5 text-sm text-orange-400 mb-8">
            <span className="w-2 h-2 bg-orange-500 rounded-full" />
            Analyse IA des produits gagnants
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            Trouve les produits<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">qui cartonnent</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            WinnerScope analyse les meilleurs produits dropshipping et te donne un score de potentiel basé sur la marge, la concurrence et les tendances.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={() => document.getElementById("produits")?.scrollIntoView({ behavior: "smooth" })} className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-xl text-lg font-semibold shadow-xl shadow-orange-500/20 w-full sm:w-auto">
              Explorer les produits →
            </button>
            <button className="border border-gray-700 hover:border-gray-500 px-8 py-4 rounded-xl text-lg text-gray-300 w-full sm:w-auto">
              Voir une démo
            </button>
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: `${allProducts.length}+`, label: "Produits analysés" },
              { value: "5", label: "Catégories" },
              { value: "83%", label: "Marge moyenne" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold mb-1">{s.value}</p>
                <p className="text-gray-500 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>{/* FEATURES */}
      <section id="features" className="px-8 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tout ce dont tu as besoin</h2>
            <p className="text-gray-400 text-lg">pour trouver ton prochain produit gagnant</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🎯", title: "Winning Score", desc: "Chaque produit reçoit un score de 0 à 100 basé sur la marge, la concurrence et les tendances." },
              { icon: "📊", title: "Analyse marché", desc: "Volume de recherches mensuel, niveau de concurrence et tendance de croissance." },
              { icon: "🏭", title: "Fournisseurs", desc: "Accès aux meilleurs fournisseurs AliExpress et CJDropshipping avec les prix." },
              { icon: "🔍", title: "Recherche rapide", desc: "Trouve n'importe quel produit en quelques secondes." },
              { icon: "⚡", title: "Données récentes", desc: "Nos données sont mises à jour régulièrement pour les tendances les plus récentes." },
              { icon: "💡", title: "Analyse SWOT", desc: "Points forts et faibles pour t'aider à prendre la bonne décision." },
            ].map((f) => (
              <div key={f.title} className="bg-white/5 border border-white/5 hover:border-orange-500/20 rounded-2xl p-6 transition-all">
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUITS */}
      <section id="produits" className="px-8 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Explorer les produits</h2>
            <p className="text-gray-400 text-lg mb-8">Sélectionne une catégorie ou recherche un produit</p>
            <div className="relative max-w-2xl mx-auto mb-8">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => { 
  setSearch(e.target.value); 
  setSelectedCategory(null);
  if (e.target.value.length > 2) {
    searchAmazon(e.target.value);
  }
}}
                placeholder="Rechercher n'importe quel produit..."
                className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-2xl pl-12 pr-6 py-4 text-white placeholder-gray-500 focus:outline-none text-lg"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((cat) => (
                <button key={cat} onClick={() => { setSelectedCategory(cat === selectedCategory ? null : cat); setSearch(""); }}
                  className={`flex items-center gap-2 rounded-2xl px-6 py-3 font-medium transition-all border ${selectedCategory === cat ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-900 border-gray-800 hover:border-orange-500/50"}`}>
                  <span>{categoryEmojis[cat]}</span><span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-4">⏳</p>
              <p>Chargement des produits...</p>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <div key={p.id} onClick={() => router.push(`/produit/${p.id}`)}
                  className="bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-semibold leading-tight">{p.nom}</h4>
                    <span className={`text-xl font-bold ml-2 shrink-0 ${getScoreColor(p.score)}`}>{p.score}</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex justify-between"><span>Prix fournisseur</span><span className="text-white font-medium">{p.prix}€</span></div>
                    <div className="flex justify-between"><span>Prix de vente</span><span className="text-white font-medium">{p.prixVente}€</span></div>
                    <div className="flex justify-between"><span>Marge</span><span className="text-green-400 font-medium">{p.marge}%</span></div>
                    <div className="flex justify-between"><span>Recherches/mois</span><span className="text-white font-medium">{p.recherches.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>Concurrence</span><span className="text-white font-medium">{p.concurrence}</span></div>
                  </div>
                  <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                    <span className="text-xs text-blue-400 font-medium">{p.fournisseur}</span>
                    <span className="text-xs text-gray-500">Voir détails →</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && search.length > 1 && filteredProducts.length === 0 && (
            <div className="text-center text-gray-500 py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-xl">Aucun produit trouvé pour "{search}"</p>
            </div>
          )}
        </div>
      </section>{/* TARIFS */}
      <section id="tarifs" className="px-8 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Tarifs simples</h2>
          <p className="text-gray-400 text-lg mb-12">Commence gratuitement, upgrade quand tu es prêt</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-left">
              <h3 className="text-xl font-bold mb-2">Gratuit</h3>
              <p className="text-4xl font-bold mb-6">0€<span className="text-gray-400 text-lg font-normal">/mois</span></p>
              <ul className="space-y-3 text-gray-400 text-sm mb-8">
                <li>✅ 3 produits par catégorie</li>
                <li>✅ Winning Score basique</li>
                <li>✅ Recherche par mot-clé</li>
                <li>❌ Données avancées</li>
                <li>❌ Accès fournisseurs</li>
              </ul>
              <button className="w-full border border-gray-700 hover:border-orange-500 py-3 rounded-xl transition-colors">Commencer</button>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-8 text-left relative">
              <div className="absolute top-4 right-4 bg-orange-500 text-xs font-bold px-3 py-1 rounded-full">POPULAIRE</div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-6">29€<span className="text-gray-400 text-lg font-normal">/mois</span></p>
              <ul className="space-y-3 text-gray-400 text-sm mb-8">
                <li>✅ Produits illimités</li>
                <li>✅ Winning Score avancé</li>
                <li>✅ Données marché complètes</li>
                <li>✅ Accès fournisseurs directs</li>
                <li>✅ Alertes nouveaux produits</li>
              </ul>
              <button className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-xl transition-colors font-semibold">Commencer l'essai gratuit</button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-8 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 WinnerScope — Trouve les produits gagnants pour ton business dropshipping</p>
      </footer>

    </main>
  );
}