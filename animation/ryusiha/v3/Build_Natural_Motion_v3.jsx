#target aftereffects
(function () {
    var here = new File($.fileName).parent;
    var assets = new Folder(here.fsName + "/assets");
    if (!new File(assets.fsName + "/torso.png").exists) {
        assets = Folder.selectDialog("Select the v3 assets folder");
        if (!assets) return;
    }
    if (!app.project) app.newProject();
    app.beginUndoGroup("Ryusiha Natural Motion v3");
    try {
        var p=app.project, folder=p.items.addFolder("Ryusiha Natural v3 " + new Date().getTime());
        var c=p.items.addComp("RYUSIHA_NATURAL_V3_8s",1280,1920,1,8,60);
        c.parentFolder=folder; c.workAreaStart=0; c.workAreaDuration=8;
        var check=[];
        function tr(l) { return l.property("ADBE Transform Group"); }
        function ex(prop,code) { prop.expression=code; check.push(prop); }
        function load(name,w,h) {
            var f=new File(assets.fsName+"/"+name+".png");
            if (!f.exists) throw new Error("Missing v3 asset: "+name);
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
        var root=nil("WEIGHT_SHIFT",null,[640,1690]);
        tr(root).property("ADBE Anchor Point").setValue([640,1690]);
        ex(tr(root).property("ADBE Rotate Z"),bodyAmount+'0.10*a*Math.sin(2*Math.PI*time/8);');
        var bodyRig=nil("TORSO_RIG",root,[640,704]);
        ex(tr(bodyRig).property("ADBE Position"),bodyAmount+'[640+1.6*a*Math.sin(2*Math.PI*time/8),704-.9*a*Math.sin(2*Math.PI*time/4)];');
        ex(tr(bodyRig).property("ADBE Rotate Z"),bodyAmount+'0.18*a*Math.sin(2*Math.PI*time/8);');
        ex(tr(bodyRig).property("ADBE Scale"),bodyAmount+'[100,100+.12*a*Math.sin(2*Math.PI*time/4)];');
        var headRig=nil("HEAD_RIG",bodyRig,[0,-292]);
        ex(tr(headRig).property("ADBE Rotate Z"),headAmount+'(.65*Math.sin(2*Math.PI*time/8-.35)+.14*Math.sin(2*Math.PI*time/4))*a;');

        ex(tr(headRig).property("ADBE Position"),headAmount+'[.65*a*Math.sin(2*Math.PI*time/8-.35),-292];');
        function hair(name,file,originalX,rootX,amp,phase) {
            // 200 transparent pixels around ALL source edges prevent effect-buffer clipping.
            var sub=p.items.addComp(name+"_PADDED_SOURCE",888,2012,1,8,30);
            sub.parentFolder=folder;
            var inside=sub.layers.add(load(file,488,1612));
            setPose(inside,null,[0,0],[200,200]);
            var l=c.layers.add(sub);l.name=name;
            setPose(l,headRig,[488-originalX+200,258+200],[0,0]);
            ex(tr(l).property("ADBE Rotate Z"),'var a=clamp(thisComp.layer("CONTROLS").effect("Hair strength")(1),0,2);'+
                amp+'*a*(.22*Math.sin(2*Math.PI*time/8+'+phase+')+.06*Math.sin(2*Math.PI*time/4+'+phase+'));');
        }
        hair("HAIR_L","hair_left",0,380,1,-.85);
        hair("HAIR_R","hair_right",488,106,-1,-1.25);

        var lower=c.layers.add(load("lower_body",976,1070));lower.name="LOWER_BODY_FIXED";
        setPose(lower,root,[0,0],[152,694]);
        function arm(name,file,pivot,pos,amp,phase) {
            var l=c.layers.add(load(file,312,600));l.name=name;
            setPose(l,bodyRig,[pivot[0]-pos[0],pivot[1]-pos[1]],[pivot[0]-488,pivot[1]-550]);
            ex(tr(l).property("ADBE Rotate Z"),bodyAmount+amp+'*a*(Math.sin(2*Math.PI*time/8+'+phase+')+.16*Math.sin(2*Math.PI*time/4+'+phase+'));');
        }
        arm("ARM_L","arm_left",[392,315],[144,295],0.65,-0.65);
        arm("ARM_R","arm_right",[586,315],[522,295],-0.60,-1.0);
        var torso=c.layers.add(load("torso",310,310));torso.name="TORSO";
        setPose(torso,bodyRig,[158,300],[0,0]);
        // 25 geometrically closed eye poses, not an opacity overlay on open eyes.
        var first=new File(here.fsName+"/blink/head_000.png");
        if (!first.exists) throw new Error("Keep the blink folder beside this script.");
        var io=new ImportOptions(first);io.sequence=true;io.forceAlphabetical=true;
        var sequence=p.importFile(io);sequence.parentFolder=folder;
        sequence.mainSource.conformFrameRate=60;
        var head=c.layers.add(sequence);head.name="HEAD_WITH_LID_POSES";
        setPose(head,headRig,[148,258],[0,0]);
        head.timeRemapEnabled=true;head.outPoint=8;
        ex(head.property("ADBE Time Remapping"),
            'var t=time%8;function s(x){x=clamp(x,0,1);return x*x*(3-2*x);}'+
            'function b(c){var d=t-c;if(d>=-.09&&d<0)return s((d+.09)/.09);'+
            'if(d>=0&&d<.025)return 1;if(d>=.025&&d<.195)return 1-s((d-.025)/.17);return 0;}'+
            'var q=Math.max(b(2.18),b(5.61),b(6.02));'+
            'q*=clamp(thisComp.layer("CONTROLS").effect("Blink amount")(1),0,100)/100;Math.round(q*24)/60;');
        controls.moveToBeginning();bodyRig.moveToBeginning();headRig.moveToBeginning();root.moveToBeginning();bg.moveToEnd();
        c.time=0;c.openInViewer();
        for(var i=0;i<check.length;i++) {
            check[i].valueAtTime(2.18,false);
            if(check[i].expressionError) throw new Error(check[i].expressionError);
        }
        alert("Created RYUSIHA_NATURAL_V3_8s.\nArms, head, torso and eyelids now animate.\nLayered hair follows the head with delayed motion; no extra plugin required.\nPreview at 0, 2.18 and 5.61 seconds, then save your AEP.");
    } catch(e) {alert("Setup stopped: "+e.toString()+"\nUndo before retrying.");}
    finally {app.endUndoGroup();}
}());
