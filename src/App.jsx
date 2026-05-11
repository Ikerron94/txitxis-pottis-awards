import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Beer, Search, Check, ArrowRight, ArrowLeft, Crown } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const FRIENDS = [
  "Paul", "Julen", "Aitzol", "Iker", "Sofi", "Maithan", "Oza", "Pauli",
  "Paula", "Antton", "Maddi", "Malen", "Txispi", "Elizabeth", "Ainhoa",
  "Xabi", "Maiara", "Killian", "Idoia", "Attor", "Ales", "Ota", "Maite",
  "Salet", "Stiff", "Ane Gaztelumendi", "Aimar", "Noa"
];

const CATEGORY_IMAGES = {
  frases: "/images/frases.jpg",
  osasuna: "/images/osasuna.jpg",
  laguna: "/images/laguna.jpg",
  birjaiotze: "/images/birjaiotze.jpg",
  kaosa: "/images/kaosa.jpg",
  altxatu: "/images/altxatu.jpg",
};

const CATEGORIES = [
  { id: "frases", eu: "BETIKO GELDITUKO DIREN ESALDIRIK ONENAK", es: "Mejores frases que se quedan para siempre", icon: "micro", quote: "Te persigue la RAE pero tú eres más rápido…" },
  { id: "osasuna", eu: "OSASUNERAKO IBILBIDE ONENA", es: "Mejor trayectoria hacia la salud", icon: "health", quote: "Ni gaur xuabe lo único neri bat mese" },
  { id: "laguna", eu: "LAGUNEN LAGUNIK ONENA", es: "Mejor amigo de sus amigos", icon: "crown", quote: "Como nos lo vamos a pasar!" },
  { id: "birjaiotze", eu: "BIRJAIOTZE ONENA", es: "Mejor renacer", icon: "flower", quote: "Me van a ver volver!" },
  { id: "kaosa", eu: "KAOSAREN ETA ORDENAREN ARTEKO OREKARIK ONENA", es: "Mejor equilibrio entre caos y orden", icon: "scale", quote: "Daonean dale, ez daonen bale" },
  { id: "altxatu", eu: "ERORTZEN ETA BERRIZ ALTXATZEN ONENA", es: "Mejor en caer y volver a levantarse", icon: "rise", quote: "Nunca se cae, siempre se tira" },
];

function BottleTrophy() {
  return (
    <div className="relative mx-auto h-40 w-28">
      <div className="absolute left-1/2 top-1 -translate-x-1/2 h-20 w-7 rounded-t-lg border border-yellow-900/70 bg-gradient-to-r from-yellow-950 via-amber-500 to-yellow-900 shadow-2xl" />
      <div className="absolute left-1/2 top-14 -translate-x-1/2 h-20 w-14 rounded-lg border border-yellow-900/70 bg-gradient-to-r from-yellow-950 via-amber-400 to-yellow-900" />
      <div className="absolute left-1/2 top-[7.4rem] -translate-x-1/2 h-4 w-20 rounded-full bg-amber-700 border border-yellow-950" />
      <div className="absolute left-1/2 top-[8.2rem] -translate-x-1/2 h-7 w-24 rounded-md bg-gradient-to-r from-yellow-950 via-amber-600 to-yellow-950 border border-amber-900" />
      <div className="absolute inset-0 blur-xl bg-red-700/20 rounded-full" />
    </div>
  );
}

function CategoryIcon({ type }) {
  const base = "h-20 w-20 rounded-full border border-amber-400/40 bg-black/45 flex items-center justify-center shadow-2xl mx-auto backdrop-blur-sm";
  if (type === "micro") return <div className={base}><span className="text-5xl">“</span><Beer className="h-7 w-7 text-amber-300"/><span className="text-5xl">”</span></div>;
  if (type === "health") return <div className={base}><span className="text-4xl">👟</span><Beer className="h-6 w-6 text-amber-300 ml-1"/></div>;
  if (type === "crown") return <div className={base}><Crown className="h-12 w-12 text-amber-300"/></div>;
  if (type === "flower") return <div className={base}><span className="text-5xl">✺</span></div>;
  if (type === "scale") return <div className={base}><span className="text-5xl">⚖</span></div>;
  return <div className={base}><span className="text-5xl">↗</span></div>;
}

