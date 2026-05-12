// src/components/layout/Footer.tsx
import Link from "next/link";

const LINKS = {
  Movies:    ["Hindi Movies","Telugu Movies","Tamil Movies","Malayalam Movies","Kannada Movies","Top Rated"],
  Platforms: ["Netflix India","Prime Video","Disney+ Hotstar","ZEE5","SonyLIV","JioCinema"],
  Company:   ["About IMR","How AI Works","API Access","Advertise","Contact","Sitemap"],
};

export default function Footer() {
  return (
    <footer className="bg-[#070B13] border-t border-border mt-20">
      <div className="max-w-[1400px] mx-auto px-[5%] py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-1 font-heading font-extrabold text-xl mb-4">
              <span className="text-gold">I</span>MR
              <span className="bg-gold text-bg text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest ml-1">AI</span>
            </div>
            <p className="text-muted text-sm leading-relaxed mb-5">
              India's first fully automated AI movie review platform. Real-time
              ratings powered by public sentiment analysis across 5 languages.
            </p>
            <div className="flex flex-wrap gap-2">
              {["हिन्दी","తెలుగు","தமிழ்","മലയാളം","ಕನ್ನಡ"].map((l) => (
                <span
                  key={l}
                  className="text-[11px] text-muted border border-border bg-white/3 px-2.5 py-1 rounded-full font-medium"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([heading, links]) => (
            <div key={heading}>
              <div className="text-xs font-bold text-white uppercase tracking-widest mb-4">
                {heading}
              </div>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l}>
                    <Link href="#" className="text-muted hover:text-white text-sm transition-colors">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-muted text-sm">
            © {new Date().getFullYear()}{" "}
            <span className="text-gold font-semibold">IMR</span> — India Movie Reviews.
            AI ratings based on public sentiment.
          </p>
          <div className="flex gap-5">
            {["Privacy","Terms","Cookie Policy"].map((l) => (
              <Link key={l} href="#" className="text-muted hover:text-white text-sm transition-colors">
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}