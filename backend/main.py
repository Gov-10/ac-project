from fastapi import FastAPI
from pydantic import BaseModel
import numpy as np
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
class SignalRequest(BaseModel):
    signal: list[float] | None = None
    fs: int = 1000
    duration: float = 1.0
    fm: float = 10
    fc: float = 100
    Am: float = 1
    Ac: float = 1
    kf: float = 50
    snr_values: list[int] = [0, 5, 10, 20]

def add_awgn(signal, snr_db):
    signal_power = np.mean(signal**2)
    snr_linear = 10**(snr_db / 10)
    noise_power = signal_power / snr_linear
    noise = np.sqrt(noise_power) * np.random.randn(len(signal))
    return signal + noise

@app.post("/process-signal")
def process_signal(data: SignalRequest):
    fs = data.fs
    t = np.arange(0, data.duration, 1/fs)
    if data.signal:
        m = np.array(data.signal)
        t = np.linspace(0, data.duration, len(m))
    else:
        m = data.Am * np.sin(2 * np.pi * data.fm * t)
    am = data.Ac * (1 + m) * np.cos(2 * np.pi * data.fc * t)
    fm_signal = np.cos(
        2 * np.pi * data.fc * t + data.kf * np.sin(2 * np.pi * data.fm * t)
    )
    results = []
    for snr in data.snr_values:
        noisy_am = add_awgn(am, snr)
        noisy_fm = add_awgn(fm_signal, snr)
        noise_am = noisy_am - am
        noise_fm = noisy_fm - fm_signal
        snr_am = 10 * np.log10(np.sum(am**2) / np.sum(noise_am**2))
        snr_fm = 10 * np.log10(np.sum(fm_signal**2) / np.sum(noise_fm**2))
        results.append({
            "snr_input": snr,
            "snr_am": float(snr_am),
            "snr_fm": float(snr_fm),
            "noisy_am": noisy_am.tolist(),
            "noisy_fm": noisy_fm.tolist()
        })

    return {
        "time": t.tolist(),
        "message": m.tolist(),
        "am": am.tolist(),
        "fm": fm_signal.tolist(),
        "results": results
    }


app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"],)

