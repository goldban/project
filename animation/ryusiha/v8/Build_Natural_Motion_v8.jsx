#target aftereffects
(function(){
    var here=new File($.fileName).parent;
    for(var part=1;part<=2;part++) {
        if(!new File(here.fsName+"/Connected_Body_v8_part"+part+".mov").exists) {
            alert("Extract BOTH ZIPs into the same folder. Missing Connected_Body_v8_part"+part+".mov\nThe project has not been changed.");return;
        }
    }
    for(var side=0;side<2;side++) {
        if(!new File(here.fsName+"/assets/hair_"+(side===0?"left":"right")+".png").exists){alert("Missing assets folder.");return;}
    }
    if(!app.project)app.newProject();
    app.beginUndoGroup("Ryusiha reference idle v8");
    try {
        var p=app.project,folder=p.items.addFolder("Ryusiha v8 "+new Date().getTime());
        var c=p.items.addComp("RYUSIHA_REFERENCE_V8_12s",1280,1920,1,12,30);c.parentFolder=folder;
        c.workAreaStart=0;c.workAreaDuration=12;
        var checks=[];
        function tr(l){return l.property("ADBE Transform Group");}
        function pose(l,parent,anchor,position,scale){
            if(parent)l.parent=parent;
            tr(l).property("ADBE Anchor Point").setValue(anchor);
            tr(l).property("ADBE Position").setValue(position);
            tr(l).property("ADBE Scale").setValue(scale||[100,100]);
            tr(l).property("ADBE Rotate Z").setValue(0);
        }
        function expression(prop,code){prop.expression=code;checks.push(prop);}
        var bg=c.layers.addSolid([16/255,13/255,27/255],"BACKGROUND - disable for alpha",1280,1920,1,12);
        var controls=c.layers.addNull(12);controls.name="CONTROLS";pose(controls,null,[0,0],[0,0]);
        var slider=controls.property("ADBE Effect Parade").addProperty("ADBE Slider Control");slider.name="Hair strength";slider.property(1).setValue(1);
        var head=c.layers.addNull(12);head.name="HEAD_FOLLOW";pose(head,null,[0,0],[640,412]);
        var prefix='var t=time%12,w=2*Math.PI/12;';
        expression(tr(head).property("ADBE Position"),prefix+'[640+2.8*Math.sin(w*t),412-1.8*Math.sin(2*w*t)];');
        expression(tr(head).property("ADBE Rotate Z"),prefix+'.9*Math.sin(w*t-.3)+.25*Math.sin(2*w*t);');
        for(var side=0;side<2;side++) {
            var source=p.importFile(new ImportOptions(new File(here.fsName+"/assets/hair_"+(side===0?"left":"right")+".png")));source.parentFolder=folder;
            if(source.width!==488||source.height!==1612)throw new Error("Unexpected hair dimensions.");
            var layer=c.layers.add(source);layer.name=side===0?"HAIR_LEFT":"HAIR_RIGHT";
            pose(layer,head,[side===0?488:0,258],[0,0]);
            expression(tr(layer).property("ADBE Rotate Z"),prefix+'var a=clamp(thisComp.layer("CONTROLS").effect("Hair strength")(1),0,2);'+(side===0?1:-1)+'*.45*a*Math.sin(w*t'+(side===0?'-.8':'-1.2')+');');
        }
        for(var part=1;part<=2;part++) {
            var movie=p.importFile(new ImportOptions(new File(here.fsName+"/Connected_Body_v8_part"+part+".mov")));movie.parentFolder=folder;
            movie.mainSource.conformFrameRate=30;movie.mainSource.alphaMode=AlphaMode.STRAIGHT;
            if(movie.duration<5.99)throw new Error("Incomplete body movie "+part);
            var layer=c.layers.add(movie);layer.name="BODY_RIG_RENDER_PART_"+part;pose(layer,null,[0,0],[0,0],[200,200]);
            layer.startTime=(part-1)*6;layer.inPoint=(part-1)*6;layer.outPoint=part*6;
        }
        controls.moveToBeginning();head.moveToBeginning();bg.moveToEnd();
        for(var k=0;k<checks.length;k++){checks[k].valueAtTime(3,false);if(checks[k].expressionError)throw new Error(checks[k].expressionError);}
        c.time=0;c.openInViewer();
        alert("Created RYUSIHA_REFERENCE_V8_12s.\nReference-inspired idle motion; body motion is baked.\nSave the AEP with both MOV files and the assets folder.");
    }catch(e){alert("Setup stopped: "+e.toString()+"\nUndo before retrying.");}
    finally{app.endUndoGroup();}
}());
