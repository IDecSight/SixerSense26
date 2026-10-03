#!/usr/bin/env python3
"""Assemble "The Captain and the CFO" from local assets.

Inputs (relative to the video/ folder):
  work/narration.tsv   id, section, text
  work/edit_plan.tsv   line, visual, overlay ("TITLE|subtitle"), gap seconds
  voice/Lxx.wav        one narration take per line
  stills/Sxx.png       illustrated stills (Ken Burns motion is added here)
  clips/Hx.mp4         Seedance 2.0 hero clips
Outputs:
  render/segments/*.mp4, render/voice_track.wav, render/final.mp4, render/final.srt,
  render/timeline.tsv

Usage: python3 work/build.py [--fps 30] [--crf 18]
"""
import csv, os, subprocess, sys, json, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
FPS = int(sys.argv[sys.argv.index('--fps') + 1]) if '--fps' in sys.argv else 30
CRF = sys.argv[sys.argv.index('--crf') + 1] if '--crf' in sys.argv else '18'
W, H = 1920, 1080
NAVY = (11, 29, 58); SAFFRON = (242, 169, 59); CREAM = (247, 240, 225); TEAL = (63, 133, 138)
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
SEG = 'render/segments'; OVL = 'render/overlays'
os.makedirs(SEG, exist_ok=True); os.makedirs(OVL, exist_ok=True)


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        sys.exit('FAILED: ' + ' '.join(cmd) + '\n' + r.stderr[-3000:])
    return r.stdout


def dur(path):
    return float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path]).strip())


def font(p, s):
    return ImageFont.truetype(p, s)


