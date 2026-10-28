#target aftereffects
(function () {
    var here = new File($.fileName).parent;
    var assets = new Folder(here.fsName + "/assets");
    if (!new File(assets.fsName + "/torso.png").exists) {
        assets = Folder.selectDialog("Select the v4 assets folder");
        if (!assets) return;
    }
    if (!app.project) app.newProject();
    app.beginUndoGroup("Ryusiha Natural Motion v4");
    try {
        var p=app.project, folder=p.items.addFolder("Ryusiha Natural v4 " + new Date().getTime());
        var c=p.items.addComp("RYUSIHA_NATURAL_V4_16s",1280,1920,1,16,60);
        c.parentFolder=folder; c.workAreaStart=0; c.workAreaDuration=16;
        var check=[];
        function tr(l) { return l.property("ADBE Transform Group"); }
        function ex(prop,code) { prop.expression=code; check.push(prop); }
        function load(name,w,h) {
            var f=new File(assets.fsName+"/"+name+".png");
            if (!f.exists) throw new Error("Missing v4 asset: "+name);
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
            var l=c.layers.addNull(16);l.name=name;
            setPose(l,parent,[0,0],pos);return l;
        }
        var bg=c.layers.addSolid([0.063,0.051,0.106],"BACKGROUND - disable for alpha",1280,1920,1,16);
        var controls=nil("CONTROLS",null,[0,0]);
        function slider(name,value) {
            var f=controls.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
            f.name=name;f.property(1).setValue(value);
        }
        slider("Body and arms",1); slider("Head motion",1);
        slider("Hair strength",1); slider("Blink amount",100);
        // The same numeric formulas are stored in motion.json for the preview renderer.
        var formulas={"root_roll": ".34*sin(w*t)+.10*sin(2*w*t+.2)", "body_x": "3*sin(w*t)+1.2*sin(2*w*t-.4)", "body_y": "-2.8*sin(4*w*t)", "body_roll": ".75*sin(w*t-.15)+.20*sin(2*w*t+.3)", "breath": ".22*sin(4*w*t)", "head_x": "1.8*sin(2*w*t-.45)", "head_y": "-1.4*g1-1.0*g2", "head_roll": "1.8*sin(2*w*t-.45)+.55*sin(3*w*t+.2)+1.2*(g1-g2)", "arm_left": "3.2*sin(2*w*t-.7)+.65*sin(3*w*t-.3)+2*g1", "arm_right": "-2.8*sin(2*w*t-1.1)-.65*sin(3*w*t-.7)-2.8*g2", "hair_left": ".65*sin(2*w*t-.9)+.18*sin(3*w*t-1.2)", "hair_right": "-.60*sin(2*w*t-1.35)-.16*sin(3*w*t-1.6)"};
        var prefix='var t=time%16,w=2*Math.PI/16;var sin=Math.sin;'+
            'function s(x){x=clamp(x,0,1);return x*x*(3-2*x);}'+
            'function g(a,b,c,d){return s((t-a)/(b-a))*(1-s((t-c)/(d-c)));}'+
            'var g1=g(2.6,3.4,4.1,5.3),g2=g(9.7,10.6,11.2,12.4);';
        function f(name){return '('+formulas[name]+')';}
        var bodyAmount='var a=clamp(thisComp.layer("CONTROLS").effect("Body and arms")(1),0,2);';
        var headAmount='var a=clamp(thisComp.layer("CONTROLS").effect("Head motion")(1),0,2);';
        var root=nil("WEIGHT_SHIFT",null,[640,1690]);
        tr(root).property("ADBE Anchor Point").setValue([640,1690]);
        ex(tr(root).property("ADBE Rotate Z"),prefix+bodyAmount+'a*'+f('root_roll')+';');
        var bodyRig=nil("TORSO_RIG",root,[640,704]);
        ex(tr(bodyRig).property("ADBE Position"),prefix+bodyAmount+'[640+a*'+f('body_x')+',704+a*'+f('body_y')+'];');
        ex(tr(bodyRig).property("ADBE Rotate Z"),prefix+bodyAmount+'a*'+f('body_roll')+';');
        ex(tr(bodyRig).property("ADBE Scale"),prefix+bodyAmount+'[100,100+a*'+f('breath')+'];');
        var headRig=nil("HEAD_RIG",bodyRig,[0,-292]);
        ex(tr(headRig).property("ADBE Rotate Z"),prefix+headAmount+'a*'+f('head_roll')+';');

        ex(tr(headRig).property("ADBE Position"),prefix+headAmount+'[a*'+f('head_x')+',-292+a*'+f('head_y')+'];');
        function hair(name,file,originalX) {
            // 200 transparent pixels around ALL source edges prevent effect-buffer clipping.
            var sub=p.items.addComp(name+"_PADDED_SOURCE",888,2012,1,16,60);
            sub.parentFolder=folder;
            var inside=sub.layers.add(load(file,488,1612));
            setPose(inside,null,[0,0],[200,200]);
            var l=c.layers.add(sub);l.name=name;
            setPose(l,headRig,[488-originalX+200,258+200],[0,0]);
            ex(tr(l).property("ADBE Rotate Z"),prefix+'var a=clamp(thisComp.layer("CONTROLS").effect("Hair strength")(1),0,2);a*'+f(file)+';');
        }
        hair("HAIR_L","hair_left",0);
        hair("HAIR_R","hair_right",488);

        var lower=c.layers.add(load("lower_body",976,1070));lower.name="LOWER_BODY_WEIGHT_SHIFT";
        setPose(lower,root,[0,0],[152,694]);
        function arm(name,file,pivot,pos) {
            var l=c.layers.add(load(file,312,600));l.name=name;
            setPose(l,bodyRig,[pivot[0]-pos[0],pivot[1]-pos[1]],[pivot[0]-488,pivot[1]-550]);
            ex(tr(l).property("ADBE Rotate Z"),prefix+bodyAmount+'a*'+f(file)+';');
        }
        arm("ARM_L","arm_left",[392,315],[144,295]);
        arm("ARM_R","arm_right",[586,315],[522,295]);
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
        head.timeRemapEnabled=true;head.outPoint=16;
        ex(head.property("ADBE Time Remapping"),
            'var t=time%16;function s(x){x=clamp(x,0,1);return x*x*(3-2*x);}'+
            'function b(c){var d=t-c;if(d>=-.09&&d<0)return s((d+.09)/.09);'+
            'if(d>=0&&d<.025)return 1;if(d>=.025&&d<.195)return 1-s((d-.025)/.17);return 0;}'+
            'var q=Math.max(b(1.9),b(5.4),b(8.1),b(11.6),b(12.02),b(14.5));'+
            'q*=clamp(thisComp.layer("CONTROLS").effect("Blink amount")(1),0,100)/100;Math.round(q*24)/60;');
        controls.moveToBeginning();bodyRig.moveToBeginning();headRig.moveToBeginning();root.moveToBeginning();bg.moveToEnd();
        c.time=0;c.openInViewer();
        for(var i=0;i<check.length;i++) {
            check[i].valueAtTime(1.9,false);
            if(check[i].expressionError) throw new Error(check[i].expressionError);
        }
        alert("Created RYUSIHA_NATURAL_V4_16s.\nArms, head, torso and eyelids now animate.\nLayered hair follows the head with delayed motion; no extra plugin required.\nPreview all 16 seconds, especially 3.5 and 10.8 seconds, then save your AEP.");
    } catch(e) {alert("Setup stopped: "+e.toString()+"\nUndo before retrying.");}
    finally {app.endUndoGroup();}
}());
