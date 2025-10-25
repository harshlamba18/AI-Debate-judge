"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Scale, Brain, Shield, Zap } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4f9ff] via-white to-[#f3e8ff]">
      <nav className="bg-white/60 backdrop-blur-sm border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => router.push("/")}
            >
              <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 shadow-md">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-gray-900">
                  AI Debate Judge
                </span>
                <div className="text-xs text-gray-500 -mt-0.5">Fair. Fast. Verifiable.</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/login")}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/register")}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold shadow hover:scale-[1.01] transform transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* HERO */}
        <section className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight text-gray-900">
              The Future of{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                Fair Debates
              </span>
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl">
              Experience unbiased, AI-powered debate judging on a transparent Web3 platform.
              Every verdict is immutable, auditable, and recorded on-chain for trust and
              accountability.
            </p>

            <div className="flex flex-wrap gap-4 mt-4">
              <button
                onClick={() => router.push("/register")}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white text-lg font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-0.5 transition"
              >
                Start Debating Now
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-3 rounded-lg border border-gray-200 bg-white/60 backdrop-blur-sm text-gray-800 font-medium hover:scale-[1.01] transition"
              >
                Browse Debates
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <StatBadge title="AI Judging" subtitle="Automated & consistent" />
              <StatBadge title="Blockchain" subtitle="Immutable verdicts" />
              <StatBadge title="Real-time" subtitle="Live debates & updates" />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl p-8 bg-white/70 backdrop-blur-md border border-white/40 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Live demo</h3>
                  <p className="text-sm text-gray-500">Sample debate snapshot</p>
                </div>
                <div className="text-xs text-gray-500">Beta</div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-sm font-semibold text-gray-800">Side A</p>
                    <p className="text-xs text-gray-500 mt-1">For</p>
                    <p className="text-sm text-gray-700 mt-3">Alice • Bob</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
                    <p className="text-sm font-semibold text-gray-800">Side B</p>
                    <p className="text-xs text-gray-500 mt-1">Against</p>
                    <p className="text-sm text-gray-700 mt-3">Charlie • Dana</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-600">Topic</p>
                  <h4 className="text-md font-semibold text-gray-900 mt-1">
                    Is AI beneficial for society?
                  </h4>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg font-medium">
                    Join Demo
                  </button>
                  <button className="px-4 py-2 border border-gray-200 rounded-lg bg-white/60">
                    Details
                  </button>
                </div>
              </div>
            </div>

            <div className="absolute -right-6 -bottom-6 w-40 h-40 rounded-full bg-gradient-to-br from-blue-300 to-violet-300 opacity-30 blur-3xl pointer-events-none" />
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-2">
              Built for fairness, transparency, and ease — whether you’re hosting a rapid debate
              or a formal adjudication.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Brain className="w-10 h-10" />}
              title="AI-Powered Judging"
              description="Models evaluate clarity, logic, and persuasiveness automatically."
              accent="from-blue-500 to-blue-700"
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Blockchain Verified"
              description="Verdicts are recorded immutably for audit and trust."
              accent="from-green-500 to-green-600"
            />
            <FeatureCard
              icon={<Zap className="w-10 h-10" />}
              title="Real-Time Debates"
              description="Engage live with immediate updates and argument flow."
              accent="from-purple-500 to-purple-700"
            />
            <FeatureCard
              icon={<Scale className="w-10 h-10" />}
              title="Fair & Unbiased"
              description="Consistent evaluations remove human bias and variance."
              accent="from-orange-400 to-orange-600"
            />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-12">
          <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-900 text-center mb-6">How It Works</h3>

            <div className="grid gap-6 md:grid-cols-3">
              <Step number="1" title="Create or Join" description="Start a new debate or join an existing one." />
              <Step number="2" title="Present Arguments" description="Take turns presenting arguments and rebuttals." />
              <Step number="3" title="AI Judges" description="AI evaluates and publishes the verdict on-chain." />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">AI Debate Judge</div>
              <div className="text-xs text-gray-300">Built for SETs IntraSoc Hackathon • 2025</div>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            &copy; 2025 AI Debate Judge. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

/* --- small presentational subcomponents (no logic changes) --- */

function StatBadge({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="px-3 py-2 bg-white/60 backdrop-blur-sm border border-white/30 rounded-full text-sm flex items-center gap-3 shadow-sm">
      <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-violet-500 text-white">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="font-semibold text-gray-800">{title}</div>
        <div className="text-xs text-gray-600 -mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, accent }: any) {
  return (
    <div className="p-6 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 shadow hover:shadow-xl transition">
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg mb-4 bg-gradient-to-br ${accent} text-white shadow-sm`}>
        {icon}
      </div>
      <h4 className="text-lg font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: any) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow">
        {number}
      </div>
      <h5 className="text-lg font-semibold text-gray-900 mb-1">{title}</h5>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
