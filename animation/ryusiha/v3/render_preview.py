"""Deterministic v3 preview and 25-pose blink sequence; Python 3, Pillow, NumPy, SciPy, FFmpeg."""
from pathlib import Path
import math, subprocess, json
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates
P=Path(__file__).resolve().parent
A=P/'assets'; S=P/'blink'; S.mkdir(exist_ok=True)
DURATION=8; FPS=60

def smooth(x):
    x=max(0,min(1,x)); return x*x*(3-2*x)

def blink(t):
    # A fast lid descent, short contact, slower reopening. No opacity crossfade.
    result=0
    for center in [2.18,5.61,6.02]:
        d=t-center
        if -.09<=d<0: b=smooth((d+.09)/.09)
        elif 0<=d<.025: b=1
        elif .025<=d<.195: b=1-smooth((d-.025)/.17)
        else: b=0
        result=max(result,b)
    return result

head=np.asarray(Image.open(A/'head_open.png').convert('RGBA')).astype(float)
closed=np.asarray(Image.open(A/'eyes_closed.png').convert('RGBA')).astype(float)
yy,xx=np.mgrid[:280,:290].astype(float)

def eye_pose(q):
    out=head.copy()
    for cx in [104,188]:
        # Confine deformation to each eye; preserve brows, hair and nose.
        xweight=np.clip(1-(np.abs(xx-cx)/27)**4,0,1)
        amount=q*xweight
        top=164+16*amount; bottom=188-8*amount
        srcy=yy.copy()
        upper=(yy>=159)&(yy<top)
        middle=(yy>=top)&(yy<=bottom)
        lower=(yy>bottom)&(yy<=198)
        srcy=np.where(upper,158+(yy-164)*5/np.maximum(top-164,1),srcy)
        srcy=np.where(middle,164+(yy-top)*24/np.maximum(bottom-top,.5),srcy)
        srcy=np.where(lower,188+(yy-bottom)*10/np.maximum(198-bottom,1),srcy)
        active=(np.abs(xx-cx)<27)&(yy>=159)&(yy<=198)
        for k in range(3):
            sampled=map_coordinates(head[:,:,k],[srcy,xx],order=1,mode='nearest')
            # Fill the descending upper lid with the existing closed-eye skin,
            # keeping the original foreground hair above the eye contour.
            patchx=np.clip(xx-76,0,143)
            skin=map_coordinates(closed[:,:,k],[np.full_like(yy,19),patchx],order=1,mode='nearest')
            sampled=np.where(upper,skin,sampled)
            foreground=(head[:,:,2]>head[:,:,0]+12)&(head[:,:,0]>150)&(head[:,:,2]>180)&(yy<166)
            feather=np.clip((yy-158)/3,0,1)*np.clip((199-yy)/3,0,1)
            weight=active*feather*(~foreground)*np.where(yy<164,smooth(q/.20),1)
            out[:,:,k]=out[:,:,k]*(1-weight)+sampled*weight
        # The final narrow slit resolves to the existing closed lash artwork.
        # Transition only after the iris has been compressed below 4px.
        if q>.84:
            blend=smooth((q-.84)/.16)
            patch=np.zeros_like(head); patch[150:196,76:220]=closed
            mask=np.clip((26-np.abs(xx-cx))/5,0,1)*np.clip((18-np.abs(yy-177))/5,0,1)*blend
            mask*=patch[:,:,3]/255
            out[:,:,:3]=out[:,:,:3]*(1-mask[:,:,None])+patch[:,:,:3]*mask[:,:,None]
    return Image.fromarray(np.uint8(np.clip(out,0,255)))

poses=[]
for i in range(25):
    im=eye_pose(i/24); im.save(S/f'head_{i:03d}.png'); poses.append(im)

# Render at half resolution; AE uses the original full-resolution assets.
W,H=640,960
base={n:Image.open(A/(n+'.png')).convert('RGBA') for n in ['hair_left','hair_right','lower_body','arm_left','arm_right','torso']}

