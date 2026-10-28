"""Locally rigid 2D mesh, pinned feet/hips, rigid head and hand constraints."""
import math
import numpy as np
from scipy import sparse
from scipy.sparse.linalg import factorized
from scipy.ndimage import map_coordinates, distance_transform_edt
from PIL import Image
STEP=16; W=640; H=960
class Rig:
 def __init__(self,body,lower_matte):
  gy,gx=np.mgrid[0:H+1:STEP,0:W+1:STEP];self.shape=gx.shape
  silhouette=np.asarray(lower_matte)>8
  distance=distance_transform_edt(~silhouette)
  self.protect=np.clip((6-distance)/6,0,1)
  self.protect=self.protect*self.protect*(3-2*self.protect)
  self.p=np.stack([gx,gy],axis=-1).reshape(-1,2).astype(float)
  ids=np.arange(len(self.p)).reshape(self.shape)
  self.i=np.concatenate([ids[:,:-1].ravel(),ids[:-1,:].ravel(),ids[:-1,:-1].ravel(),ids[:-1,1:].ravel()])
  self.j=np.concatenate([ids[:,1:].ravel(),ids[1:,:].ravel(),ids[1:,1:].ravel(),ids[1:,:-1].ravel()])
  self.e=self.p[self.i]-self.p[self.j]
  alpha=np.asarray(body.getchannel('A')).astype(float)/255
  middle=(self.p[self.i]+self.p[self.j])/2
  coverage=map_coordinates(alpha,[middle[:,1],middle[:,0]],order=1,mode='constant')
  self.w=(.015+.985*coverage)/np.linalg.norm(self.e,axis=1)
  x,y=self.p.T
  lower=map_coordinates(np.asarray(lower_matte).astype(float)/255,[y,x],order=1,mode='constant')>.1
  fixed=(x==0)|(x==640)|(y==0)|(y==960)|lower|(y>=560)
  occupied=map_coordinates(alpha,[y,x],order=0,mode='constant')>.5
  self.groups={}
  self.groups['head']=np.flatnonzero(occupied&(y<202)&(x>244)&(x<394))
  for name,point,r in [('shoulder_l',(272,236),15),('shoulder_r',(369,236),15),('elbow_l',(216,365),18),('elbow_r',(424,365),18),('hand_l',(185,500),20),('hand_r',(452,500),20)]:
   self.groups[name]=np.flatnonzero(occupied&(np.linalg.norm(self.p-np.array(point),axis=1)<r))
   if not len(self.groups[name]):raise ValueError('Empty control '+name)
  pinned=fixed.copy()
  for g in self.groups.values():pinned[g]=True
  self.pin=np.flatnonzero(pinned);self.free=np.flatnonzero(~pinned)
  ii=np.r_[self.i,self.j,self.i,self.j];jj=np.r_[self.i,self.j,self.j,self.i];vv=np.r_[self.w,self.w,-self.w,-self.w]
  L=sparse.coo_matrix((vv,(ii,jj)),shape=(len(self.p),len(self.p))).tocsc()
  self.lp=L[self.free][:,self.pin];self.solve=factorized(L[self.free][:,self.free])
  yy,xx=np.mgrid[:H,:W].astype(float);self.xy=np.stack([xx,yy])
 def controls(self,t):
  w=2*math.pi/12;t=t%12
  torso=np.array([1.4*math.sin(w*t),-.9*math.sin(2*w*t)])
  angle=math.radians(.9*math.sin(w*t-.3)+.25*math.sin(2*w*t))
  R=np.array([[math.cos(angle),-math.sin(angle)],[math.sin(angle),math.cos(angle)]])
  return torso,angle,R
 def mesh(self,t):
  torso,angle,R=self.controls(t);w=2*math.pi/12
  target=self.p.copy()
  g=self.groups['head'];target[g]=(self.p[g]-[320,206])@R.T+[320,206]+torso
  for side,phase,sign in [('l',-.65,1),('r',-1.15,-1)]:
   sh=np.array([272,236]) if side=='l' else np.array([369,236])
   a=math.radians(sign*1.2*math.sin(w*t+phase));c=math.cos(a);s=math.sin(a);armR=np.array([[c,-s],[s,c]])
   for segment in ['shoulder','elbow','hand']:
    g=self.groups[segment+'_'+side]
    target[g]=(self.p[g]-sh)@armR.T+sh+torso
  q=target.copy()
  for iteration in range(9):
   d=q[self.i]-q[self.j]
   dot=self.w*np.sum(self.e*d,axis=1);cross=self.w*(self.e[:,0]*d[:,1]-self.e[:,1]*d[:,0])
   a=np.bincount(self.i,dot,minlength=len(q))+np.bincount(self.j,dot,minlength=len(q))
   b=np.bincount(self.i,cross,minlength=len(q))+np.bincount(self.j,cross,minlength=len(q))
   theta=np.arctan2(b,a);co=np.cos(theta);si=np.sin(theta)
   ex,ey=self.e.T;cc=(co[self.i]+co[self.j])/2;ss=(si[self.i]+si[self.j])/2
   edge=self.w[:,None]*np.stack([cc*ex-ss*ey,ss*ex+cc*ey],axis=1)
   rhs=np.stack([np.bincount(self.i,edge[:,k],minlength=len(q))-np.bincount(self.j,edge[:,k],minlength=len(q)) for k in range(2)],axis=1)
   q[self.free]=self.solve(rhs[self.free]-self.lp@target[self.pin]);q[self.pin]=target[self.pin]
  return q
 def coordinates(self,q):
  delta=(q-self.p).reshape(*self.shape,2)
  inv=self.xy.copy()
  for _ in range(5):
   coords=[inv[1]/STEP,inv[0]/STEP]
   inv[0]=self.xy[0]-map_coordinates(delta[:,:,0],coords,order=1,mode='nearest')
   inv[1]=self.xy[1]-map_coordinates(delta[:,:,1],coords,order=1,mode='nearest')
  inv=self.xy+(inv-self.xy)*(1-self.protect)
  return inv
