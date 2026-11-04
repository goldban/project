from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np, math, subprocess, wave, json
from pathlib import Path
P=Path(__file__).resolve().parent; W,H=720,1280; FPS=30; DUR=25
font='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
fonts={s:ImageFont.truetype(font,s,index=1) for s in [20,24,28,32,38,48,56,64,72,84,96,112]}
mascot=Image.open(P/'assets/mascot.png').convert('RGBA')
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

def cinema_intro(t):
 im=Image.new('RGB',(W,H),'#16101C');d=ImageDraw.Draw(im)
 palette=['#822F36','#C79B77','#493331','#E8CFB3','#009FE3','#DE007C']
 u=ease(t/2.2)
 for row in range(7):
  for col in range(5):
   idx=row*5+col;cx=(col+.5)*144;cy=(row+.5)*184
   lag=(idx%7)*.055;k=ease((t-lag)/1.4)
   width=max(4,int(136*abs(math.cos((1-k)*math.pi*.9))))
   size=1+.24*(1-u)
   xx=int(cx+(col-2)*250*(1-k));yy=int(cy+(row-3)*180*(1-k))
   d.rectangle((xx-width//2,yy-86,xx+width//2,yy+86),fill=palette[(row+col)%len(palette)])
 # The final caption resolves over darkened tiles, as a cinema-ident opener.
 im=Image.blend(im,Image.new('RGB',(W,H),'#100C16'),.28)
 if t>.8:
  text(im,'다채로운 이야기가',530,48,fill='#FFF5E5',dx=650*(1-ease((t-.8)/.5)))
 if t>1.4:text(im,'하나의 스크린으로',650,56,fill='#FFF5E5',scale=.75+.25*ease((t-1.4)/.5))
 badge(im,'FIRST BUTTON · 시안',t)
 return im

def university_end(t):
 q=t-20;im=Image.new('RGB',(W,H),'#FFF8EE');d=ImageDraw.Draw(im)
 # Vector reconstruction of the attached logo, normalized from the supplied reference.
 polys=[([(230,0),(1320,0),(775,545)],'#009FE3',(-600,-500)), ([(0,40),(547,587),(0,1118)],'#E4007F',(-800,200)), ([(1366,70),(1366,1152),(323,1152)],'#2A1C18',(800,650))]
 scale=.28;ox=360-1366*scale/2;oy=500-1152*scale/2
 for idx,(pts,color,delta) in enumerate(polys):
  u=ease((q-idx*.13)/1.25)
  vertices=[(ox+x*scale+delta[0]*(1-u),oy+y*scale+delta[1]*(1-u)) for x,y in pts]
  d.polygon(vertices,fill=color)
 if q>1:
  text(im,'용인예술과학대학교',790,56,fill='#2A1C18',dx=650*(1-ease((q-1)/.65)))
 if q>1.7:
  text(im,'첫단추',890,38,fill='#822F36')
  text(im,'2026.11.26  극장 개봉',965,28,fill='#70443A')
 return im

def frame(t):
 if t<3.5:return cinema_intro(t)
 if t>=20:return university_end(t)
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
  u=ease((t-15)/.75)
  offset=int(1300*(1-u)-14*math.sin(max(0,t-15.75)*math.pi*3)*math.exp(-max(0,t-15.75)*5))
  group=Image.new('RGBA',(W,H));gd=ImageDraw.Draw(group)
  gd.rounded_rectangle((80,240,640,640),radius=28,fill='#FFF8E8',outline='#7D4526',width=10)
  gd.rounded_rectangle((94,254,626,626),radius=20,outline='#DCB18A',width=2)
  # The mascot cutout is positioned using measured alpha bounds without modifying the source asset.
  bounds=mascot.getchannel('A').point(lambda a:255 if a>128 else 0).getbbox();visibleW=bounds[2]-bounds[0];visibleH=bounds[3]-bounds[1]
  scale=500/visibleW
  sprite=mascot.resize((int(mascot.width*scale),int(mascot.height*scale)),Image.Resampling.LANCZOS)
  xx=int(360-(bounds[0]+bounds[2])*.5*scale);yy=int(620-bounds[1]*scale)
  group.alpha_composite(sprite,(xx,yy))
  text(group,'첫단추',365,96,fill='#452B24')
  text(group,'2026.11.26',510,64,fill='#822F36')
  text(group,'극장 개봉',600,38,fill='#70443A')
  im=im.convert('RGBA');im.alpha_composite(group,(0,offset));im=im.convert('RGB')
  if t>16:text(im,'첫단추, 극장에서 만나요',1130,32,fill='#822F36')
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
for tm in [0,1.5,3.5,5.3,7.1,8.9,13,15,20,21,22,23]:
 pos=int(tm*sr);tt=np.arange(int(.38*sr))/sr
 tone=(np.sin(2*np.pi*660*tt)+.4*np.sin(2*np.pi*990*tt))*np.exp(-tt*12)*.09
 n=min(len(tone),len(a)-pos);a[pos:pos+n]+=tone[:n,None]
# Original closing sound signature: three soft chords with decaying harmonics.
for tm,notes in [(20.3,[220,330,440]),(21.3,[261.63,392,523.25]),(22.4,[293.66,440,587.33])]:
 pos=int(tm*sr);tt=np.arange(int(2.4*sr))/sr
 chord=sum(np.sin(2*np.pi*freq*tt)+.18*np.sin(2*np.pi*freq*2*tt) for freq in notes)*np.exp(-tt*2.5)*.045
 chord*=np.minimum(tt/.025,1)
 n=min(len(chord),len(a)-pos);a[pos:pos+n]+=chord[:n,None]
a[-sr:]*=np.linspace(1,0,sr)[:,None]
with wave.open(str(P/'assets/university-rhythm.wav'),'wb') as f:f.setnchannels(2);f.setsampwidth(2);f.setframerate(sr);f.writeframes((np.clip(a,-1,1)*32767).astype('<i2').tobytes())
proc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','720x1280','-r','30','-i','-','-i',str(P/'assets/university-rhythm.wav'),'-vf','scale=1080:1920','-c:v','libx264','-preset','fast','-crf','19','-threads','4','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',str(P/'first_button_university_v5.mp4')],stdin=subprocess.PIPE)
for i in range(FPS*DUR):
 im=frame(i/FPS);proc.stdin.write(im.tobytes())
 if i in [20,70,145,215,285,380,510,570,675,720]:im.save(P/f'shot-{i}.jpg')
 if i%90==0:print(f'{i}/{FPS*DUR}',flush=True)
proc.stdin.close();assert proc.wait()==0
print('RENDER COMPLETE',flush=True)
