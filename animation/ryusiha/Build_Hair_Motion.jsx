#target aftereffects
// A new composition only. Requires the bundled Cycore CC Bend It effect.
(function () {
    var dir = new File($.fileName).parent;
    var bodyFile = new File(dir.fsName + "/assets/body_base.png");
    var hairFile = new File(dir.fsName + "/assets/hair_pair.png");
    if (!bodyFile.exists) bodyFile = File.openDialog("Select BODY image: the generated full-body image with short hair");
    if (!bodyFile) return;
    if (!hairFile.exists) hairFile = File.openDialog("Select HAIR image: the generated image of two long hair pieces only");
    if (!hairFile) return;
    if (!app.project) app.newProject();
    app.beginUndoGroup("Ryusiha Hair Motion Draft");
    try {
        var project = app.project;
        var folder = project.items.addFolder("Ryusiha Hair Draft " + new Date().getTime());
        function load(file) {
            var item = project.importFile(new ImportOptions(file));
            item.parentFolder = folder; return item;
        }
        var body = load(bodyFile), hair = load(hairFile);
        if (hair.width !== 976 || hair.height !== 1612 || body.width !== 976 || Math.abs(body.height - 1612) > 2) {
            throw new Error("Use the supplied full-resolution BODY and HAIR images (976 px wide).");
        }
        var comp = project.items.addComp("RYUSIHA_HAIR_8s", 976, 1612, 1, 8, 30);
        comp.parentFolder = folder;
        comp.workAreaStart = 0; comp.workAreaDuration = 8;
        var bg = comp.layers.addSolid([0.063,0.051,0.106], "BACKGROUND - disable for alpha", 976,1612,1,8);
        var rig = comp.layers.addNull(8); rig.name = "HAIR_CONTROLS";
        var amount = rig.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
        amount.name = "Hair strength"; amount.property(1).setValue(1);
        var expressions = [];
        function place(layer, x) {
            var t = layer.property("ADBE Transform Group");
            t.property("ADBE Anchor Point").setValue([0,0]);
            t.property("ADBE Position").setValue([x,0]);
        }
        function side(name, offset, start, end, amplitude, phase) {
            // Crop each half with a precomp; keep the original shared canvas alignment.
            var sub = project.items.addComp(name + "_SOURCE",488,1612,1,8,30);
            sub.parentFolder = folder;
            place(sub.layers.add(hair), -offset);
            var layer = comp.layers.add(sub); layer.name = name;
            place(layer, offset);
            var effects = layer.property("ADBE Effect Parade");
            if (!effects.canAddProperty("CC Bend It")) {
                throw new Error("CC Bend It is unavailable. Use Puppet pins on the separated hair layers instead.");
            }
            var bend = effects.addProperty("CC Bend It");
            if (bend.numProperties < 3 || typeof bend.property(1).value !== "number" ||
                bend.property(2).value.length !== 2 || bend.property(3).value.length !== 2) {
                throw new Error("Unexpected CC Bend It parameter layout. Please set Bend, Start and End manually.");
            }
            bend.property(2).setValue(start);
            bend.property(3).setValue(end);
            bend.property(1).expression =
                'var a=thisComp.layer("HAIR_CONTROLS").effect("Hair strength")(1);' +
                amplitude + '*a*Math.sin(2*Math.PI*time/8+' + phase + ');';
            expressions.push(bend.property(1));
        }
        side("HAIR_L",0,[380,160],[300,980],1.2,0);
        side("HAIR_R",488,[106,160],[182,980],1.05,-0.8);
        var fixed = comp.layers.add(body); fixed.name = "BODY_BASE_FIXED"; place(fixed,0);
        rig.moveToBeginning(); bg.moveToEnd();
        comp.time = 0; comp.openInViewer();
        for (var i=0; i<expressions.length; i++) {
            expressions[i].valueAtTime(2,false);
            if (expressions[i].expressionError) throw new Error(expressions[i].expressionError);
        }
        alert("Created RYUSIHA_HAIR_8s.\nThe body is fixed; only left/right hair bends.\nHAIR_CONTROLS > Hair strength adjusts the motion.\nSave your project as AEP after previewing.");
    } catch(e) { alert("Setup stopped: " + e.toString() + "\nUndo the created items before retrying."); }
    finally { app.endUndoGroup(); }
}());
