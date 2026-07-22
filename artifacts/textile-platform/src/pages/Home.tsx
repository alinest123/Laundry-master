import { Link } from "wouter";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Shell } from "@/components/layout/Shell";
import {
  useGetFeaturedArticles,
  useGetPlatformStats,
  useGetLatestArticles,
  useListCategories,
  useListTestimonials,
  useListExperts,
} from "@workspace/api-client-react";

/* ─── Placeholder images (Unsplash – no API key needed) ─── */
const IMG = {
  hero1: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=80",
  hero2: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80",
  hero3: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=200&q=80",
  dark1: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80",
  service1: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=500&q=80",
  service2: "https://images.unsplash.com/photo-1606185540834-d6e7483ee1a4?w=500&q=80",
  service3: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=500&q=80",
  service4: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=500&q=80",
  service5: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&q=80",
  team: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80",
  feature1: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80",
  feature2: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=600&q=80",
  detail1: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=500&q=80",
  detail2: "https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&q=80",
  detail3: "https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?w=500&q=80",
};

const IconFabricAnalysis = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Microscope body */}
    <rect x="20" y="6" width="8" height="12" rx="1.5" stroke="#4a7c59" strokeWidth="1.8" strokeLinejoin="round"/>
    {/* Eyepiece */}
    <rect x="22" y="3" width="4" height="5" rx="1" stroke="#4a7c59" strokeWidth="1.8" strokeLinejoin="round"/>
    {/* Arm */}
    <path d="M24 18 L24 28" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round"/>
    {/* Stage */}
    <path d="M16 28 L32 28" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round"/>
    {/* Objective lens */}
    <circle cx="24" cy="31" r="4" stroke="#4a7c59" strokeWidth="1.8"/>
    {/* Base */}
    <path d="M14 42 L34 42" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M24 38 L24 42" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M16 42 L14 38 M32 42 L34 38" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round"/>
    {/* Adjustment knob */}
    <circle cx="33" cy="26" r="2.5" stroke="#4a7c59" strokeWidth="1.6"/>
    <path d="M33 23.5 L33 20" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

const IconStainRemoval = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Main water drop */}
    <path d="M24 8 C24 8 13 21 13 29 C13 35.627 18.373 41 25 41 C31.627 41 37 35.627 37 29 C37 21 24 8 24 8 Z" stroke="#4a7c59" strokeWidth="1.8" strokeLinejoin="round"/>
    {/* Inner shine arc */}
    <path d="M18 28 C18 24 20 21 22 19" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round"/>
    {/* Sparkle rays */}
    <line x1="38" y1="14" x2="41" y2="11" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="40" y1="18" x2="44" y2="17" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="37" y1="10" x2="37" y2="6" stroke="#4a7c59" strokeWidth="1.6" strokeLinecap="round"/>
    {/* Small drop */}
    <path d="M38 26 C38 26 34 31 34 33.5 C34 35.433 35.567 37 37.5 37 C39.433 37 41 35.433 41 33.5 C41 31 38 26 38 26 Z" stroke="#4a7c59" strokeWidth="1.6" strokeLinejoin="round"/>
  </svg>
);

