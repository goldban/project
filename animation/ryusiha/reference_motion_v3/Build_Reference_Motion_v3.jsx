#target aftereffects
/* Extract the complete package first. Run in After Effects, then save as AEP.
 * Camera and graphics are native editable layers. Fine body/hair motion is baked.
 * No third-party effects or locale-dependent effect names are required.
 */
(function () {
    var here = new File($.fileName).parent;
    var required = ["character_motion.mov", "character.png", "background.png"];
    for (var i = 0; i < required.length; i++) {
        if (!new File(here.fsName + "/assets/" + required[i]).exists) {
            alert("Missing assets/" + required[i] + "\nExtract the whole ZIP before running this script. No project changes were made.");
            return;
        }
    }
    if (!app.project) app.newProject();
    var created = [], checks = [], master, folder;
    app.beginUndoGroup("Reference Motion v3");
    try {
        var project = app.project;
        folder = project.items.addFolder("Reference Motion v3 " + new Date().getTime());
        created.push(folder);
        function register(item) { created.push(item); item.parentFolder = folder; return item; }
        function load(name, width, height) {
            var item = register(project.importFile(new ImportOptions(new File(here.fsName + "/assets/" + name))));
            if (item.width !== width || item.height !== height) throw new Error("Unexpected size: " + name);
            return item;
        }
        var movie = load("character_motion.mov", 960, 720);
        if (movie.duration < 9.99) throw new Error("Incomplete character_motion.mov. Download the whole package again.");
        movie.mainSource.alphaMode = AlphaMode.STRAIGHT;
        var original = load("character.png", 1024, 1536);
        var background = load("background.png", 1920, 1080);
        master = register(project.items.addComp("REFERENCE_V3_10s_" + new Date().getTime(), 1920, 1080, 1, 10, 30));
        var source = register(project.items.addComp("CHARACTER_SOURCE_" + new Date().getTime(), 960, 1360, 1, 10, 30));
        master.workAreaStart = 0; master.workAreaDuration = 10;
        function tr(layer) { return layer.property("ADBE Transform Group"); }
        function pose(layer, anchor, position, scale) {
            tr(layer).property("ADBE Anchor Point").setValue(anchor);
            tr(layer).property("ADBE Position").setValue(position);
            tr(layer).property("ADBE Scale").setValue(scale || [100, 100]);
        }
        function expression(property, code) { property.expression = code; checks.push(property); }
        var controls = master.layers.addNull(10); controls.name = "CONTROLS";
        pose(controls, [0, 0], [0, 0]);
        function slider(name, value) {
            var fx = controls.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
            fx.name = name; fx.property(1).setValue(value);
        }
        slider("Camera travel", 65); slider("Camera tilt", 2.8);
        slider("Camera zoom", 238); slider("Zoom pulse", 8.5);
        slider("Body playback speed", 1); slider("Graphics opacity", 70);
        var local = 'thisComp.layer("CONTROLS")';
        function control(name, lo, hi) { return 'clamp(' + local + '.effect("' + name + '")(1),' + lo + ',' + hi + ')'; }
        var prefix = 'var t=2*Math.PI*time/10;';
        var bg = master.layers.add(background); bg.name = "BACKGROUND - disable for alpha";
        pose(bg, [0, 0], [0, 0]); bg.moveToEnd();
        var still = source.layers.add(original); still.name = "ORIGINAL_STILL - enable instead of body footage";
        pose(still, [0, 0], [80, 80], [78.125, 78.125]); still.enabled = false;
        var body = source.layers.add(movie); body.name = "BODY_HAIR_LOOP - baked motion";
        pose(body, [0, 0], [0, 0]); body.timeRemapEnabled = true;
        expression(body.property("ADBE Time Remapping"), 'var rate=clamp(comp("' + master.name + '").layer("CONTROLS").effect("Body playback speed")(1),0.1,2);Math.min((time*rate)%10,10-1/30);');
        body.inPoint = 0; body.outPoint = 10;
        var character = master.layers.add(source); character.name = "CHARACTER_CAMERA - editable transform";
        pose(character, [480, 680], [960, 1518.4], [238, 238]);
        var zoom = '(' + control("Camera zoom", 100, 350) + '+' + control("Zoom pulse", 0, 15) + '*Math.sin(2*t-.5))';
        expression(tr(character).property("ADBE Scale"), prefix + 'var z=' + zoom + ';[z,z];');
        expression(tr(character).property("ADBE Position"), prefix + 'var z=' + zoom + '/100;[960+' + control("Camera travel", 0, 100) + '*Math.sin(t),680*z-100+22*Math.sin(2*t-.3)];');
        expression(tr(character).property("ADBE Rotate Z"), prefix + '-(' + control("Camera tilt", 0, 4) + '*(Math.sin(2*t+.4)+(.45/2.8)*Math.sin(4*t-.2)));');
        function polygon(name, points, color, position) {
            var layer = master.layers.addShape(); layer.name = name;
            var group = layer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            var contents = group.property("ADBE Vectors Group");
            var path = contents.addProperty("ADBE Vector Shape - Group");
            var shape = new Shape(); shape.vertices = points; shape.closed = true;
            shape.inTangents = []; shape.outTangents = [];
            for (var k = 0; k < points.length; k++) { shape.inTangents.push([0, 0]); shape.outTangents.push([0, 0]); }
            path.property("ADBE Vector Shape").setValue(shape);
            contents.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(color);
            pose(layer, [0, 0], position); return layer;
        }
        for (var j = 0; j < 7; j++) {
            var stripe = polygon("BACKGROUND_STRIPE_" + j, [[-200,360],[2120,-190],[2120,-135],[-200,415]], [.61,.64,.82], [0,-250+j*250]);
            stripe.moveAfter(character);
            expression(tr(stripe).property("ADBE Position"), prefix + '[0,' + (-250+j*250) + '+45*Math.sin(t)];');
            tr(stripe).property("ADBE Opacity").setValue(12);
        }
        for (var side = -1; side <= 1; side += 2) {
            var ribbon = polygon("FOREGROUND_RIBBON_" + side, [[-260,75],[220,-55],[220,-9],[-260,121]], [.086,.11,.192], [960+side*745,830]);
            expression(tr(ribbon).property("ADBE Position"), prefix + '[' + (960+side*745) + '+35*Math.sin(2*t),830+25*Math.sin(2*t+.7)];');
            expression(tr(ribbon).property("ADBE Opacity"), control("Graphics opacity", 0, 100) + '*.76;');
            for (var chip = 0; chip < 8; chip++) {
                var mark = polygon("TEAL_MARK_" + side + "_" + chip, [[0,0],[29,0],[29,9],[0,9]], [.46,.85,.87], [0,0]);
                expression(tr(mark).property("ADBE Position"), prefix + '[' + (960+side*745-215+chip*52) + '+35*Math.sin(2*t),' + (898-chip*14) + '+25*Math.sin(2*t+.7)];');
                expression(tr(mark).property("ADBE Opacity"), control("Graphics opacity", 0, 100) + ';');
            }
        }
        controls.moveToBeginning();
        for (var c = 0; c < checks.length; c++) {
            for (var sample = 0; sample < 4; sample++) {
                checks[c].valueAtTime(sample*2.5, false);
                if (checks[c].expressionError) throw new Error(checks[c].expressionError);
            }
        }
        master.time = 0; master.openInViewer();
        alert("Created editable Reference Motion v3.\nEdit CONTROLS and shape layers, then Save As AEP.\nBody/hair deformation is baked in the transparent MOV.\nThe supplied MP4 is a Python preview; native AE graphics are an editable reconstruction.");
    } catch (error) {
        // Remove only items made by this invocation, preserving the existing project.
        for (var r = created.length-1; r >= 0; r--) { try { created[r].remove(); } catch (ignored) {} }
        alert("Setup stopped: " + error.toString() + "\nExisting project items were preserved.");
    } finally { app.endUndoGroup(); }
}());
