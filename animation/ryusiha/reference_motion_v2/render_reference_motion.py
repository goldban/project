"""Reference-informed 10s character motion graphic; preserves the input PSD.
Python + Pillow + NumPy + SciPy + FFmpeg. No After Effects dependency.
"""
import argparse, math, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.ndimage import map_coordinates

def render():
    p=argparse.ArgumentParser()
    p.add_argument('--source',required=True,type=Path)
    p.add_argument('--output',required=True,type=Path)
    args=p.parse_args(); out=args.output; out.mkdir(parents=True,exist_ok=True)
    W,H=1920,1080; fps=30; count=300
    # Deform at source resolution, keeping transparent padding and premultiplied alpha.
    original=Image.open(args.source).convert('RGBA').resize((800,1200),Image.Resampling.LANCZOS)
    src=Image.new('RGBA',(960,1360));src.alpha_composite(original,(80,80))
    a=np.asarray(src,dtype=np.float32)/255; a[:,:,:3]*=a[:,:,3:4]
    yy,xx=np.mgrid[:1360,:960].astype(np.float32)
    x=(xx-80)/800;y=(yy-80)/1200
    def smooth(z):
        z=np.clip(z,0,1);return z*z*(3-2*z)
    upper=1-smooth((y-.40)/.30)
    hair=smooth((np.abs(x-.5)-.16)/.13)*smooth((y-.06)/.18)*(1-smooth((y-.48)/.21))
    head=np.exp(-((y-.13)/.14)**4)*np.exp(-((x-.50)/.21)**4)
    arms=np.exp(-((np.abs(x-.5)-.28)/.10)**2)*np.exp(-((y-.40)/.17)**4)
    Y,X=np.mgrid[:H,:W].astype(np.float32)
    g=np.exp(-(((X-1000)/1100)**2+((Y-400)/800)**2))
    bg=np.stack([226+25*g,230+23*g,242+12*g],axis=2)
    background=Image.fromarray(np.clip(bg,0,255).astype('uint8')).convert('RGBA')
    encoder=subprocess.Popen(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgb24','-s','1920x1080','-r',str(fps),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'character_reference_v2.mp4')],stdin=subprocess.PIPE)
    thumbs=[]
    try:
        for i in range(count):
            t=2*math.pi*i/count
            # Body motion leads; the two hair sides lag by different phases.
            dx=4.0*np.sin(2*t)*upper+hair*7*np.sin(3*t+3*y+np.where(x<.5,-.4,-1.15))
            dx+=arms*1.3*np.sin(2*t-.6)*np.sign(x-.5)
            dx+=head*.9*np.sin(2*t+.15)
            dy=-2.2*np.sin(4*t)*upper+head*.7*np.sin(2*t)*(x-.5)
            coords=np.array([yy-dy,xx-dx])
            warped=np.stack([map_coordinates(a[:,:,c],coords,order=1,mode='constant',cval=0,prefilter=False) for c in range(4)],axis=2)
            alpha=warped[:,:,3:4]
            warped[:,:,:3]=np.divide(warped[:,:,:3],alpha,out=np.zeros_like(warped[:,:,:3]),where=alpha>1e-5)
            fg=Image.fromarray(np.clip(warped*255,0,255).astype('uint8'))
            frame=background.copy()
            # Background ribbons and changing parallax reproduce the reference's energy.
            back=Image.new('RGBA',(W,H));d=ImageDraw.Draw(back)
            shift=45*math.sin(t)
            for j in range(7):
                by=-250+j*250+shift
                d.polygon([(-200,by+360),(2120,by-190),(2120,by-135),(-200,by+415)],fill=(118+10*j,123+8*j,192+5*j,24))
                d.line([(-200,by+360),(2120,by-190)],fill=(255,255,255,100),width=3)
            for j in range(8):
                cx=960+950*math.cos(t+j*math.pi/4)
                cy=530+480*math.sin(t+j*math.pi/4)
                r=60+(j%3)*35
                d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=(110,175,204,38),width=3)
            frame=Image.alpha_composite(frame,back)
            # Source remains intact. Cropping is a deliberate upper-body composition.
            scale=2.15+.045*math.sin(2*t-.5)
            scaled=fg.resize((round(fg.width*scale),round(fg.height*scale)),Image.Resampling.BICUBIC)
            tilt=1.15*math.sin(2*t+.4)
            scaled=scaled.rotate(tilt,resample=Image.Resampling.BICUBIC,expand=False)
            px=round(W/2-scaled.width/2+25*math.sin(t))
            py=round(-90+11*math.sin(2*t-.3))
            frame.alpha_composite(scaled,(px,py))
            # Effects occupy the outer edges, leaving the face readable.
            fx=Image.new('RGBA',(W,H));d=ImageDraw.Draw(fx)
            for j in range(22):
                phase=t+j*2*math.pi/22
                cx=960+(760+80*math.sin(j))*math.cos(phase)
                cy=540+(420+35*math.cos(j))*math.sin(phase)
                length=14+(j%5)*7
                color=(140,222,235,130) if j%2 else (200,155,237,120)
                d.line((cx-length,cy+length*.25,cx+length,cy-length*.25),fill=color,width=2)
                if j%4==0:d.ellipse((cx-4,cy-4,cx+4,cy+4),fill=(255,255,255,210))
            # A few smooth pulses rather than full-frame flashing.
            pulse=max(0,math.sin(4*t-.8))**18
            for j in range(5):
                gy=160+j*183+12*math.sin(3*t+j)
                gx=45+40*math.sin(t+j)
                d.rectangle((gx,gy,gx+110+j*11,gy+5),fill=(110,211,225,round(70*pulse)))
                d.rectangle((W-gx-150,gy+65,W-gx,gy+69),fill=(182,119,229,round(70*pulse)))
            frame=Image.alpha_composite(frame,fx)
            # Cinematic inner framing follows the wide composition of the reference.
            d=ImageDraw.Draw(frame)
            d.rounded_rectangle((26,26,W-27,H-27),radius=24,outline=(255,255,255,170),width=2)
            frame=frame.convert('RGB')
            encoder.stdin.write(frame.tobytes())
            if i in {0,60,120,180,240,299}:
                frame.save(out/f'frame_{i:03d}.jpg',quality=94)
                thumbs.append(frame.resize((480,270)))
            if i%60==0:print(f'Rendered {i}/{count}',flush=True)
    finally:encoder.stdin.close()
    if encoder.wait()!=0:raise RuntimeError('Encoding failed')
    sheet=Image.new('RGB',(1440,540))
    for i,im in enumerate(thumbs):sheet.paste(im,((i%3)*480,(i//3)*270))
    sheet.save(out/'contact_sheet.jpg',quality=95)
    print('Render complete',flush=True)

if __name__=='__main__':render()
