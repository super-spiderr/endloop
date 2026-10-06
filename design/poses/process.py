"""
Green-screen pose → app-ready still.

  python3 process.py sources/loop-shrug.png loop shrug          # writes ../../assets/characters/loop/shrug.webp
  python3 process.py sources/*.png --all                          # re-process every file named <roaster>-<pose>.png
  python3 process.py in.png lupe disgusted --dx -0.2              # nudge the crop sideways (fraction of width)
  python3 process.py sources/loop-ahem.png loop ahem --native     # also writes the 600×600 faded drawable endloop_loop_ahem.webp

Needs: pip install pillow numpy scipy
"""
import numpy as np, sys, os, glob
from PIL import Image
from scipy import ndimage as nd

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "assets", "characters")

def key(img):
    a=np.array(img.convert("RGB")).astype(np.float32)
    r,g,b=a[...,0],a[...,1],a[...,2]
    d=g-np.maximum(r,b)
    alpha=1-np.clip((d-25)/70,0,1)
    # white letterbox strips touching the border
    white=(a.min(axis=2)>246)
    lab,n=nd.label(white)
    edge=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    for k in edge:
        comp=lab==k
        if comp.sum()>2000: alpha[comp]=0
    # despill
    sp=d>0
    g2=np.where(sp,np.maximum(r,b)+np.clip(d,0,0)*0,g)
    out=np.dstack([r,g2,b,alpha*255]).clip(0,255).astype(np.uint8)
    # drop tiny specks
    m=out[...,3]>20;lab,n=nd.label(m)
    if n>1:
        sizes=nd.sum(m,lab,range(1,n+1));keep=np.zeros(n+1,bool);keep[1:]=sizes>=sizes.max()*0.02
        out[...,3]=np.where(keep[lab],out[...,3],0)
    return out

def cap(a):
    r,g,b=[a[...,i].astype(int) for i in range(3)]
    m=(r>195)&(g>180)&(b>160)&(r-b>8)&(r-b<70)&(g-b<50)&(a[...,3]>128)
    lab,n=nd.label(m);sizes=nd.sum(m,lab,range(1,n+1))
    # the cap is the topmost big beige blob (a clipboard or card can be bigger)
    cands=[k+1 for k in range(n) if sizes[k]>=0.25*sizes.max()]
    k=min(cands,key=lambda c:np.where(lab==c)[0].min())
    ys,xs=np.where(lab==k);return xs.min(),xs.max(),ys.min(),ys.max()

def frame(a,adj):
    """Square crop that keeps the whole gesture (arms, hands, props) in frame.
    Cap sits near the top; if the body ends above the square's bottom, it fades out softly."""
    H,W=a.shape[:2]
    x0,x1,y0,_=cap(a)
    al=a[...,3]>40
    ys,xs=np.where(al); bot=ys.max()
    S=(x1-x0)/adj.get("ratio",0.40)
    head=adj.get("head",0.10)             # room above the cap, fraction of the square
    side=adj.get("side",1.16)             # square width vs gesture width: ~8% room each side
    top=y0-head*S
    # hands / folded arms low on the chest: grow the square until the lowest one fits (skin blobs that
    # run off the bottom of the source are arms hanging down, so they don't count)
    r,g,b=[a[...,i].astype(int) for i in range(3)]
    skin=(a[...,3]>128)&(r>110)&(r>g)&(g>b)&(r-b>35)
    lab,n=nd.label(skin)
    if n:
        sizes=nd.sum(skin,lab,range(1,n+1))
        low=[np.where(lab==k+1)[0].max() for k in range(n) if sizes[k]>(x1-x0)**2*0.02 and not (lab[-1]==k+1).any()]
        if low:
            need=(max(low)-top)/0.94
            S=min(max(S,need),(x1-x0)/adj.get("min_ratio",0.24))
            top=y0-head*S
    cols=np.where(al[int(max(top,0)):, :].any(axis=0))[0]
    L,R=cols.min(),cols.max()
    S=max(S,(R-L)*side)
    top=y0-head*S
    # hands raised above the cap (stretching, flex): move the top up and grow the square to keep them in
    yt=np.where(al.any(axis=1))[0].min()
    if yt < top:
        grow=top-(yt-0.04*S); S+=grow; top=yt-0.04*S
        cols=np.where(al[int(max(top,0)):, :].any(axis=0))[0]; L,R=cols.min(),cols.max()
        S=max(S,(R-L)*side)
    cx=(L+R)/2+adj.get("dx",0)*S
    left=cx-S/2
    if bot-top < S:                       # body ends early: sit it on the bottom edge, space goes above the cap
        top=bot-S
    img=Image.fromarray(a)
    out=Image.new("RGBA",(int(S),int(S)),(0,0,0,0))
    out.paste(img,(int(-left),int(-top)))
    body_end=bot-top                      # where the body stops inside the square
    arr=np.array(out)
    if body_end < S-2:                    # body ends mid-frame: soft fade instead of a hard line
        fade=int(S*0.16); y1=min(arr.shape[0],int(body_end)+3); y0f=max(0,y1-fade)
        ramp=np.linspace(1,0,y1-y0f)[:,None]
        arr[y0f:y1,:,3]=(arr[y0f:y1,:,3]*ramp).astype(np.uint8); arr[y1:,:,3]=0
    return Image.fromarray(arr).resize((768,768),Image.LANCZOS)


NATIVE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "modules", "endloop-core", "android", "src", "main", "res", "drawable-nodpi")

def native(out, who, pose):
    """600×600 copy for notifications / the roast overlay, fading out smoothly over the bottom 28%."""
    arr = np.array(out.resize((600, 600), Image.LANCZOS)).astype(np.float32)
    t = np.clip((np.arange(600) - 430) / 170, 0, 1)
    arr[..., 3] *= (1 - (3 * t**2 - 2 * t**3))[:, None]
    dst = os.path.join(NATIVE, f"endloop_{who}_{pose.replace('-', '_')}.webp")
    Image.fromarray(arr.clip(0, 255).astype(np.uint8)).save(dst, "WEBP", quality=90, method=6)
    print("wrote", dst)

def run(path, who, pose, adj, with_native=False):
    a = key(Image.open(path))
    out = frame(a, adj)
    os.makedirs(os.path.join(OUT, who), exist_ok=True)
    dst = os.path.join(OUT, who, f"{pose}.webp")
    out.save(dst, "WEBP", quality=90, method=6)
    print("wrote", dst)
    if with_native:
        native(out, who, pose)

if __name__ == "__main__":
    args = sys.argv[1:]
    if "--all" in args:
        for p in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), "sources", "*.png"))):
            name = os.path.basename(p)[:-4]
            who, pose = name.split("-", 1)
            if pose.endswith(("-alt", "-alt2")):
                continue
            run(p, who, pose, {"lupe-disgusted": {"dx": -0.2}, "loop-disgusted": {"dx": -0.12}}.get(name, {}))
    else:
        adj = {}
        if "--dx" in args:
            i = args.index("--dx"); adj["dx"] = float(args[i + 1]); del args[i:i + 2]
        with_native = "--native" in args
        if with_native:
            args.remove("--native")
        run(args[0], args[1], args[2], adj, with_native)
