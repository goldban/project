#target photoshop
app.bringToFront();
(function(){
 var root=new File($.fileName).parent;
 var oldUnits=app.preferences.rulerUnits;
 app.preferences.rulerUnits=Units.PIXELS;
 function id(s){return charIDToTypeID(s);}
 function addWhiteStroke(){
  var ref=new ActionReference();ref.putProperty(id('Prpr'),id('Lefx'));ref.putEnumerated(id('Lyr '),id('Ordn'),id('Trgt'));
  var effect=new ActionDescriptor();effect.putUnitDouble(id('Scl '),id('#Prc'),100);
  var stroke=new ActionDescriptor();stroke.putBoolean(id('enab'),true);stroke.putEnumerated(id('Styl'),id('FStl'),id('OutF'));stroke.putEnumerated(id('PntT'),id('FrFl'),id('SClr'));stroke.putEnumerated(id('Md  '),id('BlnM'),id('Nrml'));stroke.putUnitDouble(id('Opct'),id('#Prc'),100);stroke.putUnitDouble(id('Sz  '),id('#Pxl'),2);
  var color=new ActionDescriptor();color.putDouble(id('Rd  '),255);color.putDouble(id('Grn '),251);color.putDouble(id('Bl  '),239);stroke.putObject(id('Clr '),id('RGBC'),color);effect.putObject(id('FrFX'),id('FrFX'),stroke);
  var set=new ActionDescriptor();set.putReference(id('null'),ref);set.putObject(id('T   '),id('Lefx'),effect);executeAction(id('setd'),set,DialogModes.NO);
 }
 try{
  var base=new File(root.fsName+'/INSIDE_BASE_NO_LIST.tif');if(!base.exists)throw new Error('INSIDE_BASE_NO_LIST.tif is missing. Keep it beside this JSX file.');
  var doc=app.open(base);doc.activeLayer.name='Background - existing leaflet design';
  var rows=[['EDIT 1 - documentary title','- 사자놀이 : 속초,\r  70년을 춤추다',1636],['EDIT 2 - title','- 안녕',1751],['EDIT 3 - title','- 숨으로 빚다',1813]];
  var strokeFailures=0;
  for(var i=0;i<rows.length;i++){
   var layer=doc.artLayers.add();layer.kind=LayerKind.TEXT;layer.name=rows[i][0];var t=layer.textItem;t.kind=TextType.POINTTEXT;t.contents=rows[i][1];
   try{t.font='NotoSerifCJKkr-Bold';}catch(fontError){throw new Error('Install the provided NotoSerifCJKkr-Bold.otf font, restart Photoshop, then run this script again.');}
   t.size=UnitValue(48*72/doc.resolution,'pt');t.useAutoLeading=false;t.leading=UnitValue(57*72/doc.resolution,'pt');t.tracking=0;t.justification=Justification.LEFT;t.position=[UnitValue(300,'px'),UnitValue(rows[i][2],'px')];
   var color=new SolidColor();color.rgb.hexValue='3A2113';t.color=color;
   try{addWhiteStroke();}catch(strokeError){strokeFailures++;}
  }
  doc.guides.add(Direction.VERTICAL,UnitValue(87,'mm'));doc.guides.add(Direction.VERTICAL,UnitValue(174,'mm'));
  if(strokeFailures)alert('Text was created. Add a 2px outside white Stroke manually in Layer Style for the three text layers.');
  var output=File.saveDialog('Save the inside leaflet as an editable PSD','Photoshop:*.psd');if(output){var opts=new PhotoshopSaveOptions();opts.layers=true;opts.embedColorProfile=true;doc.saveAs(output,opts,true,Extension.LOWERCASE);}
 }catch(e){alert('Could not finish: '+e.message);}finally{app.preferences.rulerUnits=oldUnits;}
})();
