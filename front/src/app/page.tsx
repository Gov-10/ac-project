"use client";

import { useState, CSSProperties } from "react";
import SignalPlot from "../components/SignalPlot";

// --- 1. Define the Data Shape for TypeScript ---
interface SignalResult {
  noisy_am: number[];
  noisy_fm: number[];
  snr_am: number;
  snr_fm: number;
}

interface SignalData {
  time: number[];
  message: number[];
  am: number[];
  fm: number[];
  results: SignalResult[];
}

export default function Home() {
  // --- 2. State Management ---
  const [data, setData] = useState<SignalData | null>(null);
  const [fm, setFm] = useState<number>(10);
  const [fc, setFc] = useState<number>(100);
  const [snr, setSnr] = useState<number>(10);
  const [mode, setMode] = useState<string>("AM");

  // NEW: Manual signal states
  const [useManualSignal, setUseManualSignal] = useState<boolean>(false);
  const [manualSignalStr, setManualSignalStr] = useState<string>("1, 0, -1, 0, 1");

  const fetchSignal = async () => {
    // Convert text "1, 0, -1" into array [1, 0, -1]
    let customSignal: number[] | null = null;
    if (useManualSignal) {
      customSignal = manualSignalStr
        .split(",")
        .map((val) => Number(val.trim()))
        .filter((val) => !isNaN(val));
    }

    const res = await fetch("https://ac-project-theta.vercel.app/process-signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fm,
        fc,
        snr_values: [snr],
        signal: customSignal, // This maps to "signal" in your main.py
      }),
    });
    const result: SignalData = await res.json();
    setData(result);
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <header style={styles.header}>
          <h1 style={styles.title}>Signal Visualizer</h1>
          <p style={styles.subtitle}>Adjust parameters or provide a custom signal array</p>
        </header>

        {/* 🔧 CONTROLS SECTION */}
        <div style={styles.controlsGrid}>
          {/* Signal Source Switcher */}
          <div style={{ ...styles.inputGroup, gridColumn: "span 2" }}>
            <label style={styles.label}>Signal Source</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button 
                onClick={() => setUseManualSignal(false)}
                style={!useManualSignal ? styles.activeTab : styles.tab}
              >Sine Wave (Auto)</button>
              <button 
                onClick={() => setUseManualSignal(true)}
                style={useManualSignal ? styles.activeTab : styles.tab}
              >Custom Array (Manual)</button>
            </div>
          </div>

          {!useManualSignal ? (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Message Freq ($f_m$)</label>
              <input
                type="number"
                value={fm}
                onChange={(e) => setFm(Number(e.target.value))}
                style={styles.input}
              />
            </div>
          ) : (
            <div style={{ ...styles.inputGroup, gridColumn: "span 1" }}>
              <label style={styles.label}>Manual Signal (comma separated)</label>
              <input
                type="text"
                value={manualSignalStr}
                onChange={(e) => setManualSignalStr(e.target.value)}
                style={styles.input}
                placeholder="1, 0.5, -0.5, -1"
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Carrier Freq ($f_c$)</label>
            <input
              type="number"
              value={fc}
              onChange={(e) => setFc(Number(e.target.value))}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Modulation Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={styles.select}
            >
              <option value="AM">AM</option>
              <option value="FM">FM</option>
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>SNR: <strong>{snr} dB</strong></label>
            <input
              type="range" min="0" max="30"
              value={snr}
              onChange={(e) => setSnr(Number(e.target.value))}
              style={styles.range}
            />
          </div>
        </div>

        <button onClick={fetchSignal} style={styles.button}>
          Generate Signal Waves
        </button>
      </div>

      {/* 📊 GRAPHS SECTION */}
      {data && (
        <div style={styles.graphContainer}>
          <div style={styles.graphCard}>
            <SignalPlot time={data.time} data={data.message} title="Message Signal" />
          </div>
          {mode === "AM" ? (
            <>
              <div style={styles.graphCard}>
                <SignalPlot time={data.time} data={data.am} title="Clean AM Carrier" />
              </div>
              <div style={styles.graphCard}>
                <SignalPlot 
                  time={data.time} 
                  data={data.results[0].noisy_am} 
                  title={`Noisy AM Signal (${snr} dB)`} 
                />
              </div>
            </>
          ) : (
            <>
              <div style={styles.graphCard}>
                <SignalPlot time={data.time} data={data.fm} title="Clean FM Carrier" />
              </div>
              <div style={styles.graphCard}>
                <SignalPlot 
                  time={data.time} 
                  data={data.results[0].noisy_fm} 
                  title={`Noisy FM Signal (${snr} dB)`} 
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// --- 3. Styles (Correctly typed for TypeScript) ---
const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    backgroundImage: "radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)",
    padding: "40px 20px",
    fontFamily: "'Inter', sans-serif",
    color: "#f8fafc",
  },
  glassCard: {
    maxWidth: "900px",
    margin: "0 auto 30px auto",
    padding: "30px",
    background: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  },
  header: {
    textAlign: "center", // This no longer errors!
    marginBottom: "30px",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "800",
    background: "linear-gradient(90deg, #38bdf8, #818cf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    margin: "0",
  },
  subtitle: { color: "#94a3b8", marginTop: "8px" },
  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "0.875rem", color: "#cbd5e1" },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#1e293b",
    color: "white",
  },
  select: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#1e293b",
    color: "white",
  },
  range: { accentColor: "#38bdf8" },
  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#38bdf8",
    color: "#0f172a",
    fontWeight: "700",
    cursor: "pointer",
  },
  tab: {
    flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #334155", 
    backgroundColor: "transparent", color: "#94a3b8", cursor: "pointer"
  },
  activeTab: {
    flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #38bdf8", 
    backgroundColor: "rgba(56, 189, 248, 0.1)", color: "#38bdf8", cursor: "pointer"
  },
  graphContainer: { maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" },
  graphCard: { background: "#ffffff", borderRadius: "12px", padding: "15px" },
};
