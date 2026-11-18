# Usage: cutout.py plate.jpg out.webp ["x0,y0,x1,y1"] ["ex0,ey0,ex1,ey1;..."]   (brøkdele 0-1)
# Finder fisken på en gammel tavle, fjerner tekst og bleger papiret til hvidt.
import sys, warnings, numpy as np
warnings.filterwarnings("ignore")
from PIL import Image
from skimage import color, morphology, measure, filters
from scipy import ndimage as ndi

src, out = sys.argv[1], sys.argv[2]
region = [float(v) for v in sys.argv[3].split(",")] if len(sys.argv) > 3 and sys.argv[3] else None
excl = [[float(v) for v in r.split(",")] for r in sys.argv[4].split(";")] if len(sys.argv) > 4 and sys.argv[4] else []
im = Image.open(src).convert("RGB")
xf = sys.argv[5] if len(sys.argv) > 5 else ""
if "rot90" in xf: im = im.rotate(90, expand=True).transpose(Image.FLIP_TOP_BOTTOM)
a = np.asarray(im).astype(np.float32) / 255
H, W, _ = a.shape
lab = color.rgb2lab(a)
small = np.asarray(im.resize((W // 8, H // 8))).astype(np.float32) / 255
bg_small = ndi.median_filter(color.rgb2lab(small), size=(25, 25, 1))
bg = np.stack([np.asarray(Image.fromarray(bg_small[..., c]).resize((W, H), Image.BILINEAR)) for c in range(3)], -1)
border = np.concatenate([lab[:H//12].reshape(-1,3), lab[-H//12:].reshape(-1,3), lab[:, :W//12].reshape(-1,3), lab[:, -W//12:].reshape(-1,3)])
paper = np.median(border, 0)
d = np.minimum(np.linalg.norm(lab - paper, axis=-1), np.linalg.norm(lab - bg, axis=-1) * 1.4)
d_full = d.copy()
m = int(0.02 * min(H, W))
d[:m] = 0; d[-m:] = 0; d[:, :m] = 0; d[:, -m:] = 0
valid = np.ones_like(d, bool)
if region:
    valid[:] = False
    valid[int(region[1]*H):int(region[3]*H), int(region[0]*W):int(region[2]*W)] = True
for e in excl:
    valid[int(e[1]*H):int(e[3]*H), int(e[0]*W):int(e[2]*W)] = False
d = np.where(valid, d, 0)

def clean(mask, close):
    mask = morphology.remove_small_objects(mask, 60)
    mask = morphology.binary_closing(mask, morphology.disk(close))
    mask = ndi.binary_fill_holes(mask)
    return morphology.binary_opening(mask, morphology.disk(2))
strong = clean(d > 12, 6)
lbl = measure.label(strong)
props = sorted(measure.regionprops(lbl), key=lambda p: -p.area)
if not props: sys.exit("no component")
big = props[0].area; br = props[0].bbox
core = np.zeros_like(strong)
for p in props:
    if p.area < max(0.03 * big, 300): continue
    minr, minc, maxr, maxc = p.bbox
    if p is not props[0]:
        ih = max(0, min(maxr, br[2]) - max(minr, br[0])); iw = max(0, min(maxc, br[3]) - max(minc, br[1]))
        if ih * iw < 0.6 * (maxr - minr) * (maxc - minc): continue
    core |= lbl == p.label
# Fiskens område: kernen lukket med stor radius (fylder lyse bugpartier), lidt udvidet
body = ndi.binary_fill_holes(morphology.binary_closing(core, morphology.disk(14)))
zone = morphology.binary_dilation(body, morphology.disk(5)) & valid
# Ensret papirfarven til en fælles cremefarve, og mal alt uden for fisken over med papir
TARGET = np.array([0xf4, 0xec, 0xd8], np.float32) / 255
paper_rgb = np.median(np.concatenate([a[:H//12].reshape(-1,3), a[-H//12:].reshape(-1,3)]), 0)
corr = np.clip(a * (TARGET / np.maximum(paper_rgb, 0.05)), 0, 1)
zone2 = morphology.binary_dilation(body, morphology.disk(10)) & valid
w = ndi.gaussian_filter(zone2.astype(np.float32), 4)
# I overgangszonen: kun mørke/farvede pixels (finnestråler) får lov at blive
w = np.clip(w * np.clip(d_full / 8, 0.0, 1.0) + w * (zone2 & morphology.binary_dilation(body, morphology.disk(3))), 0, 1)
outimg = corr * w[..., None] + TARGET * (1 - w[..., None])
ys, xs = np.where(body)
pad = int(0.035 * max(W, H))
y0, y1 = max(ys.min()-pad, 0), min(ys.max()+pad, H)
x0, x1 = max(xs.min()-pad, 0), min(xs.max()+pad, W)
img = Image.fromarray((outimg[y0:y1, x0:x1] * 255).astype(np.uint8), "RGB")
if "flip" in xf: img = img.transpose(Image.FLIP_LEFT_RIGHT)
img.thumbnail((720, 720), Image.LANCZOS)
img.save(out, "WEBP", quality=80, method=6)
print(out, img.size)
