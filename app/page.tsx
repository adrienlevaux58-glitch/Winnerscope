import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Product = {
  id: number;
  nom: string;
  prix: number | null;
  prixVente: number | null;
  marge: number | null;
  tendance: number;
  croissance?: string;
  scoreGoogle?: number;
  recherches: number;
  concurrence: string;
  fournisseur: string;
  score: number;
  categorie: string;
  url?: string;
  image?: string;
  resellingScore?: number | null;
  ebayMedianPrice?: number | null;
};

function calcResellingScore(
  ebayMedianPrice: number | null,
  totalResults: number,
  sellerCount: number,
  cjPrice: number | null,
  trendsScore: number
): number | null {
  if (!ebayMedianPrice) return null;
  const margeScore = cjPrice
    ? Math.min(100, Math.max(0, ((ebayMedianPrice - cjPrice) / ebayMedianPrice) * 200))
    : 50;
  const demandeScore = Math.min(100, totalResults / 100);
  const concurrenceScore = Math.max(0, 100 - sellerCount * 4);
  return Math.round(
    margeScore * 0.30 +
    demandeScore * 0.25 +
    concurrenceScore * 0.25 +
    trendsScore * 0.20
  );
}

async function fetchEbayScore(produit: Product): Promise<Partial<Product>> {
  try {
    const res = await fetch(`/api/ebay?q=${encodeURIComponent(produit.nom)}`);
    const ebay = await res.json();
    if (ebay.error || ebay.reason === "no_results") return { resellingScore: null };
    const resellingScore = calcResellingScore(
      ebay.medianPrice,
      ebay.totalResults,
      ebay.sellerCount,
      produit.prix,
      produit.scoreGoogle ?? 50
    );
    return { resellingScore, ebayMedianPrice: ebay.medianPrice };
  } catch {
    return { resellingScore: null };
  }
}

