'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { AlertCircle, Zap, BarChart3 } from 'lucide-react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface SignalResponse {
  time: number[];
  message: number[];
  am: number[];
  fm: number[];
  results: Array<{
    snr_input: number;
    snr_am: number;
    snr_fm: number;
    noisy_am: number[];
    noisy_fm: number[];
  }>;
}

export default function SignalProcessor() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SignalResponse | null>(null);
  const [selectedSNR, setSelectedSNR] = useState(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'am' | 'fm' | 'analysis'>('overview');
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState({
    signal: null as number[] | null,
    fs: 1000,
    duration: 1.0,
    fm: 10,
    fc: 100,
    Am: 1,
    Ac: 1,
    kf: 50,
    snr_values: [0, 5, 10, 20],
  });

  const [signalInputMode, setSignalInputMode] = useState<'sine' | 'file' | 'manual'>('sine');
  const [manualSignalText, setManualSignalText] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileError(null);
    try {
      const text = await file.text();
      
      // Try to parse as CSV, JSON, or space/comma separated values
      let signal: number[] = [];
      
      if (file.name.endsWith('.json')) {
        signal = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        // Parse CSV - can be single column or multiple columns
        const lines = text.trim().split('\n');
        signal = lines
          .map(line => parseFloat(line.split(',')[0]))
          .filter(val => !isNaN(val));
      } else {
        // Try to parse as space, comma, or newline separated values
        signal = text
          .split(/[\s,\n]+/)
          .map(val => parseFloat(val))
          .filter(val => !isNaN(val));
      }

      if (signal.length === 0) {
        throw new Error('No valid numeric values found in file');
      }

      setConfig(prev => ({ ...prev, signal }));
      setSignalInputMode('file');
      setFileError(null);
    } catch (err) {
      setFileError(`Failed to parse file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleManualSignalInput = () => {
    try {
      const signal = manualSignalText
        .split(/[\s,\n]+/)
        .map(val => parseFloat(val))
        .filter(val => !isNaN(val));

      if (signal.length === 0) {
        throw new Error('No valid numeric values found');
      }

      setConfig(prev => ({ ...prev, signal }));
      setSignalInputMode('manual');
      setFileError(null);
    } catch (err) {
      setFileError(`Failed to parse signal: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleProcessSignal = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://ac-project-theta.vercel.app/process-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error('Failed to process signal');
      const result = await response.json();
      setData(result);
      setSelectedSNR(0);
      setActiveTab('overview');
    } catch (error) {
      setError('Failed to connect to backend. Make sure the server is running on http://localhost:8000');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentResult = data?.results[selectedSNR];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0a0e27' }}>
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(at 20% 50%, #00ff88 0px, transparent 50%), 
                              radial-gradient(at 80% 80%, #0088ff 0px, transparent 50%)`,
            animation: 'drift 8s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, -30px); }
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pulse-border {
          0%, 100% { border-color: rgba(0, 255, 136, 0.2); }
          50% { border-color: rgba(0, 255, 136, 0.5); }
        }

        .animate-slide-in-down {
          animation: slideInDown 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        .tech-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #00ff88;
          font-weight: 600;
        }

        .tech-subtitle {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.85rem;
          color: #a0adc4;
          letter-spacing: 0.05em;
        }

        .plot-container {
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(10px);
          padding: 1.5rem;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }

        .plot-container:hover {
          border-color: rgba(0, 255, 136, 0.4);
          background: rgba(15, 23, 42, 0.9);
        }

        .control-panel {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(25, 35, 65, 0.6) 100%);
          border: 1px solid rgba(0, 255, 136, 0.15);
          border-radius: 12px;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }

        .input-field {
          background: rgba(30, 41, 82, 0.5);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 6px;
          padding: 0.75rem 1rem;
          color: #e0e9ff;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: #00ff88;
          box-shadow: 0 0 12px rgba(0, 255, 136, 0.3);
          background: rgba(30, 41, 82, 0.8);
        }

        .input-field::placeholder {
          color: rgba(160, 173, 196, 0.5);
        }

        .btn-primary {
          background: linear-gradient(135deg, #00ff88 0%, #00cc6f 100%);
          color: #0a0e27;
          border: none;
          border-radius: 8px;
          padding: 0.875rem 1.75rem;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 255, 136, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 255, 136, 0.5);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tab-button {
          position: relative;
          background: transparent;
          border: none;
          color: #a0adc4;
          padding: 1rem 1.5rem;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-button.active {
          color: #00ff88;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00ff88 0%, transparent 100%);
        }

        .snr-chip {
          display: inline-block;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 6px;
          padding: 0.6rem 1.2rem;
          margin: 0.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.85rem;
          color: #a0adc4;
        }

        .snr-chip.active {
          background: rgba(0, 255, 136, 0.2);
          border-color: #00ff88;
          color: #00ff88;
          box-shadow: 0 0 12px rgba(0, 255, 136, 0.3);
        }

        .snr-chip:hover {
          border-color: #00ff88;
          color: #00ff88;
        }

        .info-box {
          background: rgba(0, 150, 255, 0.1);
          border-left: 3px solid #0099ff;
          border-radius: 6px;
          padding: 1rem;
          margin: 1.5rem 0;
          font-size: 0.9rem;
          color: #a0d4ff;
          line-height: 1.6;
        }

        .info-title {
          color: #0099ff;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 600;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
        }

        .stat-card {
          background: rgba(30, 41, 82, 0.5);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 8px;
          padding: 1.25rem;
          margin-bottom: 1rem;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          border-color: rgba(0, 255, 136, 0.4);
          background: rgba(30, 41, 82, 0.8);
        }

        .stat-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 0.75rem;
          color: #a0adc4;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 1.5rem;
          color: #00ff88;
          font-weight: 600;
          font-family: 'IBM Plex Mono', monospace;
          letter-spacing: -0.02em;
        }

        .error-box {
          background: rgba(255, 100, 100, 0.1);
          border-left: 3px solid #ff6464;
          border-radius: 6px;
          padding: 1rem;
          margin: 1.5rem 0;
          font-size: 0.9rem;
          color: #ff9999;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        h1, h2, h3 {
          margin: 0;
        }
      `}
      </style>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-opacity-10 border-cyan-400 backdrop-blur-sm animate-slide-in-down">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-green-400 flex items-center justify-center">
                <Zap size={20} className="text-gray-900" />
              </div>
              <span className="tech-label">Signal Processing Lab</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 mb-3">
              AWGN Signal Analyzer
            </h1>
            <p className="tech-subtitle max-w-3xl">
              Additive White Gaussian Noise simulation & analysis for AM/FM modulation schemes
            </p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          {/* Control Panel */}
          <div className="control-panel animate-fade-in mb-10" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xl font-bold text-green-400 mb-6 flex items-center gap-2">
              <BarChart3 size={20} />
              Signal Configuration
            </h2>

            {/* Signal Input Mode Selector */}
            <div className="mb-8 pb-8 border-b border-opacity-20 border-cyan-400">
              <p className="tech-label mb-4">Input Signal Type</p>
              <div className="flex flex-wrap gap-3 mb-6">
                {(['sine', 'file', 'manual'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSignalInputMode(mode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      signalInputMode === mode
                        ? 'bg-green-400 text-gray-900 shadow-lg shadow-green-400/50'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {mode === 'sine' && '📈 Sine Wave'}
                    {mode === 'file' && '📁 Upload File'}
                    {mode === 'manual' && '✏️ Manual Input'}
                  </button>
                ))}
              </div>

              {/* File Upload */}
              {signalInputMode === 'file' && (
                <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                  <label className="tech-label block mb-3">Upload Signal File (JSON, CSV, or text)</label>
                  <input
                    type="file"
                    accept=".json,.csv,.txt"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 bg-blue-950 border border-blue-500/30 rounded text-blue-300 cursor-pointer"
                  />
                  <p className="tech-subtitle mt-2">Supports JSON arrays, CSV files, or space/comma-separated values</p>
                  {config.signal && signalInputMode === 'file' && (
                    <div className="mt-3 text-green-400 font-semibold">
                      ✓ Loaded {config.signal.length} signal samples
                    </div>
                  )}
                </div>
              )}

              {/* Manual Input */}
              {signalInputMode === 'manual' && (
                <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500/50 rounded-lg">
                  <label className="tech-label block mb-3">Enter Signal Values</label>
                  <textarea
                    value={manualSignalText}
                    onChange={(e) => setManualSignalText(e.target.value)}
                    placeholder="Enter values separated by spaces, commas, or newlines&#10;Example: 0.1 0.5 0.9 0.7 0.2"
                    className="input-field w-full h-24 font-mono text-sm resize-none"
                    disabled={loading}
                  />
                  <button
                    onClick={handleManualSignalInput}
                    className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold transition-all"
                  >
                    Parse Signal
                  </button>
                  {config.signal && signalInputMode === 'manual' && (
                    <div className="mt-3 text-green-400 font-semibold">
                      ✓ Loaded {config.signal.length} signal samples
                    </div>
                  )}
                </div>
              )}

              {/* Sine Wave Options */}
              {signalInputMode === 'sine' && (
                <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
                  <p className="tech-subtitle">Default sine wave signal will be generated based on parameters below</p>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, signal: null }))}
                    className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-semibold transition-all"
                  >
                    Reset to Sine Wave
                  </button>
                </div>
              )}

              {fileError && (
                <div className="error-box">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <div>{fileError}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="tech-label block mb-2">Sampling Freq (Hz)</label>
                <input
                  type="number"
                  className="input-field w-full"
                  value={config.fs}
                  onChange={(e) => setConfig({ ...config, fs: Number(e.target.value) })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="tech-label block mb-2">Duration (s)</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field w-full"
                  value={config.duration}
                  onChange={(e) => setConfig({ ...config, duration: Number(e.target.value) })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="tech-label block mb-2">Message Freq (Hz)</label>
                <input
                  type="number"
                  className="input-field w-full"
                  value={config.fm}
                  onChange={(e) => setConfig({ ...config, fm: Number(e.target.value) })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="tech-label block mb-2">Carrier Freq (Hz)</label>
                <input
                  type="number"
                  className="input-field w-full"
                  value={config.fc}
                  onChange={(e) => setConfig({ ...config, fc: Number(e.target.value) })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div>
                <label className="tech-label block mb-2">Message Amplitude</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field w-full"
                  value={config.Am}
                  onChange={(e) => setConfig({ ...config, Am: Number(e.target.value) })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="tech-label block mb-2">Carrier Amplitude</label>
                <input
                  type="number"
                  step="0.1"
                  className="input-field w-full"
                  value={config.Ac}
                  onChange={(e) => setConfig({ ...config, Ac: Number(e.target.value) })}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="tech-label block mb-2">Frequency Sensitivity</label>
                <input
                  type="number"
                  className="input-field w-full"
                  value={config.kf}
                  onChange={(e) => setConfig({ ...config, kf: Number(e.target.value) })}
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleProcessSignal}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Processing...' : 'Process Signal'}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-box">
                <AlertCircle size={20} className="flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            <div className="info-box">
              <div className="info-title">⚡ About This Tool</div>
              <p>
                This simulator demonstrates how AWGN affects AM (Amplitude Modulation) and FM (Frequency Modulation) 
                signals at different SNR levels. Process your signal to visualize the impact of noise on both modulation schemes.
              </p>
            </div>
          </div>

          {/* Results Section */}
          {data && (
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {/* Tab Navigation */}
              <div className="border-b border-opacity-20 border-cyan-400 mb-8 overflow-x-auto">
                <div className="flex">
                  {(['overview', 'am', 'fm', 'analysis'] as const).map((tab) => (
                    <button
                      key={tab}
                      className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'overview' && 'Overview'}
                      {tab === 'am' && 'AM Analysis'}
                      {tab === 'fm' && 'FM Analysis'}
                      {tab === 'analysis' && 'SNR Comparison'}
                    </button>
                  ))}
                </div>
              </div>

              {/* SNR Selection */}
              <div className="mb-8">
                <p className="tech-label mb-3">Select SNR Level (dB)</p>
                <div className="flex flex-wrap">
                  {data.results.map((result, idx) => (
                    <button
                      key={idx}
                      className={`snr-chip ${selectedSNR === idx ? 'active' : ''}`}
                      onClick={() => setSelectedSNR(idx)}
                    >
                      SNR = {result.snr_input} dB
                    </button>
                  ))}
                </div>
              </div>

              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="plot-container">
                    <h3 className="tech-label mb-4">Message Signal</h3>
                    <Plot
                      data={[
                        {
                          x: data.time,
                          y: data.message,
                          type: 'scatter',
                          mode: 'lines',
                          line: { color: '#00ff88', width: 2 },
                          name: 'Message',
                          hoverinfo: 'x+y',
                        },
                      ]}
                      layout={{
                        margin: { l: 50, r: 50, t: 30, b: 50 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(30,41,82,0.2)',
                        xaxis: {
                          showgrid: true,
                          gridcolor: 'rgba(0,255,136,0.1)',
                          color: '#a0adc4',
                          title: 'Time (s)',
                        },
                        yaxis: {
                          showgrid: true,
                          gridcolor: 'rgba(0,255,136,0.1)',
                          color: '#a0adc4',
                          title: 'Amplitude',
                        },
                        font: { family: 'IBM Plex Mono, monospace', color: '#a0adc4' },
                        responsive: true,
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ height: '300px' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="plot-container">
                      <h3 className="tech-label mb-4">AM Signal (Clean)</h3>
                      <Plot
                        data={[
                          {
                            x: data.time.slice(0, Math.min(500, data.time.length)),
                            y: data.am.slice(0, Math.min(500, data.am.length)),
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#0099ff', width: 1.5 },
                            name: 'AM Signal',
                          },
                        ]}
                        layout={{
                          margin: { l: 50, r: 50, t: 30, b: 50 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(30,41,82,0.2)',
                          xaxis: {
                            showgrid: true,
                            gridcolor: 'rgba(0,153,255,0.1)',
                            color: '#a0adc4',
                            title: 'Time (s)',
                          },
                          yaxis: {
                            showgrid: true,
                            gridcolor: 'rgba(0,153,255,0.1)',
                            color: '#a0adc4',
                          },
                          font: { family: 'IBM Plex Mono, monospace', color: '#a0adc4' },
                          responsive: true,
                        }}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ height: '300px' }}
                      />
                    </div>

                    <div className="plot-container">
                      <h3 className="tech-label mb-4">FM Signal (Clean)</h3>
                      <Plot
                        data={[
                          {
                            x: data.time.slice(0, Math.min(500, data.time.length)),
                            y: data.fm.slice(0, Math.min(500, data.fm.length)),
                            type: 'scatter',
                            mode: 'lines',
                            line: { color: '#ff6b9d', width: 1.5 },
                            name: 'FM Signal',
                          },
                        ]}
                        layout={{
                          margin: { l: 50, r: 50, t: 30, b: 50 },
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          plot_bgcolor: 'rgba(30,41,82,0.2)',
                          xaxis: {
                            showgrid: true,
                            gridcolor: 'rgba(255,107,157,0.1)',
                            color: '#a0adc4',
                            title: 'Time (s)',
                          },
                          yaxis: {
                            showgrid: true,
                            gridcolor: 'rgba(255,107,157,0.1)',
                            color: '#a0adc4',
                          },
                          font: { family: 'IBM Plex Mono, monospace', color: '#a0adc4' },
                          responsive: true,
                        }}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ height: '300px' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* AM Tab */}
              {activeTab === 'am' && currentResult && (
                <div className="space-y-8">
                  <div className="plot-container">
                    <h3 className="tech-label mb-4">AM Signal with AWGN (SNR = {currentResult.snr_input} dB)</h3>
                    <Plot
                      data={[
                        {
                          x: data.time.slice(0, Math.min(500, data.time.length)),
                          y: data.am.slice(0, Math.min(500, data.am.length)),
                          type: 'scatter',
                          mode: 'lines',
                          line: { color: 'rgba(0,255,136,0.4)', width: 2 },
                          name: 'Clean Signal',
                        },
                        {
                          x: data.time.slice(0, Math.min(500, data.time.length)),
                          y: currentResult.noisy_am.slice(0, Math.min(500, currentResult.noisy_am.length)),
                          type: 'scatter',
                          mode: 'lines',
                          line: { color: '#0099ff', width: 1.5 },
                          name: 'With Noise',
                        },
                      ]}
                      layout={{
                        margin: { l: 50, r: 50, t: 30, b: 50 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(30,41,82,0.2)',
                        xaxis: {
                          showgrid: true,
                          gridcolor: 'rgba(0,153,255,0.1)',
                          color: '#a0adc4',
                          title: 'Time (s)',
                        },
                        yaxis: {
                          showgrid: true,
                          gridcolor: 'rgba(0,153,255,0.1)',
                          color: '#a0adc4',
                          title: 'Amplitude',
                        },
                        font: { family: 'IBM Plex Mono, monospace', color: '#a0adc4' },
                        responsive: true,
                        legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(0,0,0,0.7)', bordercolor: '#0099ff', borderwidth: 1 },
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ height: '400px' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="stat-card">
                      <div className="stat-label">SNR (Input)</div>
                      <div className="stat-value">{currentResult.snr_input} dB</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">SNR (Measured)</div>
                      <div className="stat-value">{currentResult.snr_am.toFixed(2)} dB</div>
                    </div>
                  </div>
                </div>
              )}

              {/* FM Tab */}
              {activeTab === 'fm' && currentResult && (
                <div className="space-y-8">
                  <div className="plot-container">
                    <h3 className="tech-label mb-4">FM Signal with AWGN (SNR = {currentResult.snr_input} dB)</h3>
                    <Plot
                      data={[
                        {
                          x: data.time.slice(0, Math.min(500, data.time.length)),
                          y: data.fm.slice(0, Math.min(500, data.fm.length)),
                          type: 'scatter',
                          mode: 'lines',
                          line: { color: 'rgba(0,255,136,0.4)', width: 2 },
                          name: 'Clean Signal',
                        },
                        {
                          x: data.time.slice(0, Math.min(500, data.time.length)),
                          y: currentResult.noisy_fm.slice(0, Math.min(500, currentResult.noisy_fm.length)),
                          type: 'scatter',
                          mode: 'lines',
                          line: { color: '#ff6b9d', width: 1.5 },
                          name: 'With Noise',
                        },
                      ]}
                      layout={{
                        margin: { l: 50, r: 50, t: 30, b: 50 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(30,41,82,0.2)',
                        xaxis: {
                          showgrid: true,
                          gridcolor: 'rgba(255,107,157,0.1)',
                          color: '#a0adc4',
                          title: 'Time (s)',
                        },
                        yaxis: {
                          showgrid: true,
                          gridcolor: 'rgba(255,107,157,0.1)',
                          color: '#a0adc4',
                          title: 'Amplitude',
                        },
                        font: { family: 'IBM Plex Mono, monospace', color: '#a0adc4' },
                        responsive: true,
                        legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(0,0,0,0.7)', bordercolor: '#ff6b9d', borderwidth: 1 },
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ height: '400px' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="stat-card">
                      <div className="stat-label">SNR (Input)</div>
                      <div className="stat-value">{currentResult.snr_input} dB</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">SNR (Measured)</div>
                      <div className="stat-value">{currentResult.snr_fm.toFixed(2)} dB</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis Tab */}
              {activeTab === 'analysis' && (
                <div className="space-y-8">
                  <div className="plot-container">
                    <h3 className="tech-label mb-4">SNR Comparison: AM vs FM</h3>
                    <Plot
                      data={[
                        {
                          x: data.results.map((r) => `${r.snr_input} dB`),
                          y: data.results.map((r) => r.snr_am),
                          type: 'scatter',
                          mode: 'lines+markers',
                          line: { color: '#0099ff', width: 3 },
                          marker: { size: 10, color: '#0099ff', symbol: 'circle' },
                          name: 'AM SNR',
                        },
                        {
                          x: data.results.map((r) => `${r.snr_input} dB`),
                          y: data.results.map((r) => r.snr_fm),
                          type: 'scatter',
                          mode: 'lines+markers',
                          line: { color: '#ff6b9d', width: 3 },
                          marker: { size: 10, color: '#ff6b9d', symbol: 'square' },
                          name: 'FM SNR',
                        },
                      ]}
                      layout={{
                        margin: { l: 50, r: 50, t: 30, b: 50 },
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        plot_bgcolor: 'rgba(30,41,82,0.2)',
                        xaxis: {
                          showgrid: true,
                          gridcolor: 'rgba(0,255,136,0.1)',
                          color: '#a0adc4',
                          title: 'Input SNR',
                        },
                        yaxis: {
                          showgrid: true,
                          gridcolor: 'rgba(0,255,136,0.1)',
                          color: '#a0adc4',
                          title: 'Output SNR (dB)',
                        },
                        font: { family: 'IBM Plex Mono, monospace', color: '#a0adc4' },
                        responsive: true,
                        legend: { x: 0.02, y: 0.98, bgcolor: 'rgba(0,0,0,0.7)', bordercolor: '#00ff88', borderwidth: 1 },
                      }}
                      config={{ responsive: true, displayModeBar: false }}
                      style={{ height: '400px' }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {data.results.map((result, idx) => (
                      <div key={idx} className="stat-card">
                        <div className="stat-label">SNR Input {result.snr_input} dB</div>
                        <div className="text-xs text-cyan-400 mt-2 mb-1">AM</div>
                        <div className="stat-value text-lg">{result.snr_am.toFixed(1)}</div>
                        <div className="text-xs text-pink-400 mt-3 mb-1">FM</div>
                        <div className="stat-value text-lg">{result.snr_fm.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Educational Info */}
          <div className="mt-16 pt-10 border-t border-opacity-20 border-cyan-400">
            <h2 className="text-2xl font-bold text-green-400 mb-6">Understanding AWGN & SNR</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="info-box">
                <div className="info-title">What is AWGN?</div>
                <p>
                  Additive White Gaussian Noise is a fundamental noise model in communication systems. It represents 
                  thermal noise that is uniformly distributed across all frequencies and follows a Gaussian (normal) distribution.
                </p>
              </div>
              <div className="info-box">
                <div className="info-title">Signal to Noise Ratio</div>
                <p>
                  SNR = 10 × log₁₀(P_signal / P_noise) measures how much stronger your signal is compared to background noise. 
                  Higher SNR means clearer signals.
                </p>
              </div>
              <div className="info-box">
                <div className="info-title">Amplitude Modulation (AM)</div>
                <p>
                  AM varies the amplitude (strength) of a carrier wave based on the message signal. AM is more susceptible 
                  to noise because noise directly affects amplitude.
                </p>
              </div>
              <div className="info-box">
                <div className="info-title">Frequency Modulation (FM)</div>
                <p>
                  FM varies the frequency of the carrier wave instead of amplitude. FM is more resistant to noise because 
                  it encodes information in frequency, not amplitude.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
