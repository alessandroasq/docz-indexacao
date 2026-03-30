import React, { useEffect, useState } from "react";

const LINES = [
  { w: "60%", delay: 0.1 },
  { w: "85%", delay: 0.25 },
  { w: "45%", delay: 0.4 },
  { w: "70%", delay: 0.55 },
  { w: "30%", delay: 0.7 },
  { w: "80%", delay: 0.85 },
  { w: "55%", delay: 1.0 },
];

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("enter"); // enter | scan | exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("scan"), 400);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(onDone, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.6s ease-in" : "opacity 0.4s ease-out",
      }}
    >
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating document cards in background */}
      {[
        { top: "12%", left: "8%",  rotate: "-8deg",  scale: 0.7, delay: "0.2s" },
        { top: "20%", right: "9%", rotate: "6deg",   scale: 0.65, delay: "0.35s" },
        { top: "62%", left: "6%",  rotate: "5deg",   scale: 0.6, delay: "0.5s" },
        { top: "58%", right: "7%", rotate: "-5deg",  scale: 0.68, delay: "0.15s" },
        { top: "78%", left: "22%", rotate: "-3deg",  scale: 0.55, delay: "0.45s" },
        { top: "10%", left: "35%", rotate: "4deg",   scale: 0.5, delay: "0.6s" },
      ].map((s, i) => (
        <div
          key={i}
          className="absolute rounded-md bg-slate-700/40 border border-slate-600/30"
          style={{
            top: s.top, left: s.left, right: s.right,
            width: 80, height: 100,
            transform: `rotate(${s.rotate}) scale(${s.scale})`,
            opacity: phase === "enter" ? 0 : 0.6,
            transition: `opacity 0.5s ease ${s.delay}`,
          }}
        >
          {[40, 65, 50, 75, 35].map((w, j) => (
            <div
              key={j}
              className="mx-2 mt-2 rounded-full bg-slate-500/50"
              style={{ height: 4, width: `${w}%`, marginTop: j === 0 ? 10 : 6 }}
            />
          ))}
        </div>
      ))}

      {/* Center stage */}
      <div className="relative flex flex-col items-center gap-8">

        {/* Logo + document preview side by side */}
        <div className="flex items-center gap-10">

          {/* Simulated document with scan beam */}
          <div
            className="relative rounded-xl overflow-hidden border border-slate-600/60 shadow-2xl"
            style={{
              width: 160, height: 210,
              background: "linear-gradient(180deg, #1e293b 0%, #172032 100%)",
              opacity: phase === "enter" ? 0 : 1,
              transform: phase === "enter" ? "translateX(-20px)" : "translateX(0)",
              transition: "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
            }}
          >
            {/* Page header bar */}
            <div className="w-full h-6 bg-blue-600/30 border-b border-blue-500/20 flex items-center px-3 gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-400/60" />
              <div className="h-1.5 rounded-full bg-blue-400/40" style={{ width: 60 }} />
            </div>

            {/* Text lines */}
            <div className="px-4 pt-3 flex flex-col gap-2">
              {LINES.map((line, i) => (
                <div
                  key={i}
                  className="rounded-full"
                  style={{
                    height: 5,
                    width: line.w,
                    background: "rgba(148,163,184,0.25)",
                    opacity: phase === "scan" || phase === "exit" ? 1 : 0,
                    transition: `opacity 0.3s ease ${line.delay}s`,
                  }}
                />
              ))}
            </div>

            {/* Scan beam */}
            {phase === "scan" && (
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{
                  height: 3,
                  background: "linear-gradient(90deg, transparent, #3b82f6, #60a5fa, #3b82f6, transparent)",
                  boxShadow: "0 0 12px 4px rgba(96,165,250,0.5)",
                  animation: "scanBeam 1.4s ease-in-out 0.3s forwards",
                }}
              />
            )}

            {/* Highlight boxes on lines (fields being extracted) */}
            {[1, 3, 6].map((lineIdx) => (
              <div
                key={lineIdx}
                className="absolute left-3 rounded"
                style={{
                  top: 40 + lineIdx * 23,
                  width: 90,
                  height: 8,
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  opacity: phase === "scan" || phase === "exit" ? 1 : 0,
                  transition: `opacity 0.3s ease ${0.6 + lineIdx * 0.15}s`,
                }}
              />
            ))}
          </div>

          {/* Logo */}
          <div
            className="flex flex-col items-center gap-3"
            style={{
              opacity: phase === "enter" ? 0 : 1,
              transform: phase === "enter" ? "translateY(12px)" : "translateY(0)",
              transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
            }}
          >
            {/* Icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                boxShadow: "0 0 40px rgba(37,99,235,0.5), 0 0 80px rgba(37,99,235,0.2)",
              }}
            >
              <span className="text-white font-black text-4xl leading-none" style={{ fontFamily: "Inter, sans-serif" }}>D</span>
            </div>

            {/* Name */}
            <div className="text-center">
              <div
                className="text-white font-black tracking-tight"
                style={{ fontSize: 42, lineHeight: 1, letterSpacing: "-2px" }}
              >
                DocZ
              </div>
              <div className="text-slate-400 text-sm font-medium tracking-widest uppercase mt-1">
                Indexação de Documentos
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="w-64 h-0.5 rounded-full overflow-hidden bg-slate-700"
          style={{
            opacity: phase === "enter" ? 0 : 1,
            transition: "opacity 0.4s ease 0.4s",
          }}
        >
          <div
            className="h-full rounded-full bg-blue-500"
            style={{
              width: phase === "scan" || phase === "exit" ? "100%" : "0%",
              transition: "width 1.6s cubic-bezier(0.4,0,0.2,1) 0.5s",
              boxShadow: "0 0 8px rgba(59,130,246,0.8)",
            }}
          />
        </div>

        {/* Version */}
        <div
          className="text-slate-600 text-xs font-mono tracking-wide"
          style={{
            opacity: phase === "scan" || phase === "exit" ? 1 : 0,
            transition: "opacity 0.4s ease 1s",
          }}
        >
          v1.0.0 · GDF · {new Date().getFullYear()}
        </div>
      </div>

      <style>{`
        @keyframes scanBeam {
          from { top: 28px; }
          to   { top: 195px; }
        }
      `}</style>
    </div>
  );
}