export default function Home() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("cj");
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

  useEffect(() => {
    if (search.length <= 2) return;
    const timer = setTimeout(() => {
      searchProducts(search, source);
    }, 800);
    return () => clearTimeout(timer);
  }, [search, source]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const getScoreColor = (score: number | null | undefined) => {
    if (score == null) return "text-gray-500";
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const enrichWithEbay = async (produits: Product[]) => {
    const withPending = produits.map((p) => ({ ...p, resellingScore: undefined }));
    setAllProducts(withPending);
    produits.forEach(async (p, idx) => {
      const ebayData = await fetchEbayScore(p);
      setAllProducts((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, ...ebayData } : item))
      );
    });
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
      if (data.produits && data.produits.length > 0) {
        await enrichWithEbay(data.produits);
      } else {
        setAllProducts([]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const searchByCategory = async (cat: string, currentSource?: string) => {
    setLoading(true);
    const src = currentSource || source;
    try {
      const endpoint = src === "amazon"
        ? `/api/produits?query=${encodeURIComponent(cat)}`
        : `/api/cj?query=${encodeURIComponent(cat)}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.produits && data.produits.length > 0) {
        await enrichWithEbay(data.produits);
      } else {
        setAllProducts([]);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const filteredProducts = selectedCategory
    ? allProducts.filter((p) => p.categorie === selectedCategory && p.nom.toLowerCase().includes(search.toLowerCase()))
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
            WinnerScope analyse les meilleurs produits pour le dropshipping, l'achat-revente et l'e-commerce. Notre IA te donne un score basé sur Google Trends, la marge réelle et la concurrence.
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
              { value: "1M+", label: "Produits disponibles" },
              { value: "3", label: "Sources de données" },
              { value: "100%", label: "Basé sur Google Trends" },
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
            <h2 className="text-4xl font-bold mb-4">Tout ce dont tu as besoin</h2>
            <p className="text-gray-400 text-lg">pour trouver ton prochain produit gagnant</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "🎯", title: "Drop Score", desc: "Score dropshipping basé sur marge CJ, Google Trends et concurrence fournisseurs." },
              { icon: "📦", title: "Resell Score", desc: "Score achat-revente basé sur les prix eBay réels, la demande et la concurrence marché." },
              { icon: "🏭", title: "CJDropshipping", desc: "Accès direct aux produits avec prix fournisseur réel." },
              { icon: "🔍", title: "Recherche rapide", desc: "Trouve n'importe quel produit en quelques secondes." },
              { icon: "📈", title: "Tendances réelles", desc: "Données Google Trends en temps réel pour BE et FR." },
              { icon: "💡", title: "Analyse complète", desc: "Marge, concurrence, tendance et double score global." },
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
            <p className="text-gray-400 text-lg mb-6">Sélectionne une source et recherche un produit</p>
            <div className="flex justify-center gap-4 mb-6">
              <button onClick={() => { setSource("amazon"); if (search.length > 2) searchProducts(search, "amazon"); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all border ${source === "amazon" ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-900 border-gray-800 hover:border-orange-500/50"}`}>
                🛒 Amazon
              </button>
              <button onClick={() => { setSource("cj"); if (search.length > 2) searchProducts(search, "cj"); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all border ${source === "cj" ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-900 border-gray-800 hover:border-orange-500/50"}`}>
                📦 CJDropshipping
              </button>
            </div>
            <div className="relative max-w-2xl mx-auto mb-8">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setSelectedCategory(null); }} placeholder="Rechercher n'importe quel produit..." className="w-full bg-gray-900 border border-gray-700 focus:border-orange-500 rounded-2xl pl-12 pr-6 py-4 text-white placeholder-gray-500 focus:outline-none text-lg" />
              {loading && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">⏳</span>}
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((cat) => (
                <button key={cat} onClick={() => { const newCat = cat === selectedCategory ? null : cat; setSelectedCategory(newCat); setSearch(""); if (newCat) searchByCategory(newCat, source); }} className={`flex items-center gap-2 rounded-2xl px-6 py-3 font-medium transition-all border ${selectedCategory === cat ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-900 border-gray-800 hover:border-orange-500/50"}`}>
                  <span>{categoryEmojis[cat]}</span><span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {loading && (
            <div className="text-center py-20 text-gray-400">
              <p className="text-4xl mb-4">⏳</p>
              <p>Recherche en cours...</p>
            </div>
          )}

          {!loading && produitsAffiches.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {produitsAffiches.map((p) => (
                <div key={p.id} onClick={() => { if (p.url) window.open(p.url, "_blank"); else router.push(`/produit/${p.id}`); }} className="bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-2xl p-6 cursor-pointer transition-all hover:-translate-y-1">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-semibold leading-tight">{p.nom}</h4>
                    <span className={`text-xl font-bold ml-2 shrink-0 ${getScoreColor(p.score)}`}>{p.score}</span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex justify-between"><span>Prix fournisseur</span><span className="text-white font-medium">{p.prix ? `${p.prix}€` : "N/A"}</span></div>
                    <div className="flex justify-between"><span>Prix de vente estimé</span><span className="text-white font-medium">{p.prixVente ? `${p.prixVente}€` : "N/A"}</span></div>
                    <div className="flex justify-between"><span>Marge</span><span className="text-green-400 font-medium">{p.marge ? `${p.marge}%` : "N/A"}</span></div>
                    <div className="flex justify-between"><span>Concurrence</span><span className="text-white font-medium">{p.concurrence}</span></div>
                    {p.ebayMedianPrice && (
                      <div className="flex justify-between">
                        <span>Prix médian eBay</span>
                        <span className="text-blue-400 font-medium">{p.ebayMedianPrice}€</span>
                      </div>
                    )}
                    {p.scoreGoogle !== undefined && (
                      <div className="flex justify-between">
                        <span>Tendance Google</span>
                        <span className={`font-medium ${p.scoreGoogle >= 70 ? "text-green-400" : p.scoreGoogle >= 40 ? "text-orange-400" : "text-red-400"}`}>
                          {p.scoreGoogle}/100 {p.croissance === "hausse" ? "📈" : p.croissance === "baisse" ? "📉" : "➡️"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t border-gray-800">
                    <span className="text-xs text-blue-400 font-medium block mb-3">{p.fournisseur}</span>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-center">
                        <p className="text-xs text-gray-500 mb-1">🎯 Drop Score</p>
                        <p className={`text-xl font-bold ${getScoreColor(p.score)}`}>
                          {p.score}<span className="text-xs font-normal text-gray-500">/100</span>
                        </p>
                      </div>
                      <div className="flex-1 bg-gray-800 rounded-xl px-3 py-2 text-center">
                        <p className="text-xs text-gray-500 mb-1">📦 Resell Score</p>
                        {p.resellingScore === undefined ? (
                          <p className="text-sm text-gray-600 animate-pulse mt-1">…</p>
                        ) : p.resellingScore === null ? (
                          <p className="text-sm text-gray-600 mt-1">—</p>
                        ) : (
                          <p className={`text-xl font-bold ${getScoreColor(p.resellingScore)}`}>
                            {p.resellingScore}<span className="text-xs font-normal text-gray-500">/100</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 text-right">Drop: CJ + Trends · Resell: eBay réel 📊</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!user && filteredProducts.length > 3 && (
            <div className="text-center py-12 border-t border-gray-800 mt-8">
              <p className="text-xl font-bold mb-2">🔒 {filteredProducts.length - 3} produits masqués</p>
              <p className="text-gray-400 mb-6">Crée un compte gratuit pour voir 5 produits</p>
              <button onClick={() => router.push("/auth")} className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-xl font-semibold">S'inscrire gratuitement →</button>
            </div>
          )}

          {user && filteredProducts.length > 5 && (
            <div className="text-center py-12 border-t border-gray-800 mt-8">
              <p className="text-xl font-bold mb-2">🔒 {filteredProducts.length - 5} produits masqués</p>
              <p className="text-gray-400 mb-6">Passe au plan Pro pour voir tous les produits</p>
              <button className="bg-orange-500 hover:bg-orange-600 px-8 py-3 rounded-xl font-semibold">Passer Pro — 29€/mois →</button>
            </div>
          )}

          {!loading && search.length > 2 && filteredProducts.length === 0 && (
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
                <li>✅ Drop Score + Resell Score</li>
                <li>❌ Produits illimités</li>
                <li>❌ Google Trends détaillé</li>
                <li>❌ Prix fournisseur complet</li>
              </ul>
              <button onClick={() => router.push("/auth")} className="w-full border border-gray-700 hover:border-orange-500 py-3 rounded-xl transition-colors">Commencer gratuitement</button>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-8 text-left relative">
              <div className="absolute top-4 right-4 bg-orange-500 text-xs font-bold px-3 py-1 rounded-full">POPULAIRE</div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-4xl font-bold mb-6">29€<span className="text-gray-400 text-lg font-normal">/mois</span></p>
              <ul className="space-y-3 text-gray-400 text-sm mb-8">
                <li>✅ Produits illimités</li>
                <li>✅ Google Trends en temps réel</li>
                <li>✅ Prix fournisseur complet</li>
                <li>✅ Drop Score + Resell Score avancés</li>
                <li>✅ CJDropshipping + Amazon + eBay</li>
                <li>✅ Alertes nouveaux produits</li>
              </ul>
              <button className="w-full bg-orange-500 hover:bg-orange-600 py-3 rounded-xl transition-colors font-semibold">Commencer l'essai gratuit</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-8 py-8 text-center text-gray-500 text-sm">
        <p>© 2025 WinnerScope — Dropshipping · Achat-Revente · E-commerce</p>
        <p className="mt-2 text-xs">Drop Score: CJ + Google Trends · Resell Score: eBay réel + Tendances 📊</p>
      </footer>
    </main>
  );
}