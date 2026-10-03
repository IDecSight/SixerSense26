"""Synthesize a royalty-free ambient music bed (no samples, pure synthesis).
Tense drone + clock tick for the hook, then a slow Am-F-C-G pad with a soft pulse
and plucked arpeggio, then a resolving outro. Output: music/music_bed.wav (48 kHz stereo)."""
import numpy as np, wave, sys
SR = 48000
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 330.0
HOOK = float(sys.argv[2]) if len(sys.argv) > 2 else 26.0
N = int(SR * DUR)
t = np.arange(N) / SR
L = np.zeros(N); R = np.zeros(N)

def note(m): return 440.0 * 2 ** ((m - 69) / 12)

def pad_tone(f, n, detune=0.004):
    tt = np.arange(n) / SR
    s = np.zeros(n)
    for d in (-detune, 0, detune):
        for h, a in ((1, 1.0), (2, 0.35), (3, 0.15), (4, 0.06)):
            s += a * np.sin(2 * np.pi * f * (1 + d) * h * tt + np.random.rand() * 6.28)
    return s / 6

def env(n, a, r):
    e = np.ones(n); ai = int(a * SR); ri = int(r * SR)
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] = np.linspace(1, 0, ri)
    return e

rng = np.random.default_rng(7)
# --- hook: A drone + low tension + ticking clock
hn = int(HOOK * SR)
drone = (pad_tone(note(45), hn) * 0.5 + pad_tone(note(52), hn) * 0.25) * env(hn, 2.0, 2.5)
drone *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.2 * np.arange(hn) / SR)
L[:hn] += drone; R[:hn] += drone
tick_len = int(0.03 * SR)
tick = rng.standard_normal(tick_len) * np.exp(-np.linspace(0, 12, tick_len)) * 0.25
for k in np.arange(0.5, HOOK - 2, 0.75):
    i = int(k * SR); L[i:i + tick_len] += tick * 0.8; R[i:i + tick_len] += tick

# --- body: Am F C G progression, 8 s per chord
chords = [(57, 60, 64), (53, 57, 60), (48, 55, 60), (55, 59, 62)]
bars = 8.0; start = HOOK - 2.0; k = 0
end_body = DUR - 14
while start < end_body:
    c = chords[k % 4]; n = int(bars * SR) + int(1.5 * SR)
    i = int(start * SR); j = min(i + n, N); n = j - i
    s = sum(pad_tone(note(m), n) for m in c) * 0.22 + pad_tone(note(c[0] - 12), n) * 0.35
    s *= env(n, 1.2, 1.5)
    L[i:j] += s * 0.95; R[i:j] += s
    # plucked arpeggio (eighths at 75 bpm), panned
    step = 0.4
    for q, m in enumerate([c[0] + 12, c[1] + 12, c[2] + 12, c[1] + 12] * 5):
        p0 = start + q * step
        if p0 >= start + bars or p0 >= end_body: break
        pn = int(1.2 * SR); pi = int(p0 * SR); pj = min(pi + pn, N); pn = pj - pi
        pt = np.arange(pn) / SR
        pl = (np.sin(2 * np.pi * note(m) * pt) + 0.3 * np.sin(4 * np.pi * note(m) * pt)) * np.exp(-pt * 5) * 0.05
        pan = 0.5 + 0.4 * np.sin(q)
        L[pi:pj] += pl * (1 - pan); R[pi:pj] += pl * pan
    # soft pulse (heartbeat kick) on beats 1 and 3
    for b in np.arange(0, bars, 1.6):
        kn = int(0.35 * SR); ki = int((start + b) * SR); kj = min(ki + kn, N); kn = kj - ki
        kt = np.arange(kn) / SR
        kk = np.sin(2 * np.pi * (45 + 60 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 9) * 0.22
        L[ki:kj] += kk; R[ki:kj] += kk
    start += bars; k += 1

# --- outro: resolve on C major, long fade
on = N - int(end_body * SR); i = int(end_body * SR)
s = sum(pad_tone(note(m), on) for m in (48, 52, 55, 60)) * 0.22 * env(on, 1.5, 9.0)
L[i:] += s; R[i:] += s

mix = np.stack([L, R], 1)
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 0.5
with wave.open(sys.argv[3] if len(sys.argv) > 3 else 'music/music_bed.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok', DUR)