def mat(x,y,angle=0,sx=1,sy=1):
    a=math.radians(angle); c=math.cos(a);s=math.sin(a)
    return np.array([[c*sx,-s*sy,x],[s*sx,c*sy,y],[0,0,1.]])

def place(dst,im,m,anchor):
    m=mat(0,0,sx=.5,sy=.5)@m@mat(-anchor[0],-anchor[1])
    # Transform a bounded tile, avoiding full-canvas resampling for every part.
    corners=m@np.array([[0,im.width,im.width,0],[0,0,im.height,im.height],[1,1,1,1]])
    x0=max(0,int(np.floor(corners[0].min()))-2); y0=max(0,int(np.floor(corners[1].min()))-2)
    x1=min(W,int(np.ceil(corners[0].max()))+2); y1=min(H,int(np.ceil(corners[1].max()))+2)
    inv=np.linalg.inv(m)@mat(x0,y0)
    tile=im.transform((x1-x0,y1-y0),Image.Transform.AFFINE,tuple(inv[:2].ravel()),Image.Resampling.BICUBIC)
    dst.alpha_composite(tile,(x0,y0))

def motion(t):
    w=2*math.pi/8
    sway=math.sin(w*t)
    root=mat(640,1690,.10*sway)@mat(-640,-1690)
    body=root@mat(640+1.6*sway,704-.9*math.sin(2*w*t),.18*sway,1,1+.0012*math.sin(2*w*t))
    headm=body@mat(.65*math.sin(w*t-.35),-292,.65*math.sin(w*t-.35)+.14*math.sin(2*w*t))
    return root,body,headm

def frame(t):
    root,body,hm=motion(t); w=2*math.pi/8
    dst=Image.new('RGBA',(W,H),(16,13,27,255))
    # Hair follows the head, with delayed, smaller secondary motion.
    for name,anchor,phase,sign in [('hair_left',(488,258),-.85,1),('hair_right',(0,258),-1.25,-1)]:
        place(dst,base[name],hm@mat(0,0,sign*(.22*math.sin(w*t+phase)+.06*math.sin(2*w*t+phase))),anchor)
    place(dst,base['lower_body'],root@mat(152,694),(0,0))
    for name,pivot,anchor,amp,phase in [('arm_left',(-96,-235),(248,20),.65,-.65),('arm_right',(98,-235),(64,20),-.60,-1.0)]:
        angle=amp*(math.sin(w*t+phase)+.16*math.sin(2*w*t+phase))
        place(dst,base[name],body@mat(*pivot,angle),(anchor))
    place(dst,base['torso'],body,(158,300))
    q=blink(t)*24; lo=int(q); hi=min(24,lo+1)
    # Quantized sprite timing mirrors AE's source-frame selection.
    place(dst,poses[min(24,round(q))],hm,(148,258))
    return dst.convert('RGB')

if __name__=='__main__':
    import sys
    if '--poses-only' not in sys.argv:
        out=P/'Natural_Motion_v3_Preview.mp4'
        cmd=['ffmpeg','-y','-v','error','-f','rawvideo','-pixel_format','rgb24','-video_size',f'{W}x{H}','-framerate',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',str(out)]
        proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
        for i in range(DURATION*FPS):
            proc.stdin.write(frame(i/FPS).tobytes())
            if i%120==0: print(f'frame {i}/{DURATION*FPS}',flush=True)
        proc.stdin.close()
        if proc.wait()!=0: raise RuntimeError('FFmpeg render failed')
        frame(0).save(P/'Preview.png')
        # Blink contact sheet for visual review.
        strip=Image.new('RGB',(290*6,280),(16,13,27))
        for j,q in enumerate([0,.25,.5,.75,1,.5]): strip.paste(poses[round(q*24)],(j*290,0))
        strip.save(P/'Blink_poses.png')
        print(out)
