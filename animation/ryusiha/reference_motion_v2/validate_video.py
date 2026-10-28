"""Decode every output frame and report video metadata and loop continuity."""
import json, subprocess, hashlib
from pathlib import Path
import numpy as np

p=Path(__file__).parent
v=p/'character_reference_v2.mp4'
subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(v),'-f','null','-'],check=True)
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_entries','stream=codec_name,width,height,pix_fmt,r_frame_rate,nb_read_frames:format=duration,size','-of','json',str(v)]))
s=info['streams'][0]
assert s['width']==1920 and s['height']==1080 and s['nb_read_frames']=='300'
assert float(info['format']['duration'])==10
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(v),'-vf','scale=320:180','-f','rawvideo','-pix_fmt','rgb24','-'])
a=np.frombuffer(raw,dtype=np.uint8).reshape(300,180,320,3).astype(np.float32)
adj=np.abs(a[1:]-a[:-1]).mean(axis=(1,2,3))
seam=float(np.abs(a[-1]-a[0]).mean())
# Compression changes and periodic motion are measured, not hidden by a dissolve.
assert np.isfinite(a).all() and float(adj.mean())>0
assert seam<max(float(adj.max())*1.5,1.0)
report={'metadata':info,'full_decode':'PASS: 300 frames','loop_continuity_check':'PASS','seam_mean_pixel_difference':seam,'mean_adjacent_pixel_difference':float(adj.mean()),'max_adjacent_pixel_difference':float(adj.max()),'video_sha256':hashlib.sha256(v.read_bytes()).hexdigest(),'reference_reviewed':'12.mp4, 9.95 seconds, 854x480, 60fps','limitations':['Original pose retained; no arm extension, lip sync, or gaze animation','Continuous image deformation, not a separated Live2D rig','Silent output; reference audio not copied']}
(p/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
