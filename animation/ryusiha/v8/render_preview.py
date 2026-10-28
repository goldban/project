"""Connected-body v8: continuous inverse deformation, premultiplied alpha sampling.
Requires Pillow, NumPy, SciPy and FFmpeg. Writes 480 transparent body frames.
"""
from pathlib import Path
import math,json,subprocess
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates, distance_transform_edt
P=Path(__file__).resolve().parent
SPEC={'blink_centers':[2.2,6.8,10.1]}; FPS=30;DURATION=12
W,H=640,960

def smooth(x):
 x=np.clip(x,0,1);return x*x*(3-2*x)
def mat(x,y,a=0,sx=1,sy=1):
 a=math.radians(a);c=math.cos(a);s=math.sin(a)
 return np.array([[c*sx,-s*sy,x],[s*sx,c*sy,y],[0,0,1.]])

def blink(t):
 result=0
 for center in SPEC['blink_centers']:
  d=t%12-center
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
from rig import Rig
canvas=Image.new('RGBA',(W,H));canvas.paste(original.resize((488,806),Image.Resampling.LANCZOS),(76,77))
lower=Image.new('L',(W,H),0)
lower.paste(Image.open(P/'assets/lower_body_reference.png').getchannel('A').resize((488,535),Image.Resampling.LANCZOS),(76,347))
rig=Rig(canvas,lower)
hair={n:Image.open(P/'assets'/f'{n}.png').convert('RGBA') for n in ['hair_left','hair_right']}

def body_frame(t):
 pos=rig.coordinates(rig.mesh(t))
 coords=[pos[1]-77,pos[0]-76]
 src=sources[int(math.floor(blink(t)*24+.5))]
 out=np.stack([map_coordinates(src[:,:,k],coords,order=1,mode='constant',cval=0,prefilter=False) for k in range(4)],axis=2)
 out[:,:,:3]=np.divide(out[:,:,:3],out[:,:,3:4],out=np.zeros_like(out[:,:,:3]),where=out[:,:,3:4]>1e-6)
 return Image.fromarray(np.uint8(np.clip(out*255,0,255)))

def place(dst,im,m,anchor):
 m=mat(0,0,sx=.5,sy=.5)@m@mat(-anchor[0],-anchor[1]);inv=np.linalg.inv(m)
 tile=im.transform((W,H),Image.Transform.AFFINE,tuple(inv[:2].ravel()),Image.Resampling.BICUBIC)
 dst.alpha_composite(tile)
def frame(t,body=None):
 torso,angle,R=rig.controls(t);out=Image.new('RGBA',(W,H),(16,13,27,255))
 head=mat(640+2*torso[0],412+2*torso[1],math.degrees(angle));w=2*math.pi/12
 for name,anchor,phase,sign in [('hair_left',(488,258),-.8,1),('hair_right',(0,258),-1.2,-1)]:
  place(out,hair[name],head@mat(0,0,sign*.45*math.sin(w*t+phase)),anchor)
 out.alpha_composite(body if body is not None else body_frame(t))
 return out.convert('RGB')
if __name__=='__main__':
 (P/'body_sequence').mkdir(exist_ok=True)
 proc=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pixel_format','rgb24','-video_size','640x960','-framerate','30','-i','-','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',str(P/'Natural_Motion_v8_Preview.mp4')],stdin=subprocess.PIPE)
 for i in range(360):
  t=i/30;b=body_frame(t);b.save(P/'body_sequence'/f'body_{i:04d}.png')
  proc.stdin.write(frame(t,b).tobytes())
  if i%60==0:print(f'{i}/360',flush=True)
 proc.stdin.close();assert proc.wait()==0
 frame(3.5).save(P/'Preview.png')

 for part in [1,2]:
  subprocess.run(['ffmpeg','-y','-v','error','-framerate','30','-start_number',str((part-1)*180),'-i',str(P/'body_sequence/body_%04d.png'),'-frames:v','180','-c:v','png','-pred','mixed','-compression_level','9','-pix_fmt','rgba',str(P/f'Connected_Body_v8_part{part}.mov')],check=True)
