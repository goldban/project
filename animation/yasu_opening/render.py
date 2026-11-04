import math, subprocess, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
P=Path(__file__).parent
W,H=1280,720; FPS=30
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
if not Path(font).exists(): font='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
f=ImageFont.truetype(font,44); small=ImageFont.truetype(font,13)
rng=np.random.default_rng(30718)
stars=rng.random((120,4))
y,x=np.mgrid[:H,:W]; radial=np.exp(-(((x-W*.5)/(W*.5))**2+((y-H*.43)/(H*.65))**2)*2)
bg=np.zeros((H,W,3)); bg[:]=[3,6,15];bg+=radial[:,:,None]*np.array([9,19,29])
def ease(a):
 a=max(0,min(1,a));return a*a*(3-2*a)
def logo(size):
 im=Image.new('RGBA',(size,size));d=ImageDraw.Draw(im)
 # Geometry reconstructed from the supplied reference.
 def poly(pts,c):d.polygon([(int(a*size),int(b*size)) for a,b in pts],fill=c)
 poly([(0,.035),(.40,.51),(0,.97)],'#ec008c')
 poly([(.168,0),(.972,0),(.567,.473)],'#00a4e4')
 poly([(.195,1),(1,.061),(1,1)],'#281d1b')
 return im
emblem=logo(450)
# A short original synthesized cinematic rise, impact and harmonic tail.
sr=48000;tt=np.arange(sr*10)/sr; audio=np.zeros_like(tt)
noise=rng.normal(size=len(tt)); smooth=np.convolve(noise,np.ones(45)/45,mode='same')
rise=np.clip(tt/5.9,0,1)**2*(tt<6)
audio+=smooth*rise*.24
for freq in [55,82.4069,110,164.8138,220,329.6276,440]:
 env=(1-np.exp(-np.maximum(tt-.5,0)*.5))*np.exp(-np.maximum(tt-6.1,0)*.7)
 audio+=np.sin(2*np.pi*freq*tt+.2*np.sin(tt))*env*.025
z=np.maximum(tt-6.0,0);audio+=np.sin(2*np.pi*(48*z+40*(1-np.exp(-z*6))))*np.exp(-z*3)*(tt>=6)*.45
audio+=smooth*np.exp(-z*5)*(tt>=6)*.3
audio*=np.minimum(tt/.4,1)*np.minimum((10-tt)/.9,1)
audio=np.clip(audio,-1,1)
with wave.open(str(P/'sound.wav'),'wb') as q:q.setnchannels(2);q.setsampwidth(2);q.setframerate(sr);q.writeframes(np.repeat((audio*28000).astype('<i2')[:,None],2,axis=1).tobytes())
cmd=['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(P/'sound.wav'),'-vf','scale=1920:1080:flags=lanczos','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','10','-movflags','+faststart',str(P/'YASU_Opening_10s.mp4')]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
for frame in range(300):
 t=frame/FPS; im=Image.fromarray(np.uint8(bg));d=ImageDraw.Draw(im)
 # Deep field: camera moves through a floating grid of glossy panels.
 opacity=1-ease((t-5.1)/1.4)
 if opacity>0:
  tiles=[]
  for row in range(-4,5):
   for col in range(-7,8):
    depth=3+((row*7+col*3)%9)*.28
    a=.18*math.sin(t*.6);xx=(col*175+130*math.sin(t*.55))/depth;yy=(row*155+30*math.cos(t*.4))/depth
    scale=1+ease(t/5)*1.5
    cx=W/2+xx*scale;cy=H/2+yy*scale
    s=58*scale/depth;skew=math.sin(t*.5+col*.17)*s*.55
    colors=[(0,130,180),(145,0,90),(20,35,55),(34,54,70),(65,80,90)]
    c=colors[(col+row*3)%5];c=tuple(int(v*opacity*(.45+.35*math.sin(row+col+t))) for v in c)
    pts=[(cx-s,cy-s),(cx+s,cy-s+skew),(cx+s,cy+s),(cx-s,cy+s-skew)]
    d.polygon(pts,fill=c);d.line(pts+[pts[0]],fill=tuple(min(255,int(v*1.8+10*opacity)) for v in c),width=1)
 # Drifting points of light.
 for px,py,pz,ph in stars:
  sx=(px*W+(t*8)*(pz+.2))%W;sy=(py*H-t*5*pz)%H;b=int((20+65*pz)*(0.5+.5*math.sin(t+ph*6)))
  d.ellipse((sx,sy,sx+1+pz,sy+1+pz),fill=(b//2,b,int(b*1.3)))
 # Colored ribbons converge into the final emblem.
 reveal=ease((t-4.8)/1.6)
 if t<6.6:
  lay=Image.new('RGBA',(W,H));ld=ImageDraw.Draw(lay)
  for k,c in enumerate([(0,164,228,180),(236,0,140,160)]):
   travel=ease((t-(2.6+k*.3))/3.3);cx=-650+travel*1320 if k==0 else 1950-travel*1320
   ww=120*(1-ease((t-5.4)/1.1))+3
   ld.polygon([(cx-ww-500,0),(cx+ww-500,0),(cx+ww+200,H),(cx-ww+200,H)],fill=c)
  im=Image.alpha_composite(im.convert('RGBA'),lay.filter(ImageFilter.GaussianBlur(5))).convert('RGB')
 if reveal>0:
  size=int(205+75*(1-reveal));mark=emblem.resize((int(size*1.185),size),Image.Resampling.LANCZOS)
  mark.putalpha(mark.getchannel('A').point(lambda v:int(v*reveal)))
  im=im.convert('RGBA');im.alpha_composite(mark,((W-mark.width)//2,int(203-18*(1-reveal))))
  text=Image.new('RGBA',(W,H));td=ImageDraw.Draw(text)
  alpha=int(255*ease((t-6.0)/.85))
  td.text((W/2,465+12*(1-alpha/255)), '용인예술과학대학교',font=f,anchor='mm',fill=(243,246,250,alpha))
  td.text((W/2,518),'YONG-IN ARTS & SCIENCE UNIVERSITY',font=small,anchor='mm',fill=(135,168,190,alpha))
  im=Image.alpha_composite(im,text).convert('RGB')
 # Brief light bloom at assembly, then an unhurried end card.
 flash=.18*math.exp(-((t-6.05)/.14)**2)
 if flash:im=Image.blend(im,Image.new('RGB',(W,H),(175,218,245)),flash)
 fade=ease(t/.6)*(1-.65*ease((t-9.6)/.4))
 if fade<1:im=Image.blend(Image.new('RGB',(W,H)),im,fade)
 if frame in [60,135,210,270]:im.save(P/f'frame_{frame:03}.jpg')
 proc.stdin.write(im.tobytes())
proc.stdin.close()
if proc.wait():raise SystemExit('ffmpeg failed')
print(P/'YASU_Opening_10s.mp4')