const IconPlantConsulting = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Factory building main body */}
    <rect x="6" y="22" width="36" height="20" rx="1" stroke="#4a7c59" strokeWidth="1.8" strokeLinejoin="round"/>
    {/* Roof with sawtooth */}
    <path d="M6 22 L14 14 L14 22 L22 14 L22 22 L30 14 L30 22" stroke="#4a7c59" strokeWidth="1.8" strokeLinejoin="round"/>
    {/* Chimneys */}
    <rect x="32" y="10" width="4" height="12" rx="1" stroke="#4a7c59" strokeWidth="1.6" strokeLinejoin="round"/>
    <rect x="38" y="14" width="3" height="8" rx="1" stroke="#4a7c59" strokeWidth="1.6" strokeLinejoin="round"/>
    {/* Smoke */}
    <path d="M34 10 C34 8 36 7 35 5" stroke="#4a7c59" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M39.5 14 C39.5 12 41 11 40 9" stroke="#4a7c59" strokeWidth="1.4" strokeLinecap="round"/>
    {/* Windows */}
    <rect x="10" y="27" width="5" height="5" rx="0.5" stroke="#4a7c59" strokeWidth="1.5"/>
    <rect x="21" y="27" width="5" height="5" rx="0.5" stroke="#4a7c59" strokeWidth="1.5"/>
    {/* Door */}
    <rect x="31" y="31" width="7" height="11" rx="0.5" stroke="#4a7c59" strokeWidth="1.5"/>
    {/* Ground line */}
    <line x1="4" y1="42" x2="44" y2="42" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconCompliance = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Document */}
    <path d="M10 6 L10 42 L38 42 L38 14 L30 6 Z" stroke="#4a7c59" strokeWidth="1.8" strokeLinejoin="round"/>
    {/* Folded corner */}
    <path d="M30 6 L30 14 L38 14" stroke="#4a7c59" strokeWidth="1.8" strokeLinejoin="round"/>
    {/* Lines of text */}
    <line x1="15" y1="20" x2="33" y2="20" stroke="#4a7c59" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="15" y1="25" x2="33" y2="25" stroke="#4a7c59" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Checkmark badge */}
    <circle cx="19" cy="35" r="6" stroke="#4a7c59" strokeWidth="1.6" fill="white"/>
    <path d="M16 35 L18 37.5 L22 32.5" stroke="#4a7c59" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SERVICES = [
  { icon: <IconFabricAnalysis />, title: "Fabric Analysis", desc: "Fiber identification, construction analysis, and professional care assessment for any textile." },
  { icon: <IconStainRemoval />, title: "Stain Removal", desc: "Evidence-based stain identification and treatment protocols for all fiber types and substrates." },
  { icon: <IconPlantConsulting />, title: "Plant Consulting", desc: "Workflow optimization, equipment selection, and quality systems for commercial laundry operations." },
  { icon: <IconCompliance />, title: "Compliance & Standards", desc: "ISO care labeling, GINETEX standards, and regulatory compliance guidance for global markets." },
];

const SERVICE_PHOTOS = [
  { img: IMG.service1, label: "Dry Cleaning Science" },
  { img: IMG.service2, label: "Fabric Research" },
  { img: IMG.service3, label: "Garment Analysis" },
  { img: IMG.service4, label: "Textile Testing" },
  { img: IMG.service5, label: "Water Quality" },
];

const TESTIMONIALS = [
  {
    quote: "The consulting session with Dr. Marchetti resolved a persistent re-soiling issue that had cost us thousands in chemical waste. Her understanding of water chemistry and surfactant interaction is exceptional. This platform is now mandatory reading for all our supervisors.",
    name: "Stefan Kirchner",
    role: "Plant Manager, Elis Group — Germany",
    avatar: "https://i.pravatar.cc/80?img=11",
  },
  {
    quote: "Prof. Okafor identified the root cause of our solvent balance issues within the first session. His depth of knowledge across both traditional and modern dry cleaning chemistry is unmatched. The articles on this platform are the most authoritative I have encountered in 15 years in the industry.",
    name: "Amina Osei-Bonsu",
    role: "Quality Director, Berendsen Textile Service — Denmark",
    avatar: "https://i.pravatar.cc/80?img=47",
  },
  {
    quote: "Dr. Andersson helped us reformulate our chemical program from scratch. Our water consumption dropped 23% and our repeat customer rate is up 18%. Worth every euro. The knowledge hub has become our technical reference library.",
    name: "Carlos Mendez",
    role: "Owner, Tintorería Excellence — Madrid",
    avatar: "https://i.pravatar.cc/80?img=33",
  },
];

const TABS = ["Articles", "Experts", "Topics", "Countries"];