function calculateResults(allVotes) {
  const results = {};

  CATEGORIES.forEach((cat) => {
    const points = {};

    allVotes
      .filter((row) => row.category_id === cat.id)
      .forEach((row) => {
        if (row.first_choice) points[row.first_choice] = (points[row.first_choice] || 0) + 3;
        if (row.second_choice) points[row.second_choice] = (points[row.second_choice] || 0) + 2;
        if (row.third_choice) points[row.third_choice] = (points[row.third_choice] || 0) + 1;
      });

    results[cat.id] = Object.entries(points)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  });

  return results;
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [voter, setVoter] = useState("");
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [votes, setVotes] = useState({});
  const [query, setQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [adminVotes, setAdminVotes] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [voterCheckLoading, setVoterCheckLoading] = useState(false);
  const [voterAlreadyVoted, setVoterAlreadyVoted] = useState(false);

  const currentCategory = CATEGORIES[categoryIndex];
  const selected = votes[currentCategory?.id] || [];
  const adminResults = useMemo(() => calculateResults(adminVotes), [adminVotes]);

  const filteredFriends = useMemo(() => {
    return FRIENDS.filter((name) => name !== voter && name.toLowerCase().includes(query.toLowerCase()));
  }, [query, voter]);

  const selectName = (name) => {
    if (!currentCategory) return;
    const current = votes[currentCategory.id] || [];
    if (current.includes(name)) {
      setVotes({ ...votes, [currentCategory.id]: current.filter((n) => n !== name) });
      return;
    }
    if (current.length >= 3) return;
    setVotes({ ...votes, [currentCategory.id]: [...current, name] });
  };

  const nextCategory = () => {
    setQuery("");
    if (categoryIndex < CATEGORIES.length - 1) setCategoryIndex(categoryIndex + 1);
    else saveVotes();
  };

  const prevCategory = () => {
    setQuery("");
    if (categoryIndex > 0) setCategoryIndex(categoryIndex - 1);
  };



  const checkVoterAndEnter = async () => {
    setSaveError("");
    setVoterAlreadyVoted(false);

    if (!supabase) {
      setScreen("vote");
      return;
    }

    setVoterCheckLoading(true);

    const { data, error } = await supabase
      .from("votes")
      .select("id")
      .eq("voter", voter)
      .limit(1);

    setVoterCheckLoading(false);

    if (error) {
      setSaveError("No se ha podido comprobar si ya habías votado. Inténtalo otra vez.");
      return;
    }

    if (data && data.length > 0) {
      setVoterAlreadyVoted(true);
      return;
    }

    setScreen("vote");
  };

  const openAdmin = async () => {
    setAdminError("");
    setScreen("admin");

    if (!supabase) {
      setAdminError("Falta conectar Supabase.");
      return;
    }

    setAdminLoading(true);
    const { data, error } = await supabase
      .from("votes")
      .select("voter, category_id, first_choice, second_choice, third_choice, created_at")
      .order("created_at", { ascending: false });

    setAdminLoading(false);

    if (error) {
      setAdminError("No se han podido cargar los resultados.");
      return;
    }

    setAdminVotes(data || []);
  };

  const saveVotes = async () => {
    setSaveError("");
    if (!supabase) {
      setSaveError("Falta conectar Supabase. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.");
      return;
    }
    setIsSaving(true);
    const rows = CATEGORIES.map((cat) => {
      const selected = votes[cat.id] || [];
      return { voter, category_id: cat.id, first_choice: selected[0] || null, second_choice: selected[1] || null, third_choice: selected[2] || null };
    });
    const { error } = await supabase.from("votes").upsert(rows, { onConflict: "voter,category_id" });
    setIsSaving(false);
    if (error) {
      setSaveError("No se han podido guardar los votos. Revisa Supabase o inténtalo otra vez.");
      return;
    }
    setScreen("finish");
  };

  return (
    <div className="min-h-screen bg-[#120908] text-[#f4d18a] overflow-hidden font-sans">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(150,0,0,0.55),transparent_34%),linear-gradient(135deg,#5b0806_0%,#150908_50%,#080403_100%)]" />
      <div className="fixed inset-0 opacity-[0.18]" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"120\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"120\" height=\"120\" filter=\"url(%23n)\" opacity=\"0.55\"/%3E%3C/svg%3E')"}} />
      <main className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
        <AnimatePresence mode="wait">
          {screen === "home" && (
            <motion.section
              key="home"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -18 }}
              className="relative overflow-hidden flex min-h-[92vh] flex-col justify-between rounded-[2rem] border border-amber-300/25 bg-black/40 p-5 shadow-2xl backdrop-blur-sm"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,190,70,0.20),transparent_18%),radial-gradient(circle_at_50%_45%,rgba(170,0,0,0.45),transparent_42%)]" />
              <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-red-900/30 blur-3xl" />
              <div className="absolute -right-24 bottom-24 h-72 w-72 rounded-full bg-amber-600/10 blur-3xl" />
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-transparent via-red-700/70 to-transparent" />

              <div className="relative text-center">
                <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-black/45 px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-red-300">
                  <Star className="h-3 w-3" /> Bozketa ofiziala <Star className="h-3 w-3" />
                </div>

                <div className="rounded-[1.75rem] border border-red-900/50 bg-black/30 p-4 shadow-2xl">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.55em] text-amber-100/55">Maiatzekoen festa</p>
                  <h1 className="text-6xl font-black uppercase leading-[0.76] tracking-[-0.08em] text-[#f1c46d] drop-shadow-lg">
                    Txitxis
                    <br />
                    <span className="text-red-700">&</span> Potti
                    <br />
                    <span className="text-4xl tracking-[-0.06em] text-red-700">Awards</span>
                    <br />
                    <span className="text-5xl">2026</span>
                  </h1>
                </div>

                <p className="mt-5 border-y border-red-800/70 bg-black/25 py-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#f6d7a0]">
                  SAIATZEN GARA GAUZAK ONGI EGITEN
                </p>
              </div>

              <div className="relative my-7">
                <div className="absolute inset-0 scale-125 rounded-full bg-red-700/25 blur-3xl" />
                <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/10" />
                <BottleTrophy />
                <p className="mt-3 text-center text-[10px] uppercase tracking-[0.45em] text-amber-100/40">The bottle wants to be a trophy</p>
              </div>

              <div className="relative space-y-4 text-center">
                <div className="rounded-2xl border border-amber-300/15 bg-black/35 p-3">
                  <p className="text-sm font-bold text-amber-100/90">Maiatzak 16</p>
                  <p className="text-sm text-amber-100/75">Baga-Biga Faktorian · 17etatik aurrera</p>
                </div>

                <button
                  onClick={() => setScreen("voter")}
                  className="w-full rounded-2xl border border-amber-300/30 bg-gradient-to-b from-red-700 to-red-950 px-5 py-4 text-lg font-black uppercase tracking-widest text-amber-100 shadow-xl shadow-red-950/50 active:scale-[0.98]"
                >
                  Hasi bozkatzen
                </button>

                <button
                  onClick={openAdmin}
                  className="text-[10px] uppercase tracking-[0.45em] text-amber-100/25 underline decoration-amber-100/10"
                >
                  Akademia
                </button>
              </div>
            </motion.section>
          )}

          {screen === "voter" && (
            <motion.section key="voter" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="rounded-[2rem] border border-amber-300/25 bg-black/40 p-5 shadow-2xl">
              <h2 className="text-4xl font-black uppercase tracking-tight">Nor zara?</h2>
              <p className="mt-2 text-sm text-amber-100/70">Aukeratu zure izena / Elige tu nombre. Akademiak dena kontrolpean dauka. Gutxi gorabehera.</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {FRIENDS.map((name) => (
                  <button key={name} onClick={() => { setVoter(name); setVoterAlreadyVoted(false); setSaveError(""); }} className={`rounded-xl border px-3 py-3 text-left font-bold ${voter === name ? "border-amber-300 bg-amber-400 text-black" : "border-amber-300/20 bg-black/35"}`}>{name}</button>
                ))}
              </div>
              {voterAlreadyVoted && (
                <div className="mt-5 rounded-2xl border border-amber-300/30 bg-black/45 p-4 text-sm text-amber-100">
                  <p className="font-black uppercase text-red-300">Bozka eginda / Ya has votado</p>
                  <p className="mt-1 text-amber-100/70">Akademiak zure botoak gordeta dauzka. Si hay que corregir algo, que lo gestione Iker desde Supabase.</p>
                </div>
              )}
              {saveError && (
                <p className="mt-5 rounded-2xl border border-red-400/40 bg-red-950/60 p-4 text-sm text-red-100">{saveError}</p>
              )}
              <button disabled={!voter || voterCheckLoading || voterAlreadyVoted} onClick={checkVoterAndEnter} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-800 px-5 py-4 font-black uppercase tracking-widest disabled:opacity-40">
                {voterCheckLoading ? "Begiratzen..." : "Sartu galara / Entrar"} <ArrowRight className="h-5 w-5"/>
              </button>
            </motion.section>
          )}

          {screen === "vote" && currentCategory && (
            <motion.section key={currentCategory.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="rounded-[2rem] border border-amber-300/25 bg-black/40 p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-amber-100/60">
                <span>{categoryIndex + 1}/{CATEGORIES.length}</span><span>{voter}</span>
              </div>
              <div className="rounded-3xl border border-red-900/60 bg-red-950/30 p-4 text-center">
                <div className="relative overflow-hidden rounded-3xl border border-amber-300/20">
                  <img src={CATEGORY_IMAGES[currentCategory.id]} alt={currentCategory.es} className="h-52 w-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center"><CategoryIcon type={currentCategory.icon} /></div>
                </div>
                <h2 className="mt-4 text-2xl font-black uppercase leading-none tracking-tight text-[#f1c46d]">{currentCategory.eu}</h2>
                <p className="mt-2 text-sm font-semibold text-amber-100/85">{currentCategory.es}</p>
                <p className="mt-3 text-xs italic text-red-200/70">“{currentCategory.quote}”</p>
              </div>
              <div className="mt-4 rounded-2xl border border-amber-300/20 bg-black/35 p-3">
                <div className="mb-3 flex items-center justify-between"><span className="font-black uppercase text-red-300">Aukeratu 3 / Elige 3</span><span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-black text-black">{selected.length}/3</span></div>
                <div className="relative mb-3"><Search className="absolute left-3 top-3 h-4 w-4 text-amber-100/50"/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Bilatu izena / Busca un nombre..." className="w-full rounded-xl border border-amber-300/20 bg-black/50 py-3 pl-10 pr-3 text-amber-100 placeholder:text-amber-100/40 outline-none" /></div>
                <div className="max-h-[42vh] space-y-2 overflow-y-auto pr-1">
                  {filteredFriends.map((name) => {
                    const rank = selected.indexOf(name);
                    const active = rank !== -1;
                    return <button key={name} onClick={() => selectName(name)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left font-bold transition ${active ? "border-amber-300 bg-amber-400 text-black" : selected.length >= 3 ? "border-amber-300/10 bg-black/20 text-amber-100/40" : "border-amber-300/20 bg-black/35"}`}><span>{name}</span>{active && <span className="text-lg">{rank === 0 ? "🥇" : rank === 1 ? "🥈" : "🥉"}</span>}</button>;
                  })}
                </div>
              </div>
              {saveError && <p className="mt-3 rounded-xl border border-red-400/40 bg-red-950/60 p-3 text-sm text-red-100">{saveError}</p>}
              <div className="mt-4 flex gap-2">
                <button onClick={prevCategory} disabled={categoryIndex === 0 || isSaving} className="rounded-2xl border border-amber-300/25 px-4 py-3 disabled:opacity-30"><ArrowLeft/></button>
                <button onClick={nextCategory} disabled={selected.length === 0 || isSaving} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-800 px-5 py-3 font-black uppercase tracking-widest disabled:opacity-40">{isSaving ? "Gordetzen..." : categoryIndex === CATEGORIES.length - 1 ? "Bidali botoak" : "Hurrengoa / Siguiente"} <ArrowRight className="h-5 w-5"/></button>
              </div>
            </motion.section>
          )}


          {screen === "admin" && (
            <motion.section key="admin" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="rounded-[2rem] border border-amber-300/25 bg-black/45 p-5 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-red-300">Akademia</p>
                  <h2 className="mt-1 text-4xl font-black uppercase leading-none tracking-tight">Recuento oficial</h2>
                  <p className="mt-2 text-sm text-amber-100/70">Top 4 nominados por categoría. 1º = 3 puntos · 2º = 2 puntos · 3º = 1 punto.</p>
                </div>
                <button onClick={() => setScreen("home")} className="rounded-xl border border-amber-300/25 px-3 py-2 text-sm font-bold">Cerrar</button>
              </div>

              {adminLoading && <p className="rounded-2xl border border-amber-300/20 bg-black/35 p-4 text-amber-100/80">Kargatzen... Cargando resultados.</p>}
              {adminError && <p className="rounded-2xl border border-red-400/40 bg-red-950/60 p-4 text-red-100">{adminError}</p>}

              {!adminLoading && !adminError && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-amber-300/20 bg-black/35 p-3 text-sm text-amber-100/80">
                    Boto kopurua / votos registrados: <span className="font-black text-amber-300">{new Set(adminVotes.map((v) => v.voter)).size}</span>
                  </div>

                  {CATEGORIES.map((cat) => {
                    const ranking = adminResults[cat.id] || [];
                    return (
                      <div key={cat.id} className="rounded-3xl border border-amber-300/20 bg-black/35 p-4">
                        <h3 className="text-lg font-black uppercase leading-none text-[#f1c46d]">{cat.eu}</h3>
                        <p className="mt-1 text-xs text-amber-100/60">{cat.es}</p>

                        <div className="mt-4 space-y-2">
                          {ranking.length === 0 && (
                            <p className="text-sm text-amber-100/50">Oraindik botorik ez / Todavía sin votos.</p>
                          )}

                          {ranking.slice(0, 4).map((item, index) => (
                            <div key={item.name} className={`flex items-center justify-between rounded-xl border px-3 py-3 ${index === 0 ? "border-amber-300 bg-amber-400 text-black" : "border-amber-300/15 bg-black/30 text-amber-100"}`}>
                              <div className="flex items-center gap-3">
                                <span className="w-7 text-center text-lg font-black">{index + 1}</span>
                                <span className="font-black">{item.name}</span>
                              </div>
                              <span className="rounded-full bg-black/25 px-3 py-1 text-sm font-black">{item.total} puntu</span>
                            </div>
                          ))}
                        </div>

                        {ranking.length > 4 && (
                          <details className="mt-3 text-sm text-amber-100/70">
                            <summary className="cursor-pointer">Ikusi ranking osoa / Ver ranking completo</summary>
                            <div className="mt-2 space-y-1">
                              {ranking.slice(4).map((item, index) => (
                                <div key={item.name} className="flex justify-between border-b border-amber-300/10 py-1">
                                  <span>{index + 5}. {item.name}</span>
                                  <span>{item.total}</span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          )}

          {screen === "finish" && (
            <motion.section key="finish" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[92vh] flex-col justify-center rounded-[2rem] border border-amber-300/25 bg-black/40 p-6 text-center shadow-2xl">
              <Trophy className="mx-auto h-16 w-16 text-amber-300" />
              <h2 className="mt-5 text-4xl font-black uppercase leading-none">Zure botoak jaso ditugu.</h2>
              <p className="mt-4 text-lg text-red-200">Orain damutzeko berandu da. Ya es tarde para arrepentirse.</p>
              <div className="mt-8 rounded-2xl border border-amber-300/20 bg-black/35 p-4 text-left text-sm text-amber-100/80">
                <div className="mb-2 flex items-center gap-2 font-black text-amber-300"><Check className="h-4 w-4"/> Laburpena</div>
                {CATEGORIES.map((cat) => <p key={cat.id} className="py-1"><span className="text-red-300">{cat.eu.slice(0, 22)}...</span> · {(votes[cat.id] || []).join(", ")}</p>)}
              </div>
              <button onClick={() => {setScreen("home"); setCategoryIndex(0); setVotes({}); setVoter(""); setVoterAlreadyVoted(false);}} className="mt-6 rounded-2xl bg-red-800 px-5 py-4 font-black uppercase tracking-widest">Amaitu</button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