def lower_third(title, sub, path):
    """Transparent 1920x1080 PNG: saffron bar + title + subtitle, bottom-left."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    tf, sf = font(BOLD, 64), font(REG, 34)
    tw = d.textlength(title, font=tf); sw = d.textlength(sub, font=sf) if sub else 0
    bw = int(max(tw, sw)) + 90
    y0 = H - 250
    shade = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shade).rectangle([-200, y0 - 30, bw + 60, H + 200], fill=(5, 12, 28, 165))
    im = Image.alpha_composite(im, shade.filter(ImageFilter.GaussianBlur(70)))
    d = ImageDraw.Draw(im)
    d.rectangle([80, y0, 92, y0 + (130 if sub else 80)], fill=SAFFRON)
    d.text((120, y0 - 4), title, font=tf, fill=CREAM)
    if sub:
        d.text((122, y0 + 80), sub, font=sf, fill=SAFFRON)
    im.save(path)


def center_title(title, sub, path):
    """Large centered text for hook moments (no bar)."""
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    shade = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shade).ellipse([300, 300, W - 300, H - 300], fill=(5, 12, 28, 170))
    im = Image.alpha_composite(im, shade.filter(ImageFilter.GaussianBlur(80)))
    d = ImageDraw.Draw(im)
    tf, sf = font(BOLD, 110), font(REG, 42)
    tw = d.textlength(title, font=tf)
    d.text(((W - tw) / 2, H / 2 - 90), title, font=tf, fill=CREAM)
    if sub:
        sw = d.textlength(sub, font=sf)
        d.text(((W - sw) / 2, H / 2 + 50), sub, font=sf, fill=SAFFRON)
    im.save(path)


def card(title, sub, path, kicker=None):
    """Full-frame navy card with paper grain (rules + title)."""
    import random
    random.seed(title)
    im = Image.new('RGB', (W, H), NAVY)
    px = im.load()
    for _ in range(140000):  # paper grain
        x, y = random.randrange(W), random.randrange(H)
        v = random.randint(-10, 10)
        r, g, b = px[x, y]; px[x, y] = (max(0, r + v), max(0, g + v), max(0, b + v))
    d = ImageDraw.Draw(im)
    d.ellipse([W / 2 - 520, H / 2 - 520, W / 2 + 520, H / 2 + 520], outline=(25, 50, 88), width=3)
    kf, tf, sf = font(BOLD, 40), font(BOLD, 120), font(REG, 54)
    if kicker:
        kw = d.textlength(kicker, font=kf)
        d.text(((W - kw) / 2, H / 2 - 210), kicker, font=kf, fill=TEAL)
    tw = d.textlength(title, font=tf)
    d.text(((W - tw) / 2, H / 2 - 140), title, font=tf, fill=SAFFRON)
    d.rectangle([W / 2 - 60, H / 2 + 20, W / 2 + 60, H / 2 + 26], fill=CREAM)
    if sub:
        for i, ln in enumerate(textwrap.wrap(sub, 40)):
            sw = d.textlength(ln, font=sf)
            d.text(((W - sw) / 2, H / 2 + 60 + i * 70), ln, font=sf, fill=CREAM)
    im.save(path)


def multi_still_segment(imgs, out, T, ovl, idx):
    """Long lines get two shots: explicit 'S01+S02' visuals, or two camera moves on one still."""
    if len(imgs) == 1 and T <= 9.5:
        return still_segment(imgs[0], out, T, ovl, idx)
    if len(imgs) == 1:
        imgs = imgs * 2
    half = round(T / 2, 3)
    parts = []
    for k, img in enumerate(imgs[:2]):
        part = out.replace('.mp4', f'_p{k}.mp4')
        still_segment(img, part, half if k == 0 else T - half, ovl if k == 0 else None, idx + k, variant=k)
        parts.append(part)
    lst = out.replace('.mp4', '_parts.txt')
    with open(lst, 'w') as f:
        f.writelines(f"file '{os.path.abspath(x)}'\n" for x in parts)
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out])


def still_segment(img, out, T, ovl, idx, variant=0):
    """Ken Burns: alternate slow zoom-in / zoom-out with gentle pan; overlay fades in at 0.4 s."""
    frames = max(1, int(round(T * FPS)))
    zin = idx % 2 == 0
    z = f"if(eq(on,0),1.0,min(zoom+{0.10 / frames:.6f},1.10))" if zin else \
        f"if(eq(on,0),1.10,max(zoom-{0.10 / frames:.6f},1.0))"
    xexpr = "iw/2-(iw/zoom/2)+((on/{f})-0.5)*40".format(f=frames) if idx % 3 else "iw/2-(iw/zoom/2)"
    if variant:  # second shot on the same still: tighter framing drifting across
        z = f"if(eq(on,0),1.22,max(zoom-{0.08 / frames:.6f},1.14))"
        xexpr = "(iw-iw/zoom)*(0.15+0.7*on/{f})".format(f=frames)
    vf = (f"scale=3840:-2,zoompan=z='{z}':x='{xexpr}':y='ih/2-(ih/zoom/2)':d={frames}:s={W}x{H}:fps={FPS},"
          f"setsar=1,format=yuv420p")
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-i', img]
    if ovl:
        cmd += ['-loop', '1', '-i', ovl,
                '-filter_complex', f"[0:v]{vf}[b];[1:v]format=rgba,fade=t=in:st=0.4:d=0.5:alpha=1[o];"
                                   f"[b][o]overlay=0:0:shortest=1,format=yuv420p[v]", '-map', '[v]']
    else:
        cmd += ['-vf', vf]
    cmd += ['-t', f'{T:.3f}', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-an', out]
    run(cmd)


def clip_segment(clip, out, T, ovl):
    """Fit a hero clip to T seconds: trim if longer, slow to max 1.35x stretch, then hold last frame."""
    cd = dur(clip)
    stretch = min(max(T / cd, 1.0), 1.35)
    pad = max(0.0, T - cd * stretch)
    vf = (f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setpts={stretch:.4f}*PTS,"
          f"fps={FPS},tpad=stop_mode=clone:stop_duration={pad + 0.1:.3f},setsar=1")
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', clip]
    if ovl:
        cmd += ['-loop', '1', '-i', ovl, '-filter_complex',
                f"[0:v]{vf}[b];[1:v]format=rgba,fade=t=in:st=0.4:d=0.5:alpha=1[o];[b][o]overlay=0:0,format=yuv420p[v]",
                '-map', '[v]']
    else:
        cmd += ['-vf', vf + ',format=yuv420p']
    cmd += ['-t', f'{T:.3f}', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-an', out]
    run(cmd)


def card_segment(png, out, T):
    vf = f"scale={W}:{H},zoompan=z='min(zoom+0.0006,1.04)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(T * FPS)}:s={W}x{H}:fps={FPS},fade=t=in:d=0.3,format=yuv420p"
    run(['ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-i', png, '-vf', vf, '-t', f'{T:.3f}',
         '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-an', out])


def srt_time(s):
    ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{sec:02},{ms:03}"


def main():
    text = {r['id']: r['text'] for r in csv.DictReader(open('work/narration.tsv'), delimiter='\t')}
    plan = list(csv.DictReader(open('work/edit_plan.tsv'), delimiter='\t'))
    missing = [p for r in plan for p in
               ([f"voice/{r['line']}.wav"] if r['line'].startswith('L') else []) +
               ([f"stills/{v}.png" for v in r['visual'].split('+')] if r['visual'].startswith('S') else []) +
               ([f"clips/{r['visual']}.mp4"] if r['visual'].startswith('H') else []) if not os.path.exists(p)]
    if missing:
        sys.exit('Missing assets:\n  ' + '\n  '.join(missing))

    t = 0.0; segs = []; srt = []; timeline = []; voice_inputs = []
    for i, r in enumerate(plan):
        line, vis, gap = r['line'], r['visual'], float(r['gap'] or 0)
        title, _, sub = (r['overlay'] or '').partition('|')
        out = f"{SEG}/{i:02d}_{line}.mp4"
        if line == 'TITLE':
            T = 3.2
            png = f"{OVL}/title.png"; card(title, sub, png, kicker='A DECISION-MAKING CASE STUDY')
            card_segment(png, out, T)
        else:
            vd = dur(f"voice/{line}.wav")
            T = vd + gap + 0.15
            voice_inputs.append((f"voice/{line}.wav", t + 0.15))
            srt.append((t + 0.15, t + 0.15 + vd, text[line]))
            if vis.startswith('RULE'):
                png = f"{OVL}/{vis}.png"; card(title, sub, png, kicker='DECISION RULE')
                card_segment(png, out, T)
            else:
                ovl = None
                if title:
                    ovl = f"{OVL}/{line}.png"
                    (center_title if title.endswith('?') or line in ('L26',) else lower_third)(title, sub, ovl)
                if vis.startswith('H'):
                    clip_segment(f"clips/{vis}.mp4", out, T, ovl)
                else:
                    multi_still_segment([f"stills/{v}.png" for v in vis.split('+')], out, T, ovl, i)
        segs.append(out); timeline.append((line, vis, round(t, 2), round(T, 2))); t += T
        print(f"{line:6} {vis:6} start {t - T:7.2f}s  len {T:5.2f}s", flush=True)

    total = t
    with open('render/concat.txt', 'w') as f:
        f.writelines(f"file '{os.path.abspath(s)}'\n" for s in segs)
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'render/concat.txt',
         '-c', 'copy', 'render/video_only.mp4'])

    # voice track: each take placed at its start time
    cmd = ['ffmpeg', '-y', '-loglevel', 'error']
    for p, _ in voice_inputs:
        cmd += ['-i', p]
    fc = ''.join(f"[{k}:a]aresample=48000,aformat=channel_layouts=mono,adelay={int(st * 1000)}[v{k}];"
                 for k, (_, st) in enumerate(voice_inputs))
    fc += ''.join(f"[v{k}]" for k in range(len(voice_inputs))) + \
        f"amix=inputs={len(voice_inputs)}:normalize=0,apad=whole_dur={total:.3f},loudnorm=I=-16:TP=-1.5:LRA=7[a]"
    run(cmd + ['-filter_complex', fc, '-map', '[a]', '-ar', '48000', '-ac', '2', 'render/voice_track.wav'])

    # music bed sized to the cut, hook length = time of the title card
    hook = next(s for (l, v, s, d) in timeline if l == 'TITLE') + 1.0
    run(['python3', 'work/make_music.py', f'{total + 1:.2f}', f'{hook:.2f}', 'music/music_bed.wav'])

    # mix: music ducks under voice via sidechain compression
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'render/video_only.mp4', '-i', 'render/voice_track.wav',
         '-i', 'music/music_bed.wav', '-filter_complex',
         "[2:a]volume=0.55[m];[1:a]asplit=2[vo][sc];[m][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[md];"
         f"[vo][md]amix=inputs=2:normalize=0,afade=t=out:st={total - 2.5:.2f}:d=2.5,alimiter=limit=0.95[a]",
         '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', f'{total:.3f}',
         '-movflags', '+faststart', 'render/final.mp4'])

    with open('render/final.srt', 'w') as f:
        for k, (a, b, tx) in enumerate(srt, 1):
            f.write(f"{k}\n{srt_time(a)} --> {srt_time(b)}\n{textwrap.fill(tx, 60)}\n\n")
    with open('render/timeline.tsv', 'w') as f:
        f.write('line\tvisual\tstart_s\tlength_s\n')
        f.writelines(f"{a}\t{b}\t{c}\t{d}\n" for a, b, c, d in timeline)
    print(json.dumps({'final': 'render/final.mp4', 'duration_s': round(dur('render/final.mp4'), 2)}))


if __name__ == '__main__':
    main()