export function Home() {
  const { data: stats } = useGetPlatformStats();
  const { data: featuredArticles } = useGetFeaturedArticles({ limit: 3 });
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [activeTab, setActiveTab] = useState(0);

  const t = TESTIMONIALS[testimonialIdx];

  const STAT_TABS = [
    { label: "Articles", value: stats?.totalArticles?.toString() || "500+" },
    { label: "Experts", value: stats?.totalExperts?.toString() || "25" },
    { label: "Topics", value: stats?.totalCategories?.toString() || "20" },
    { label: "Countries", value: stats?.countriesReached?.toString() || "94" },
  ];

  return (
    <Shell>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-[1280px] mx-auto px-6 py-16 md:py-24 grid md:grid-cols-[1fr_1fr] gap-12 items-center">
          {/* Left */}
          <div>
            <span className="label-tag">Science-first textile care knowledge</span>
            <h1 className="heading-xl text-[#1c1c1c] mb-6">
              Professional<br />Textile Care<br />Experts
            </h1>
            <p className="text-[#555] text-[1rem] leading-relaxed mb-8 max-w-md">
              World-class knowledge, research, and consultations for laundry, dry cleaning, and fabric science professionals across 94 countries.
            </p>
            <Link href="/consultations/book" className="btn-dark inline-flex items-center gap-2 rounded-tl-[10px] rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px]">
              Book a Consultation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Right – photo collage */}
          <div className="relative h-[420px] md:h-[500px] select-none overflow-hidden">
            {/* Small circle top-left — wipes in first */}
            <motion.div
              className="absolute left-0 top-[10%] w-[38%] aspect-square rounded-full overflow-hidden shadow-md border-4 border-white"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94], delay: 0 }}
            >
              <img src={IMG.hero2} alt="Laboratory" className="w-full h-full object-cover" />
            </motion.div>

            {/* Small circle bottom-left — wipes in second */}
            <motion.div
              className="absolute left-[14%] bottom-[8%] w-[28%] aspect-square rounded-full overflow-hidden shadow-md border-4 border-white"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.18 }}
            >
              <img src={IMG.hero3} alt="Fabric testing" className="w-full h-full object-cover" />
            </motion.div>

            {/* Green accent pill — wipes in third */}
            <motion.div
              className="absolute right-[64%] top-[47%] bg-[#4a7c59] text-white text-[0.7rem] font-bold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap z-10"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.32 }}
            >
              500+ Research Articles
            </motion.div>

            {/* Main tall photo — wipes in last */}
            <motion.div
              className="absolute right-0 top-0 w-[62%] h-full rounded-[180px_180px_180px_24px] overflow-hidden shadow-lg"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.45 }}
            >
              <img src={IMG.hero1} alt="Textile expert" className="w-full h-full object-cover" />
            </motion.div>
          </div>
        </div>
      </section>
      {/* ── SPLIT INTRO ──────────────────────────────────────── */}
      <section className="grid md:grid-cols-2 min-h-[380px] relative">
        {/* Left dark photo */}
        <div className="relative min-h-[320px] md:min-h-0">
          <img src={IMG.dark1} alt="Expert consultant" className="w-full h-full object-cover object-top" />
        </div>

        {/* Text caption box — overlaps bottom-right corner of image */}
        <div className="absolute bottom-0 right-0 md:left-1/2 md:translate-x-[-30%] bg-[#1c1c1c] px-8 py-7 max-w-[280px] z-10 rounded-tl-[20px] rounded-tr-[20px] rounded-br-[20px] rounded-bl-[20px]">
          <p className="text-white font-bold text-[1.2rem] leading-snug">
            Science & support<br />for your textile<br />care operations
          </p>
        </div>

        {/* Right white */}
        <div className="bg-white px-10 py-14 flex flex-col justify-center">
          <span className="label-tag">Our expertise</span>
          <h2 className="heading-md text-[#1c1c1c] mb-8">
            We help textile care<br />businesses grow
          </h2>
          <div className="space-y-4">
            {[
              { title: "Fabric & fiber science", desc: "Evidence-based knowledge for all fiber types and fabric constructions." },
              { title: "Wet processing & chemistry", desc: "Detergents, solvents, water quality, and cleaning chemistry." },
            ].map((item) => (
              <div key={item.title} className="flex items-start justify-between gap-4 pb-4 border-b border-[#f0f0f0] last:border-0">
                <div>
                  <p className="font-bold text-[#1c1c1c] text-sm mb-0.5">{item.title}</p>
                  <p className="text-[#777] text-xs leading-relaxed">{item.desc}</p>
                </div>
                <Link href="/articles" className="shrink-0 w-8 h-8 border border-[#e0e0e0] rounded-full flex items-center justify-center hover:bg-[#1c1c1c] hover:border-[#1c1c1c] hover:text-white transition-all">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── SERVICES GRID ────────────────────────────────────── */}
      <section className="bg-[#f5f5f2] py-20 px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-14">
            <div>
              <h2 className="heading-lg text-[#1c1c1c]">Your knowledge goals<br />are our priority</h2>
            </div>
            <div className="flex flex-col justify-end">
              <p className="text-[#666] text-sm leading-relaxed mb-4 max-w-sm">
                From fiber science fundamentals to advanced plant operations — expert-authored resources trusted by textile care professionals worldwide.
              </p>
              <Link href="/articles" className="inline-flex items-center gap-1.5 text-[#1c1c1c] text-sm font-bold hover:text-[#4a7c59] transition-colors">
                Browse all articles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SERVICES.map((s) => (
              <div key={s.title} className="bg-white p-7 rounded-[8px] border border-[#e8e8e8] hover:shadow-md transition-shadow">
                <div className="text-2xl mb-4">{s.icon}</div>
                <h3 className="font-bold text-[#1c1c1c] text-sm mb-2">{s.title}</h3>
                <p className="text-[#777] text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── PHOTO CARD ROW ───────────────────────────────────── */}
      <section className="bg-white py-0 overflow-hidden">
        <div className="grid grid-cols-5">
          {SERVICE_PHOTOS.map((p, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden group cursor-pointer">
              <img src={p.img} alt={p.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-bold text-xs leading-tight">{p.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-[780px] mx-auto text-center">
          <span className="label-tag">Client feedback</span>
          <h2 className="heading-md text-[#1c1c1c] mb-10">Our customer reviews</h2>

          <div className="relative min-h-[160px]">
            <div className="text-[3rem] leading-none text-[#4a7c59] font-serif mb-3">"</div>
            <p className="text-[#444] text-[0.95rem] leading-relaxed italic mb-8">{t.quote}</p>
            <p className="font-bold text-[#1c1c1c] text-sm">{t.name}</p>
            <p className="text-[#888] text-xs mt-0.5">{t.role}</p>
          </div>

          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              onClick={() => setTestimonialIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              className="w-9 h-9 border border-[#e0e0e0] rounded-full flex items-center justify-center hover:bg-[#1c1c1c] hover:border-[#1c1c1c] hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className="group"
                >
                  <img
                    src={item.avatar}
                    alt={item.name}
                    className={`w-9 h-9 rounded-full object-cover border-2 transition-all ${i === testimonialIdx ? "border-[#4a7c59] opacity-100" : "border-transparent opacity-50 hover:opacity-75"}`}
                  />
                </button>
              ))}
            </div>
            <button
              onClick={() => setTestimonialIdx((i) => (i + 1) % TESTIMONIALS.length)}
              className="w-9 h-9 border border-[#e0e0e0] rounded-full flex items-center justify-center hover:bg-[#1c1c1c] hover:border-[#1c1c1c] hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
      {/* ── STATS TABS ───────────────────────────────────────── */}
      <section className="bg-[#f5f5f2] border-y border-[#e8e8e8] py-0">
        <div className="max-w-[1280px] mx-auto grid grid-cols-4">
          {STAT_TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`py-5 px-6 text-center border-r border-[#e8e8e8] last:border-0 transition-colors ${activeTab === i ? "bg-white" : "hover:bg-white/60"}`}
            >
              <p className="font-extrabold text-[#1c1c1c] text-sm">{tab.value}</p>
              <p className="text-[#888] text-xs mt-0.5">{tab.label}</p>
            </button>
          ))}
        </div>
      </section>
      {/* ── TEAM PHOTO ───────────────────────────────────────── */}
      <section className="bg-white overflow-hidden">
        <div className="w-full h-[420px] md:h-[520px]">
          <img src={IMG.team} alt="Textile care professionals" className="w-full h-full object-cover" />
        </div>
      </section>
      {/* ── NUMBERS BAR ──────────────────────────────────────── */}
      <section className="bg-white border-t border-[#f0f0f0] py-8 px-6">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { n: "500+", l: "Research Articles" },
            { n: "94", l: "Countries Reached" },
            { n: "25+", l: "Domain Experts" },
            { n: "12k+", l: "Professionals" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-extrabold text-[1.9rem] text-[#1c1c1c] leading-none">{s.n}</p>
              <p className="text-[#888] text-xs mt-1.5 uppercase tracking-wider font-semibold">{s.l}</p>
            </div>
          ))}
        </div>
      </section>
      {/* ── FEATURE SPLIT ────────────────────────────────────── */}
      <section className="bg-[#f5f5f2] py-20 px-6">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-2 gap-14 items-center">
          {/* Left: stacked photos */}
          <div className="relative h-[440px]">
            <div className="absolute left-0 top-0 w-[72%] h-[68%] rounded-[12px] overflow-hidden shadow-lg">
              <img src={IMG.feature1} alt="Laboratory" className="w-full h-full object-cover" />
            </div>
            <div className="absolute right-0 bottom-0 w-[62%] h-[58%] rounded-[12px] overflow-hidden shadow-lg border-4 border-[#f5f5f2]">
              <img src={IMG.feature2} alt="Research" className="w-full h-full object-cover" />
            </div>
            {/* Play button overlay */}
            <button className="absolute left-[30%] top-[40%] -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
              <Play className="w-5 h-5 fill-[#1c1c1c] text-[#1c1c1c] ml-0.5" />
            </button>
          </div>

          {/* Right: text */}
          <div>
            <span className="label-tag">Professional impact</span>
            <h2 className="heading-lg text-[#1c1c1c] mb-5">
              Cut your costs by<br />up to 60%
            </h2>
            <p className="text-[#666] text-sm leading-relaxed mb-8 max-w-md">
              Applying the science in our knowledge base, professionals have reduced chemical spend by 30–60%, cut water usage by 20–40%, and dramatically reduced garment damage claims. Precision beats guesswork every time.
            </p>
            <Link href="/consultations/book" className="btn-green">
              Book a Consultation <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
      {/* ── DETAILS / ARTICLES ───────────────────────────────── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12">
            <span className="label-tag">Latest Knowledge</span>
            <h2 className="heading-lg text-[#1c1c1c]">Details about our research</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { img: IMG.detail1, cat: "Fabric Science", title: "Understanding Cotton Fiber Structure and Wet Processing Behavior", desc: "How the crystalline structure of cotton cellulose affects swelling, shrinkage, and detergent penetration during washing." },
              { img: IMG.detail2, cat: "Stain Removal", title: "Enzyme Detergents: The Science of Biological Stain Removal", desc: "How protease, lipase, and amylase enzymes break down protein, fat, and starch-based stains at molecular level." },
              { img: IMG.detail3, cat: "Sustainability", title: "Reducing Water Consumption in Commercial Laundry by 40%", desc: "A systematic review of bath ratio optimization, counterflow rinsing, and water reuse strategies validated in real facilities." },
            ].map((card) => (
              <div key={card.title} className="group cursor-pointer">
                <div className="aspect-[16/10] rounded-[8px] overflow-hidden mb-4">
                  <img src={card.img} alt={card.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <p className="text-[#4a7c59] text-[0.7rem] font-bold uppercase tracking-widest mb-1.5">{card.cat}</p>
                <h3 className="font-bold text-[#1c1c1c] text-sm leading-snug mb-2">{card.title}</h3>
                <p className="text-[#777] text-xs leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/articles" className="btn-dark">
              See All Articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </Shell>
  );
}
