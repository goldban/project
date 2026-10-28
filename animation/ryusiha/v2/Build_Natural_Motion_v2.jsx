#target aftereffects
(function () {
    var here = new File($.fileName).parent;
    var assets = new Folder(here.fsName + "/assets");
    if (!new File(assets.fsName + "/torso.png").exists) {
        assets = Folder.selectDialog("Select the v2 assets folder");
        if (!assets) return;
    }
    if (!app.project) app.newProject();
    app.beginUndoGroup("Ryusiha Natural Motion v2");
    try {
        var p=app.project, folder=p.items.addFolder("Ryusiha Natural v2 " + new Date().getTime());
        var c=p.items.addComp("RYUSIHA_NATURAL_V2_8s",1280,1920,1,8,30);
        c.parentFolder=folder; c.workAreaStart=0; c.workAreaDuration=8;
        var check=[];
        function tr(l) { return l.property("ADBE Transform Group"); }
        function ex(prop,code) { prop.expression=code; check.push(prop); }
        function load(name,w,h) {
            var f=new File(assets.fsName+"/"+name+".png");
            if (!f.exists) throw new Error("Missing v2 asset: "+name);
            var src=p.importFile(new ImportOptions(f)); src.parentFolder=folder;
            if(src.width!==w || src.height!==h) throw new Error("Unexpected dimensions: "+name);
            return src;
        }
        function setPose(l,parent,anchor,pos) {
            if(parent) l.parent=parent;
            var t=tr(l);
            t.property("ADBE Anchor Point").setValue(anchor);
            t.property("ADBE Position").setValue(pos);
            t.property("ADBE Scale").setValue([100,100]);
            t.property("ADBE Rotate Z").setValue(0);
        }
        function nil(name,parent,pos) {
            var l=c.layers.addNull(8);l.name=name;
            setPose(l,parent,[0,0],pos);return l;
        }
        var bg=c.layers.addSolid([0.063,0.051,0.106],"BACKGROUND - disable for alpha",1280,1920,1,8);
        var controls=nil("CONTROLS",null,[0,0]);
        function slider(name,value) {
            var f=controls.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
            f.name=name;f.property(1).setValue(value);
        }
        slider("Body and arms",1); slider("Head motion",1);
        slider("Hair strength",1); slider("Blink amount",100);
        var bodyAmount='var a=clamp(thisComp.layer("CONTROLS").effect("Body and arms")(1),0,2);';
        var headAmount='var a=clamp(thisComp.layer("CONTROLS").effect("Head motion")(1),0,2);';
        var bodyRig=nil("TORSO_RIG",null,[640,704]);
        ex(tr(bodyRig).property("ADBE Position"),bodyAmount+'[640,704-1.1*a*Math.sin(2*Math.PI*time/4)];');
        ex(tr(bodyRig).property("ADBE Rotate Z"),bodyAmount+'0.10*a*Math.sin(2*Math.PI*time/8);');
        var headRig=nil("HEAD_RIG",bodyRig,[0,-292]);
        ex(tr(headRig).property("ADBE Rotate Z"),headAmount+'0.35*a*Math.sin(2*Math.PI*time/8+0.35);');

        function hair(name,file,originalX,rootX,amp,phase) {
            // 200 transparent pixels around ALL source edges prevent effect-buffer clipping.
            var sub=p.items.addComp(name+"_PADDED_SOURCE",888,2012,1,8,30);
            sub.parentFolder=folder;
            var inside=sub.layers.add(load(file,488,1612));
            setPose(inside,null,[0,0],[200,200]);
            var l=c.layers.add(sub);l.name=name;
            setPose(l,headRig,[488-originalX+200,258+200],[0,0]);
            var fx=l.property("ADBE Effect Parade");
            if(!fx.canAddProperty("CC Bend It")) throw new Error("CC Bend It is required for hair deformation.");
            var bend=fx.addProperty("CC Bend It");
            if(bend.numProperties<3 || typeof bend.property(1).value!=="number" ||
               bend.property(2).value.length!==2 || bend.property(3).value.length!==2) {
                throw new Error("Unexpected CC Bend It property layout.");
            }
            // A VERTICAL axis starts above and ends below all visible hair.
            // No oblique cutoff plane through the lower curls, unlike v1.
            bend.property(2).setValue([rootX+200,200]);
            bend.property(3).setValue([rootX+200,1450]);
            ex(bend.property(1),'var a=clamp(thisComp.layer("CONTROLS").effect("Hair strength")(1),0,2);'+
                amp+'*a*Math.sin(2*Math.PI*time/8+'+phase+');');
        }
        hair("HAIR_L","hair_left",0,380,0.95,0);
        hair("HAIR_R","hair_right",488,106,0.85,-0.8);

        var lower=c.layers.add(load("lower_body",976,1070));lower.name="LOWER_BODY_FIXED";
        setPose(lower,null,[0,0],[152,694]);
        function arm(name,file,pivot,pos,amp,phase) {
            var l=c.layers.add(load(file,312,600));l.name=name;
            setPose(l,bodyRig,[pivot[0]-pos[0],pivot[1]-pos[1]],[pivot[0]-488,pivot[1]-550]);
            ex(tr(l).property("ADBE Rotate Z"),bodyAmount+amp+'*a*Math.sin(2*Math.PI*time/8+'+phase+');');
        }
        arm("ARM_L","arm_left",[392,315],[144,295],0.45,-0.8);
        arm("ARM_R","arm_right",[586,315],[522,295],-0.40,-1.4);
        var torso=c.layers.add(load("torso",310,310));torso.name="TORSO";
        setPose(torso,bodyRig,[158,300],[0,0]);
        var head=c.layers.add(load("head_open",290,280));head.name="HEAD_OPEN";
        setPose(head,headRig,[148,258],[0,0]);
        var eyes=c.layers.add(load("eyes_closed",144,46));eyes.name="EYELIDS_CLOSED";
        setPose(eyes,headRig,[72,108],[0,0]);
        var mask=eyes.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
        var shape=new Shape();
        shape.vertices=[[6,6],[138,6],[138,40],[6,40]];
        shape.inTangents=[[0,0],[0,0],[0,0],[0,0]];
        shape.outTangents=[[0,0],[0,0],[0,0],[0,0]];shape.closed=true;
        mask.property("ADBE Mask Shape").setValue(shape);
        mask.property("ADBE Mask Feather").setValue([5,5]);
        ex(tr(eyes).property("ADBE Opacity"),
            'var t=time%8; function b(c){if(t<c-0.10 || t>c+0.14)return 0;'+
            'if(t<c-0.02)return ease(t,c-0.10,c-0.02,0,1);'+
            'if(t<c+0.02)return 1;return ease(t,c+0.02,c+0.14,1,0);}'+
            'clamp(thisComp.layer("CONTROLS").effect("Blink amount")(1),0,100)*Math.max(b(2.45),b(5.95));');
        controls.moveToBeginning();bodyRig.moveToBeginning();headRig.moveToBeginning();bg.moveToEnd();
        c.time=0;c.openInViewer();
        for(var i=0;i<check.length;i++) {
            check[i].valueAtTime(2.45,false);
            if(check[i].expressionError) throw new Error(check[i].expressionError);
        }
        alert("Created RYUSIHA_NATURAL_V2_8s.\nArms, head, torso and eyelids now animate.\nHair has padded bounds and a vertical bend axis.\nPreview at 0, 2.45 and 5.95 seconds, then save your AEP.");
    } catch(e) {alert("Setup stopped: "+e.toString()+"\nUndo before retrying.");}
    finally {app.endUndoGroup();}
}());
