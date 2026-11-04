from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, math, subprocess, wave, json
from pathlib import Path
P=Path(__file__).resolve().parent; W,H=720,1280; FPS=30; DUR=20
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
fonts={s:ImageFont.truetype(font,s,index=1) for s in [20,24,28,32,38,48,56,64,72,84,96,112]}
bg=Image.open(P/'assets/background.png').convert('RGB').resize((W,H),Image.Resampling.LANCZOS)
y,x=np.mgrid[:H,:W]; glow=np.exp(-(((x-360)/450)**2+((y-600)/650)**2))
dark=np.stack([15+44*glow,12+15*glow,38+68*glow],2).astype('uint8'); dark=Image.fromarray(dark)
def ease(v): return 1-(1-max(0,min(1,v)))**3
def text(im,s,cy,size=64,fill='#452B24',dx=0,scale=1):
 f=fonts[size]; layer=Image.new('RGBA',(W,260)); d=ImageDraw.Draw(layer); box=d.textbbox((0,0),s,font=f); tw=box[2]-box[0]; d.text(((W-tw)/2,85-box[1]),s,font=f,fill=fill)
 if scale!=1:
  layer=layer.resize((max(1,int(W*scale)),max(1,int(260*scale))),Image.Resampling.BICUBIC)
 im.paste(layer,(int((W-layer.width)/2+dx),int(cy-layer.height/2)),layer)
def badge(im,label,t):
 d=ImageDraw.Draw(im);d.rounded_rectangle((42,60,270,103),radius=21,fill='#F9DFC1');d.text((61,66),label,font=fonts[20],fill='#58342A')
 d.rounded_rectangle((42,1196,678,1201),radius=2,fill='#D7D9E5');d.rounded_rectangle((42,1196,42+int(636*t/DUR),1201),radius=2,fill='#822F36')
def montage(t):
 im=Image.blend(bg,Image.new('RGB',(W,H),'#FFF2DF'),.23); d=ImageDraw.Draw(im)
 labels=['단편영화','다큐','홍보 영상']; colors=[(113,57,51),(126,91,61),(155,101,67)]
 def panel(idx,box):
  x0,y0,x1,y1=map(int,box);w=x1-x0;h=y1-y0
  tile=Image.new('RGB',(w,h),colors[idx]);td=ImageDraw.Draw(tile)
  for k in range(7):
   xx=int((k*130+t*70)% (w+200))-100
   td.line((xx,-50,xx-160,h+50),fill=tuple(min(255,c+22) for c in colors[idx]),width=30)
  for xx in range(12,w-10,32):
   td.rectangle((xx,8,xx+16,16),fill='#DFDFED');td.rectangle((xx,h-16,xx+16,h-8),fill='#DFDFED')
  im.paste(tile,(x0,y0));text(im,labels[idx],(y0+y1)/2-12,48,fill='#FFF3E4')
  text(im,'영상 교체 영역',(y0+y1)/2+45,24,fill='#FFF1DE')
 if t<8.9:
  idx=min(2,int((t-3.5)/1.8));text(im,labels[idx],320,84,dx=(1-ease(((t-3.5)%1.8)/.3))*750)
  panel(idx,(35,470,685,840));text(im,'하나의 스크린에서 만나는',940,32,fill='#70443A')
 else:
  u=ease((t-8.9)/.6)
  for idx in range(3):
   dx=int((idx-1)*850*(1-u));panel(idx,(104+dx,210+idx*300,616+dx,498+idx*300))
  text(im,'단편영화 · 다큐 · 홍보 영상',135,32,fill='#70443A')
  if t>=13:
   im=Image.blend(bg,Image.new('RGB',(W,H),'#FFF2DF'),.35)
   text(im,'이 모든 영상을,',530,56,dx=-(1-ease((t-13)/.35))*700)
   text(im,'영화관에서',680,84,fill='#822F36',dx=(1-ease((t-13.2)/.35))*700)
 badge(im,'MOTION TEASER · 시안',t)
 return im

def frame(t):
 if 3.5<=t<15:return montage(t)
 im=bg.copy()
 if t<3.5:
  if t<1.5:
   text(im,'잠깐,',320,112,dx=-700*(1-ease(t/.4)))
   text(im,'여기 봐!',480,96,fill='#822F36',dx=700*(1-ease((t-.18)/.4)))
  else:
   text(im,'새로운 이야기가',310,56,dx=700*(1-ease((t-1.5)/.4)))
   text(im,'시작돼',460,96,fill='#822F36',scale=.7+.3*ease((t-1.5)/.4))
  text(im,'하나의 스크린, 다채로운 이야기',620,28,fill='#70443A')
 else:
  text(im,'[ 작품명 ]',270,64,dx=700*(1-ease((t-15)/.4)))
  text(im,'개봉일 입력',410,72,fill='#822F36',scale=.8+.2*ease((t-15.2)/.4))
  text(im,'YYYY.MM.DD',510,38,fill='#70443A')
  text(im,'단편영화 · 다큐 · 홍보 영상',610,28,fill='#70443A')
  text(im,'극장에서 만나요',690,38,fill='#822F36')
 badge(im,'MOTION TEASER · 시안',t)
 return im
# Original minimal 120 BPM rhythm, no audio copied from reference.
sr=48000; a=np.zeros((sr*DUR,2),np.float32);rng=np.random.default_rng(7)
for k in range(DUR*2):
 pos=int(k*.5*sr); tt=np.arange(int(.22*sr))/sr
 kick=np.sin(2*np.pi*(48*tt+7*(1-np.exp(-tt*25))))*np.exp(-tt*27)*.34
 n=min(len(kick),len(a)-pos);a[pos:pos+n]+=kick[:n,None]
 if k%2:
  tt=np.arange(int(.13*sr))/sr;sn=rng.normal(0,.055,len(tt))*np.exp(-tt*36);n=min(len(sn),len(a)-pos);a[pos:pos+n]+=sn[:n,None]
for tm in [0,1.5,3.5,5.3,7.1,8.9,13,15]:
 pos=int(tm*sr);tt=np.arange(int(.38*sr))/sr
 tone=(np.sin(2*np.pi*660*tt)+.4*np.sin(2*np.pi*990*tt))*np.exp(-tt*12)*.09
 n=min(len(tone),len(a)-pos);a[pos:pos+n]+=tone[:n,None]
a[-sr:]*=np.linspace(1,0,sr)[:,None]
with wave.open(str(P/'film-rhythm.wav'),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((np.clip(a,-1,1)*32767).astype('<i2').tobytes())
proc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r','30','-i','-','-i',str(P/'film-rhythm.wav'),'-vf','scale=1080:1920','-c:v','libx264','-preset','fast','-crf','19','-threads','4','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',str(P/'character_teaser_film_v3.mp4')],stdin=subprocess.PIPE)
for i in range(FPS*DUR):
 im=frame(i/FPS);proc.stdin.write(im.tobytes())
 if i in [20,70,145,215,285,380]:im.save(P/f'shot-{i}.jpg')
 if i%90==0:print(f'{i}/{FPS*DUR}',flush=True)
proc.stdin.close();assert proc.wait()==0
print('RENDER COMPLETE',flush=True)
