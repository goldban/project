#target aftereffects
/* Extract the complete ZIP, run this file in After Effects, then Save As .aep.
   Text, timing, shapes, background transforms and audio are editable layers.
   Film still-life is a single background image; all typography remains editable. */
(function () {
    var SETTINGS = {
        title: "첫단추",
        release: "2026.11.26",
        date: "극장 개봉",
        font: "NotoSansCJKkr-Bold",
        duration: 20,
        fps: 30
    };
    var here = new File($.fileName).parent;
    var files = [new File(here.fsName + "/assets/background.png"), new File(here.fsName + "/assets/original-rhythm.wav"), new File(here.fsName + "/assets/mascot.png")];
    for (var i = 0; i < files.length; i++) {
        if (!files[i].exists) { alert("전체 ZIP을 먼저 풀어주세요. 누락 파일: " + files[i].name); return; }
    }
    if (!app.project) app.newProject();
    var created = [], expressions = [], folder, master;
    app.beginUndoGroup("Editable Character Teaser");
    try {
        folder = app.project.items.addFolder("EDITABLE_TEASER_" + new Date().getTime());
        created.push(folder);
        function reg(item) { created.push(item); item.parentFolder = folder; return item; }
        var background = reg(app.project.importFile(new ImportOptions(files[0])));
        var audio = reg(app.project.importFile(new ImportOptions(files[1])));
        var mascot = reg(app.project.importFile(new ImportOptions(files[2])));
        master = reg(app.project.items.addComp("EDIT_ME_1080x1920_20s",1080,1920,1,SETTINGS.duration,SETTINGS.fps));
        master.workAreaStart = 0; master.workAreaDuration = SETTINGS.duration;
        master.motionBlur = true;
        function tr(l) { return l.property("ADBE Transform Group"); }
        function span(l,a,b) { l.inPoint=a; l.outPoint=b; return l; }
        function expr(p,s) { p.expression=s; expressions.push(p); }
        function motion(l,a,b,x,y,mode) {
            var p=tr(l).property("ADBE Position");
            p.setValueAtTime(a,[x+(mode===-1?-1100:mode===1?1100:0),y+(!mode?60:0)]);
            p.setValueAtTime(a+.38,[x,y]);
            var op=tr(l).property("ADBE Opacity");op.setValueAtTime(a,0);op.setValueAtTime(a+.20,100);
            if(b<20){op.setValueAtTime(b-.10,100);op.setValueAtTime(b,0);}
            for(var k=1;k<=p.numKeys;k++)p.setTemporalEaseAtKey(k,[new KeyframeEase(0,70)],[new KeyframeEase(0,70)]);
            l.motionBlur=true;
        }
        function text(name,words,a,b,x,y,size,color,mode) {
            var l=span(master.layers.addText(words),a,b);l.name=name;
            var p=l.property("ADBE Text Properties").property("ADBE Text Document");var td=p.value;
            td.font=SETTINGS.font;td.fontSize=size;td.applyFill=true;td.fillColor=color;td.applyStroke=false;td.justification=ParagraphJustification.CENTER_JUSTIFY;p.setValue(td);
            expr(tr(l).property("ADBE Anchor Point"),'var r=sourceRectAtTime(time,false);[r.left+r.width/2,r.top+r.height/2];');
            motion(l,a,b,x,y,mode);return l;
        }
        var ink=[.27,.17,.14],blue=[.51,.18,.21],white=[.27,.17,.14],yellow=[.51,.18,.21];
        
        var bg=span(master.layers.add(background),0,20);bg.name="BACKGROUND / film photo - replace image here";
        tr(bg).property("ADBE Position").setValue([540,960]);
        var cover=Math.max(1080/background.width,1920/background.height)*100;
        tr(bg).property("ADBE Scale").setValueAtTime(0,[cover*1.10,cover*1.10]);
        tr(bg).property("ADBE Scale").setValueAtTime(3.5,[cover,cover]);
        function shape(name,a,b,size,pos,color,ellipse) {
            var l=span(master.layers.addShape(),a,b);l.name=name;
            var group=l.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
            var contents=group.property("ADBE Vectors Group");
            var path=contents.addProperty(ellipse?"ADBE Vector Shape - Ellipse":"ADBE Vector Shape - Rect");
            path.property(ellipse?"ADBE Vector Ellipse Size":"ADBE Vector Rect Size").setValue(size);
            contents.addProperty("ADBE Vector Graphic - Fill").property("ADBE Vector Fill Color").setValue(color);
            tr(l).property("ADBE Position").setValue(pos);return l;
        }
        var ribbon=shape("INTRO RIBBON / color + rotation",0,3.5,[1900,45],[540,1320],[.71,.42,.29],false);
        tr(ribbon).property("ADBE Rotate Z").setValue(-27);
        tr(ribbon).property("ADBE Position").setValueAtTime(0,[540,1500]);tr(ribbon).property("ADBE Position").setValueAtTime(3.5,[540,1050]);
        for(var j=0;j<7;j++){
            var dot=shape("ACCENT "+(j+1),0,10,[12+(j%3)*4,12+(j%3)*4],[85+j*149,260],yellow,true);
            expr(tr(dot).property("ADBE Position"),'['+(85+j*149)+'+20*Math.sin(time*2+'+j+'),260+24*Math.cos(time*2+'+j+')];');
        }
        text("01a 잠깐","잠깐,",0,1.5,540,690,168,white,-1);
        text("01b 여기 봐","여기 봐!",.18,1.5,540,925,144,[.51,.18,.21],1);
        text("02a 새로운 이야기","새로운 이야기가",1.5,3.5,540,720,84,white,1);
        text("02b 시작돼","시작돼",1.65,3.5,540,930,144,yellow,0);
        // Each source comp is a real, replaceable 16:9 video slot.
        function slot(index,label,color) {
            var comp=reg(app.project.items.addComp("VIDEO_0"+index+"_"+label+" / 영상은 여기에",960,540,1,20,30));
            var path=new File(here.fsName+"/assets/clip0"+index+".mp4");
            if(path.exists){
                var footage=reg(app.project.importFile(new ImportOptions(path)));
                var clip=comp.layers.add(footage);clip.name="REPLACE ME / "+label;clip.audioEnabled=false;
                tr(clip).property("ADBE Position").setValue([480,270]);
                var fit=Math.max(960/footage.width,540/footage.height)*100;
                tr(clip).property("ADBE Scale").setValue([fit,fit]);
                clip.outPoint=Math.min(20,footage.duration);
            }else{
                comp.layers.addSolid(color,"PLACEHOLDER / 실제 영상 아님",960,540,1,20);
                var placeholder=comp.layers.addText(label+"\r영상 교체 영역");
                var tp=placeholder.property("ADBE Text Properties").property("ADBE Text Document"),td=tp.value;
                td.font=SETTINGS.font;td.fontSize=60;td.fillColor=[1,1,1];td.justification=ParagraphJustification.CENTER_JUSTIFY;tp.setValue(td);
                tr(placeholder).property("ADBE Position").setValue([480,240]);
            }
            return comp;
        }
        var genres=["단편영화","다큐","홍보 영상"];
        var colors=[[.44,.22,.20],[.49,.36,.24],[.61,.40,.26]];
        var clips=[];
        // Full-screen sequential clips, then all three gather into one screen.
        // Film photograph remains visible behind the video slots.
        for(var v=0;v<3;v++){
            clips[v]=slot(v+1,genres[v],colors[v]);
            var begin=3.5+v*1.8,end=begin+1.8;
            var single=span(master.layers.add(clips[v]),begin,end);
            single.name="MONTAGE SOLO / "+genres[v];single.startTime=begin;span(single,begin,end);
            tr(single).property("ADBE Position").setValue([540,920]);
            tr(single).property("ADBE Scale").setValueAtTime(begin,[108,108]);
            tr(single).property("ADBE Scale").setValueAtTime(end,[118,118]);
            text("GENRE / "+genres[v],genres[v],begin,end,540,510,110,white,1);
            text("GENRE SUB / "+genres[v],"하나의 스크린에서 만나는",begin,end,540,1370,44,[.44,.27,.23],0);
            var combined=master.layers.add(clips[v]);combined.name="MONTAGE TOGETHER / "+genres[v];combined.startTime=8.9;span(combined,8.9,15);
            tr(combined).property("ADBE Position").setValueAtTime(8.9,[540+(v-1)*1200,880]);
            tr(combined).property("ADBE Position").setValueAtTime(9.5,[540,530+v*450]);
            tr(combined).property("ADBE Scale").setValue([80,80]);
            text("TOGETHER LABEL / "+genres[v],genres[v],9.5,13,540,775+v*450,40,white,0);
        }
        text("MESSAGE 1","단편영화 · 다큐 · 홍보 영상",9.1,13,540,185,46,[.44,.27,.23],0);
        var dim=span(master.layers.addSolid([1,.94,.86],"MESSAGE LIGHT / opacity",1080,1920,1,20),13,15);
        tr(dim).property("ADBE Opacity").setValue(94);
        text("MESSAGE 2 / 모두 영화관에서","이 모든 영상을,",13,15,540,790,90,white,-1);
        text("MESSAGE 3 / 핵심 메시지","영화관에서",13.2,15,540,1000,132,yellow,1);
        // Title/date/sign/mascot remain independent editable layers.
        var carrier=span(master.layers.addNull(20),15,20);carrier.name="CARRIER CONTROL / 팻말과 캐릭터 등장";
        tr(carrier).property("ADBE Anchor Point").setValue([0,0]);
        var cp=tr(carrier).property("ADBE Position");
        cp.setValueAtTime(15,[0,1550]);cp.setValueAtTime(15.65,[0,-28]);cp.setValueAtTime(15.95,[0,0]);
        for(var ck=1;ck<=cp.numKeys;ck++)cp.setTemporalEaseAtKey(ck,[new KeyframeEase(0,65)],[new KeyframeEase(0,65)]);
        function attach(layer){layer.parent=carrier;return layer;}
        var board=attach(shape("SIGNBOARD / 팻말 색상·크기",15,20,[850,600],[540,650],[1,.97,.90],false));
        var boardContents=board.property("ADBE Root Vectors Group").property(1).property("ADBE Vectors Group");
        boardContents.property("ADBE Vector Shape - Rect").property("ADBE Vector Rect Roundness").setValue(45);
        var outline=boardContents.addProperty("ADBE Vector Graphic - Stroke");
        outline.property("ADBE Vector Stroke Color").setValue([.49,.27,.15]);outline.property("ADBE Vector Stroke Width").setValue(16);
        var character=span(master.layers.add(mascot),15,20);character.name="MASCOT / 캐릭터 위치·크기·교체";
        // Visible alpha bounds are used for anchoring and uniform scaling.
        tr(character).property("ADBE Anchor Point").setValue([630.0, 643.5]);
        tr(character).property("ADBE Position").setValue([540,1190]);
        tr(character).property("ADBE Scale").setValue([101.90217391304348,101.90217391304348]);attach(character);
        // Set local position after parenting to preserve a shared carrier animation.
        tr(character).property("ADBE Position").setValue([540,1190]);
        var title=attach(text("EDIT TITLE / 작품명",SETTINGS.title,15,20,540,525,132,ink,0));
        var release=attach(text("EDIT RELEASE / 개봉일",SETTINGS.release,15,20,540,705,94,blue,0));
        var date=attach(text("EDIT DATE / 개봉 문구",SETTINGS.date,15,20,540,845,54,ink,0));
        // Children use local static positions; parent supplies the shared entrance.
        var fixedLayers=[board,title,release,date];
        var fixedPositions=[[540,650],[540,525],[540,705],[540,845]];
        for(var fi=0;fi<fixedLayers.length;fi++){
            var fp=tr(fixedLayers[fi]).property("ADBE Position");
            while(fp.numKeys>0)fp.removeKey(1);fp.setValue(fixedPositions[fi]);
            var fo=tr(fixedLayers[fi]).property("ADBE Opacity");while(fo.numKeys>0)fo.removeKey(1);fo.setValue(100);
        }
        text("EDIT CTA / 마지막 문구","첫단추, 극장에서 만나요",16,20,540,1635,48,ink,0);
        var music=master.layers.add(audio);music.name="AUDIO / original rhythm";span(music,0,15);
        var tail=master.layers.add(audio);tail.name="AUDIO / loop continuation";tail.startTime=15;span(tail,15,20);
        text("DRAFT LABEL / hide for export","MOTION TEASER · 시안",0,20,250,120,26,blue,0);
        var marker=new MarkerValue("자막: 텍스트 레이어 더블클릭 / 시간: 레이어 양 끝과 키프레임 이동 / 작품명·개봉일: EDIT 레이어 수정");
        master.markerProperty.setValueAtTime(0,marker);
        for(var n=0;n<expressions.length;n++){
            expressions[n].valueAtTime(11,false);
            if(expressions[n].expressionError)throw new Error(expressions[n].expressionError);
        }
        master.openInViewer();
        alert("편집 가능한 컴포지션을 만들었습니다.\nEDIT 레이어에서 작품명·개봉일을 바꾸세요.\n파일 > 다른 이름으로 저장으로 .aep를 저장하세요.\n배경은 필름 사진 한 장이며 자막과 영상 슬롯은 개별 편집 가능합니다.");
    } catch(e) {
        for(var c=created.length-1;c>=0;c--){try{created[c].remove();}catch(ignore){}}
        alert("생성 실패: "+e.toString());
    } finally {app.endUndoGroup();}
})();
