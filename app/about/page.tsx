export const metadata = {
  title: "About — China Travel Guide",
  description:
    "Why this guide exists: practical, verified, action-first help for foreigners in China.",
};

export default function AboutPage() {
  return (
    <div className="container-page py-12 md:py-16 max-w-3xl">
      <h1 className="text-3xl md:text-5xl font-bold mb-6">About China Travel Guide</h1>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">Why this exists</h2>
        <p className="text-[var(--text-muted)] mb-3">
          China is an amazing country — but it's also full of things that trip
          up first-time visitors. Google doesn't work. Your Visa card might get
          declined. The subway has 20+ lines. You need Alipay or WeChat Pay to
          buy almost anything.
        </p>
        <p className="text-[var(--text-muted)]">
          Most travel content about China is either destination inspiration
          (beautiful photos, must-see lists) or written for people who already
          live there. We built this for <strong>you</strong> — the foreign
          traveler who just landed and needs to figure things out.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">How we're different</h2>
        <ul className="space-y-3">
          {[
            ["Action-first", "Not long articles. Short, specific steps. Do this, then that."],
            ["Verified information", "Every guide shows when it was last checked and where the info comes from."],
            ["Problem Solver", "Got a problem? Our diagnostic tree helps you fix it step by step — no chatbot hallucinations."],
            ["Foreign perspective", "We don't assume you know how Alipay works or what a WeChat QR code looks like."],
            ["Mobile-friendly", "Designed for phones because that's what you'll actually use in China."],
          ].map(([title, desc]) => (
            <li key={title} className="p-4 rounded-lg bg-[var(--card-bg)] border border-[var(--border)]">
              <strong>{title}</strong> — <span className="text-[var(--text-muted)]">{desc}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-3">Our content is verified</h2>
        <p className="text-[var(--text-muted)] mb-3">
          China's digital ecosystem changes fast. Alipay updates its foreign card
          support. Metro payment rules shift. App stores change what's available.
        </p>
        <p className="text-[var(--text-muted)]">
          Every guide on this site shows a <strong>last verified date</strong> and links
          to the <strong>official sources</strong> we used. If you spot something that's
          out of date — please let us know.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-3">A few words of caution</h2>
        <ul className="text-[var(--text-muted)] space-y-2">
          <li>• Information here is for reference only. Always check official sources for critical decisions like visa requirements.</li>
          <li>• We're not responsible if something changes after publication — the China digital ecosystem moves fast.</li>
          <li>• In emergencies, dial <strong>110</strong> (police) or <strong>120</strong> (ambulance). Hotel staff can help with translation.</li>
        </ul>
      </section>
    </div>
  );
}
