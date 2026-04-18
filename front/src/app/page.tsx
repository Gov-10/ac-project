"use client";

import { useState } from "react";
import SignalPlot from "../components/SignalPlot";

export default function Home() {
  const [data, setData] = useState(null);
  const [fm, setFm] = useState(10);
  const [fc, setFc] = useState(100);
  const [snr, setSnr] = useState(10);
  const [mode, setMode] = useState("AM");

  const fetchSignal = async () => {
    const res = await fetch("http://localhost:8000/process-signal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fm: Number(fm),
        fc: Number(fc),
        snr_values: [Number(snr)],
      }),
    });
    const result = await res.json();
    setData(result);
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard}>
        <header style={styles.header}>
          <h1 style={styles.title}>Signal Visualizer</h1>
          <p style={styles.subtitle}>Adjust parameters to simulate real-time modulation</p>
        </header>

        {/* 🔧 CONTROLS SECTION */}
        <div style={styles.controlsGrid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Message Frequency ($f_m$)</label>
            <input
              type="number"
              value={fm}
              onChange={(e) => setFm(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Carrier Frequency ($f_c$)</label>
            <input
              type="number"
              value={fc}
              onChange={(e) => setFc(e.target.value)}
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
              <option value="AM">Amplitude Modulation (AM)</option>
              <option value="FM">Frequency Modulation (FM)</option>
            </select>
          </div>

          <div style={{ ...styles.inputGroup, gridColumn: "span 1" }}>
            <label style={styles.label}>Signal-to-Noise Ratio: <strong>{snr} dB</strong></label>
            <input
              type="range"
              min="0"
              max="30"
              value={snr}
              onChange={(e) => setSnr(e.target.value)}
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

// 🎨 STYLES OBJECT
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a", // Deep Navy
    backgroundImage: "radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)",
    padding: "40px 20px",
    fontFamily: "'Inter', system-ui, sans-serif",
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
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
  },
  header: {
    textAlign: "center",
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
  subtitle: {
    color: "#94a3b8",
    marginTop: "8px",
  },
  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.875rem",
    color: "#cbd5e1",
    fontWeight: "500",
  },
  input: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#1e293b",
    color: "white",
    fontSize: "1rem",
    outline: "none",
  },
  select: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#1e293b",
    color: "white",
    cursor: "pointer",
  },
  range: {
    width: "100%",
    cursor: "pointer",
    accentColor: "#38bdf8",
  },
  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#38bdf8",
    color: "#0f172a",
    fontSize: "1.1rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "transform 0.2s, background-color 0.2s",
    boxShadow: "0 4px 14px 0 rgba(56, 189, 248, 0.39)",
  },
  graphContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  graphCard: {
    background: "#ffffff",
    borderRadius: "12px",
    padding: "15px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.3s ease",
  },
};

