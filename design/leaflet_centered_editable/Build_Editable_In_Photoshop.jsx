#target photoshop
app.bringToFront();
(function(){
 var root=new File($.fileName).parent;
 var oldUnits=app.preferences.rulerUnits;
 app.preferences.rulerUnits=Units.PIXELS;
 try {
 var doc=app.documents.add(UnitValue(3047,'px'),UnitValue(2157,'px'),299.97596899224806,'OUTSIDE_centered_EDITABLE',NewDocumentMode.RGB,DocumentFill.TRANSPARENT);
 function place(name,label,x,y){
  var f=new File(root.fsName+'/assets/'+name);
  if(!f.exists)throw new Error('Missing asset: '+f.fsName);
  var src=app.open(f),s=src.activeLayer;
  var bx=s.bounds[0].as('px'),by=s.bounds[1].as('px');
  var target=s.duplicate(doc,ElementPlacement.PLACEATBEGINNING);
  src.close(SaveOptions.DONOTSAVECHANGES);app.activeDocument=doc;
  target.name=label;target.translate(UnitValue(x+bx-target.bounds[0].as('px'),'px'),UnitValue(y+by-target.bounds[1].as('px'),'px'));
  return target;
 }
 place('paper_background.png','01 Paper and film background',0,0);
 place('left_original.png','02 LEFT event information - original raster',0,0);
 place('camera_ready.png','03 CAMERA - move independently',1181,580);
 var texts=[{"name": "04 EDIT Middle message", "text": "우리의 시작, 그리고 오래 기억될 장면", "center": 1541.2151162790697, "baseline": 1210, "fontSize": 83.40445156076646, "font": "NanumBrush"}, {"name": "05 EDIT Main title", "text": "첫단추", "center": 2550.9767441860467, "baseline": 655, "fontSize": 400, "font": "NanumBrush"}, {"name": "06 EDIT Tagline", "text": "지금, 우리의 첫 단추가 시작된다", "center": 2550.9767441860467, "baseline": 798, "fontSize": 83, "font": "NanumBrush"}, {"name": "07 EDIT University department", "text": "용인예술과학대학교 방송영화제작과", "center": 2550.9767441860467, "baseline": 866, "fontSize": 37, "font": "NanumMyeongjo"}, {"name": "08 EDIT Screening label", "text": "졸업 작품 시사회", "center": 2550.9767441860467, "baseline": 913, "fontSize": 37, "font": "NanumMyeongjo"}, {"name": "09 EDIT Date and venue", "text": "2026년 11월 26일 CGV 기흥", "center": 2550.9767441860467, "baseline": 1982, "fontSize": 45, "font": "NanumMyeongjo"}];
 for(var i=0;i<texts.length;i++){
  var e=texts[i],l=doc.artLayers.add();l.kind=LayerKind.TEXT;l.name=e.name;
  var t=l.textItem;t.kind=TextType.POINTTEXT;t.contents=e.text;t.justification=Justification.CENTER;
  try{t.font=e.font;}catch(fontError){throw new Error('Install the two provided fonts first: Nanum Brush Script and Nanum Myeongjo.');}
  t.size=UnitValue(e.fontSize*72/299.97596899224806,'pt');t.position=[UnitValue(e.center,'px'),UnitValue(e.baseline,'px')];
  var c=new SolidColor();c.rgb.hexValue=(i===1?'733507':(i>=3?'64320E':'713A16'));t.color=c;
  if(i>=3){try{t.fauxBold=true;}catch(ignore){}}
 }
 doc.guides.add(Direction.VERTICAL,UnitValue(1027.4767441860465,'px'));
 doc.guides.add(Direction.VERTICAL,UnitValue(2054.953488372093,'px'));
 var options=new PhotoshopSaveOptions();options.layers=true;options.embedColorProfile=true;
 var out=File.saveDialog('Save the editable centered leaflet PSD','Photoshop:*.psd');
 if(out)doc.saveAs(out,options,true,Extension.LOWERCASE);
 }catch(e){alert('Could not finish: '+e.message);}
 finally{app.preferences.rulerUnits=oldUnits;}
})();
