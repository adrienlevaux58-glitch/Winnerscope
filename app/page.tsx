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
  url?: string;
  image?: string;
  rating?: string;
  avis?: number;
};

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("amazon");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const categories = ["Mode", "Electronique", "Beaute", "Maison", "Sport"];
  const categoryEmojis: Record<string, string> = {
    Mode: "👗", Electronique: "⚡", Beaute: "💄", Maison: "🏠", Sport: "🏋️",
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const searchProducts = async (query: string, currentSource?: string) => {
  setLoading(true);
  const src = currentSource || source;
  try {
    const endpoint = src === "amazon" 
      ? `/api/produits?query=${encodeURIComponent(query)}` 
      : `/api/cj?query=${encodeURIComponent(query)}`;
    const res = await fetch(endpoint);
    const data = await res.json();
    if (data.produits && data.produits.length > 0) setAllProducts(data.produits);
    else setAllProducts([]);
  } catch (e) { console.error(e); }
  setLoading(false);
};

  const searchByCategory = async (cat: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/produits?query=${encodeURIComponent(cat)}&categorie=${encodeURIComponent(cat)}`);
      const data = await res.json();
      if (data.produits && data.produits.length > 0) setAllProducts(data.produits);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredProducts = selectedCategory
    ? allProducts.filter((p) => p.categorie === selectedCategory && p.nom.toLowerCase().includes(search.toLowerCase()))
    : search.length > 1
    ? allProducts.filter((p) => p.nom.toLowerCase().includes(search.toLowerCase()))
    : allProducts;

  const produitsAffiches = !user 
  ? filteredProducts.slice(0, 3) 
  : filteredProducts.slice(0, 5);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
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
          {user ? (
            <>
              <span className="text-sm text-gray-400 hidden md:block">{user.email}</span>
              <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">Déconnexion</button>
              <button className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-semibold">Passer Pro</button>
            </>
          ) : (
            <>
              <button onClick={() => router.push("/auth")} className="text-sm text-gray-400 hover:text-white transition-colors">Connexion</button>
              <button onClick={() => router.push("/auth")} className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-semibold">S'inscrire</button>
            </>
          )}
        </div>
      </nav>
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
            WinnerScope analyse les meilleurs produits pour le dropshipping, l'achat-revente et l'e-commerce. Compare les marges, la concurrence et les tendances pour trouver ton prochain produit gagnant.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={() => document.getElementById("produits")?.scrollIntoView({ behavior: "smooth" })} className="bg-orange-500 hover:bg-orange-600 px-8 py-4 rounded-xl text-lg font-semibold shadow-xl shadow-orange-500/20 w-full sm:w-auto">
              Explorer les produits →
            </button>
            <button onClick={() => router.push("/auth")} className="border border-gray-700 hover:border-gray-500 px-8 py-4 rounded-xl text-lg text-gray-300 w-full sm:w-auto">
              Créer un compte gratuit
            </button>
          </div>
          <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "30+", label: "Produits analysés" },
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
      </section>

      <section id="features" className="px-8 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Explorer les produits</h2>
<p className="text-gray-400 text-lg mb-6">Sélectionne une source et recherche un produit</p>


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
      <section id="produits" className="px-8 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Explorer les produits</h2>
            <p className="text-gray-400 text-lg mb-8">Sélectionne une catégorie ou recherche un produit</p>
            {/* ONGLETS */}
<div className="flex justify-center gap-4 mb-8">
  <button
  onClick={() => { setSource("amazon"); if (search.length > 2) searchProducts(search, "amazon"); }}
  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all border ${source === "amazon" ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-900 border-gray-800 hover:border-orange-500/50"}`}
>
  🛒 Amazon
</button>
<button
  onClick={() => { setSource("cj"); if (search.length > 2) searchProducts(search, "cj"); }}
  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all border ${source === "cj" ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-900 border-gray-800 hover:border-orange-500/50"}`}
>
  📦 CJDropshipping
</button>
</div>
            <div className="relative max-w-2xl mx-auto mb-8">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedCategory(null);
                  if (e.target.value.length > 2) searchProducts(e.target.value);
                }}
                placeholder="Rechercher n'importe quel produit..."
                className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-2xl pl-12 pr-6 py-4 text-white placeholder-gray-500 focus:outline-none text-lg"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((cat) => (
                <button key={cat} onClick={() => {
                  const newCat = cat === selectedCategory ? null : cat;
                  setSelectedCategory(newCat);
                  setSearch("");
                  if (newCat) searchByCategory(newCat);
                }} className={`flex items-center gap-2 rounded-2xl px-6 py-3 font-medium transition-all border ${selectedCategory === cat ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-900 border-gray-800 hover:border-orange-500/50"}`}>
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

          {!loading && produitsAffiches.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {produitsAffiches.map((p) => (
                <div key={p.id} onClick={() => {
                  if (p.url) window.open(p.url, '_blank');
                  else router.push(`/produit/${p.id}`);
                }} className="bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1">
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

          {!user && filteredProducts.length > 3 && (
  <div className="text-center py-12 border-t border-gray-800 mt-8">
    <p className="text-xl font-bold mb-2">🔒 {filteredProducts.length - 3} produits masqués</p>
    <p className="text-gray-400 mb-6">Crée un compte gratuit pour voir 5 produits</p>
    <button onClick={() => router.push("/auth")} className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-xl font-semibold">
      S'inscrire gratuitement →
    </button>
  </div>
)}

{user && filteredProducts.length > 5 && (
  <div className="text-center py-12 border-t border-gray-800 mt-8">
    <p className="text-xl font-bold mb-2">🔒 {filteredProducts.length - 5} produits masqués</p>
    <p className="text-gray-400 mb-6">Passe au plan Pro pour voir tous les produits</p>
    <button className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-xl font-semibold">
      Passer Pro — 29€/mois →
    </button>
  </div>
)}

          {!loading && search.length > 1 && filteredProducts.length === 0 && (
            <div className="text-center text-gray-500 py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-xl">Aucun produit trouvé pour "{search}"</p>
            </div>
          )}
        </div>
      </section>
      <section id="tarifs" className="px-8 py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Tarifs simples</h2>
          <p className="text-gray-400 text-lg mb-12">Commence gratuitement, upgrade quand tu es prêt</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-left">
              <h3 className="text-xl font-bold mb-2">Gratuit</h3>
              <p className="text-4xl font-bold mb-6">0€<span className="text-gray-400 text-lg font-normal">/mois</span></p>
              <ul className="space-y-3 text-gray-400 text-sm mb-8">
                <li>✅ 3 produits par recherche</li>
                <li>✅ Recherche par mot-clé</li>
                <li>✅ Catégories disponibles</li>
                <li>❌ Produits illimités</li>
                <li>❌ Accès fournisseurs complet</li>
              </ul>
              <button onClick={() => router.push("/auth")} className="w-full border border-gray-700 hover:border-orange-500 py-3 rounded-xl transition-colors">
                Commencer gratuitement
              </button>
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
              <button className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-xl transition-colors font-semibold">
                Commencer l'essai gratuit
              </button>
            </div>
          </div>
        </div>
      </section></main>
  );
}