"""Connected-body v5: continuous inverse deformation, premultiplied alpha sampling.
Requires Pillow, NumPy, SciPy and FFmpeg. Writes 480 transparent body frames.
"""
from pathlib import Path
import math,json,subprocess
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates
P=Path(__file__).resolve().parent
SPEC=json.loads((P/'motion.json').read_text()); FPS=30;DURATION=16
W,H=640,960

def smooth(x):
 x=np.clip(x,0,1);return x*x*(3-2*x)
def parameters(t):
 t=t%16;w=2*math.pi/16
 g=lambda a,b,c,d:float(smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c))))
 e=dict(t=t,w=w,sin=math.sin,g1=g(2.6,3.4,4.1,5.3),g2=g(9.7,10.6,11.2,12.4))
 return {k:eval(v,{'__builtins__':{}},e) for k,v in SPEC['expressions'].items()}
def mat(x,y,a=0,sx=1,sy=1):
 a=math.radians(a);c=math.cos(a);s=math.sin(a)
 return np.array([[c*sx,-s*sy,x],[s*sx,c*sy,y],[0,0,1.]])
def motion(t):
 v=parameters(t);root=mat(640,1690,v['root_roll'])@mat(-640,-1690)
 body=root@mat(640+v['body_x'],704+v['body_y'],v['body_roll'],1,1+v['breath']/100)
 head=body@mat(v['head_x'],-292+v['head_y'],v['head_roll'])
 return root,body,head

def blink(t):
 result=0
 for center in SPEC['blink_centers']:
  d=t%16-center
  if -.09<=d<0:b=float(smooth((d+.09)/.09))
  elif 0<=d<.025:b=1
  elif .025<=d<.195:b=1-float(smooth((d-.025)/.17))
  else:b=0
  result=max(result,b)
 return result

original=Image.open(P/'assets/body_base.png').convert('RGBA')
sources=[]
for i in range(25):
 im=original.copy();head=Image.open(P/'blink'/f'head_{i:03d}.png').convert('RGBA')
 # The head crop belongs to the same original body. Paste keeps transparency.
 im.paste(head,(340,0))
 a=np.asarray(im.resize((488,806),Image.Resampling.LANCZOS)).astype(np.float32)/255
 a[:,:,:3]*=a[:,:,3:4];sources.append(a)
y,x=np.mgrid[:H,:W].astype(np.float32)
world=np.stack([x*2,y*2,np.ones_like(x)]).reshape(3,-1)
# Smooth weights on a single surface: no independently moving cut edges.
body_weight=(1-smooth((y*2-650)/350)).reshape(-1)
head_weight=(1-smooth((y*2-390)/100)).reshape(-1)
arm_height=smooth((y*2-480)/360).reshape(-1)
left_weight=(1-smooth((x*2-450)/100)).reshape(-1)*arm_height
right_weight=smooth((x*2-730)/100).reshape(-1)*arm_height
hair={n:Image.open(P/'assets'/f'{n}.png').convert('RGBA') for n in ['hair_left','hair_right']}

def body_frame(t):
 root,body,head=motion(t);v=parameters(t)
 r=np.linalg.inv(root)@world
 b=np.linalg.inv(body@mat(-640,-704))@world
 h=np.linalg.inv(head@mat(-640,-412))@world
 pos=r+(b-r)*body_weight+(h-b)*head_weight
 # Smooth sleeve/hand displacement grows below the shoulder; the attachment
 # itself has zero displacement. Both fields share all surrounding pixels.
 for name,weight,shoulder in [('arm_left',left_weight,546),('arm_right',right_weight,738)]:
  angle=math.radians(v[name]);dy=np.maximum(0,pos[1]-469)
  pos[0]+=angle*dy*weight
  pos[1]-=angle*(pos[0]-shoulder)*weight*.35
 coords=[((pos[1]-154)/2).reshape(H,W),((pos[0]-152)/2).reshape(H,W)]
 src=sources[int(math.floor(blink(t)*24+.5))]
 out=np.stack([map_coordinates(src[:,:,k],coords,order=1,mode='constant',cval=0,prefilter=False) for k in range(4)],axis=2)
 out[:,:,:3]=np.divide(out[:,:,:3],out[:,:,3:4],out=np.zeros_like(out[:,:,:3]),where=out[:,:,3:4]>1e-6)
 return Image.fromarray(np.uint8(np.clip(out*255,0,255)))

def place(dst,im,m,anchor):
 m=mat(0,0,sx=.5,sy=.5)@m@mat(-anchor[0],-anchor[1]);inv=np.linalg.inv(m)
 tile=im.transform((W,H),Image.Transform.AFFINE,tuple(inv[:2].ravel()),Image.Resampling.BICUBIC)
 dst.alpha_composite(tile)
def frame(t,body=None):
 _,_,head=motion(t);v=parameters(t);out=Image.new('RGBA',(W,H),(16,13,27,255))
 for name,anchor in [('hair_left',(488,258)),('hair_right',(0,258))]:place(out,hair[name],head@mat(0,0,v[name]),anchor)
 out.alpha_composite(body if body is not None else body_frame(t))
 return out.convert('RGB')
if __name__=='__main__':
 (P/'body_sequence').mkdir(exist_ok=True)
 proc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pixel_format','rgb24','-video_size','640x960','-framerate','30','-i','-','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',str(P/'Natural_Motion_v5_Preview.mp4')],stdin=subprocess.PIPE)
 for i in range(480):
  t=i/30;b=body_frame(t);b.save(P/'body_sequence'/f'body_{i:04d}.png')
  proc.stdin.write(frame(t,b).tobytes())
  if i%60==0:print(f'{i}/480',flush=True)
 proc.stdin.close();assert proc.wait()==0
 frame(3.5).save(P/'Preview.png')

 for part in [1,2]:
  subprocess.run(['ffmpeg','-y','-v','error','-framerate','30','-start_number',str((part-1)*240),'-i',str(P/'body_sequence/body_%04d.png'),'-frames:v','240','-c:v','png','-pred','mixed','-compression_level','9','-pix_fmt','rgba',str(P/f'Connected_Body_v5_part{part}.mov')],check=True)
