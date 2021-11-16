import {dangerZone } from '../danger-zone.js';
import {dangerZoneDimensions, point, locationToBoundary, documentBoundary, getTagEntities} from './dimensions.js';
import {tokenSaysOn, monksActiveTilesOn, warpgateOn, fluidCanvasOn, sequencerOn, betterRoofsOn, levelsOn, taggerOn} from '../index.js';

export const wait = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

export const WORKFLOWSTATES = {
    INIT: 0,
    AWAITLOCATION: 1,
    EXECUTELIKELIHOOD: 2,
    GETZONEDATA: 3,
    GETZONEELIGIBLETOKENS: 4,
    ESTABLISHTARGETBOUNDARY: 5,
    HIGHLIGHTTARGETBOUNDARY: 6,
    GETZONETARGETS: 7,
    GENERATEFLAVOR: 10,
    GENERATEFLUIDCANVAS: 15,
    GENERATEFOREGROUNDEFFECT: 20,
    GENERATEAUDIOEFFECT: 21,
    GENERATEBACKGROUNDEFFECT: 22,
    CLEARLASTINGEFFECTS: 30,
    GENERATELASTINGEFFECT: 31,
    CLEARLIGHT: 32,
    GENERATELIGHT: 33,
    GENERATETOKENEFFECT: 34,
    GENERATEACTIVEEFFECT: 35,
    GENERATEMACRO: 40,
    TOKENSAYS: 50,
    WARPGATE: 51,
    AWAITPROMISES: 95,
    CANCEL: 98,
    COMPLETE: 99
}

export class workflow {

    constructor(zone, trigger, options = {}) {
        this.active = true,
        this.currentState = WORKFLOWSTATES.INIT,
        this.eligibleTargets = [],
        this.id = foundry.utils.randomID(16),
        this.likelihoodResult = 100,
        this.previouslyExecuted = options.previouslyExecuted ? options.previouslyExecuted : false,
        this.promises = [],
        this.scene = game.scenes.get(zone.scene.sceneId),
        this.targetBoundary,
        this.targets = [];
        this.trigger = trigger,
        this.twinLocation = {},
        this.userSelectedLocation = options.location ? options.location : {},
        this.userSelectedTargets = options.targets ? options.targets : [],
        this.zone = zone,
        this.zoneBoundary,
        this.zoneEligibleTokens = [], 
        this.zoneTokens = [], 
        this.zoneType = zone.danger
    };

    get flags() {
        return this.zoneType.options.flags
    };

    get zoneTypeOptions() {
        return this.zoneType.options
    };

    get sceneTokens() {
        return this.scene.tokens
    };

    get selectedPoint() {
        return new point(this.userSelectedLocation)
    }

    log(message, data){
        dangerZone.log(false,`${message} ${this.zone.title}... `, {workflow: this, data:data});
    }

    async next(nextState){
        if(!this.active){return this}
        await this._next(nextState);
        if(!this.active){return this}
    }

    async _next(state){
        this.currentState = state;
        switch(state) {
            case WORKFLOWSTATES.NONE:
                if (!this.zoneType){
                    this.log('Zone type does not exist', {});
                    return this.next(WORKFLOWSTATES.CANCEL)
                }
                if (this.zone.options.placeTemplate) {
                    return this.next(WORKFLOWSTATES.AWAITLOCATION);
                } else {return this.next(WORKFLOWSTATES.EXECUTELIKELIHOOD)}

            case WORKFLOWSTATES.AWAITLOCATION:
                this.log('Prompt location', {});
                await this.promptSelectZArea();
                if(!('x' in this.userSelectedLocation ) || !('y' in this.userSelectedLocation) || !('z' in this.userSelectedLocation)){
                    ui.notifications?.warn(game.i18n.localize("DANGERZONE.alerts.user-selection-exited"));
                    return this.next(WORKFLOWSTATES.CANCEL)
                }
                return this.next(WORKFLOWSTATES.EXECUTELIKELIHOOD);

            case WORKFLOWSTATES.EXECUTELIKELIHOOD:
                await this.happens();
                this.log('Zone likelihood executed', {});
                if(this.active && this.zoneType) {
                    return this.next(WORKFLOWSTATES.GETZONEDATA)
                } else {
                    this.gmChatDetails();
                    return this.next(WORKFLOWSTATES.CANCEL)
                }  
            
            case WORKFLOWSTATES.GETZONEDATA:
                await this.getZoneData();
                this.log('Zone tokens got ', {});
                return this.next(WORKFLOWSTATES.GETZONEELIGIBLETOKENS)

            case WORKFLOWSTATES.GETZONEELIGIBLETOKENS:
                this.getZoneEligibleTokens()
                this.log('Zone eligible tokens got ', {});
                return this.next(WORKFLOWSTATES.ESTABLISHTARGETBOUNDARY)

            case WORKFLOWSTATES.ESTABLISHTARGETBOUNDARY:
                await this.establishTargetBoundary();
                this.log('Zone target boundary and eligible targets established', {});
                return this.next(WORKFLOWSTATES.HIGHLIGHTTARGETBOUNDARY)

            case WORKFLOWSTATES.HIGHLIGHTTARGETBOUNDARY:
               // this.promises.push(this.highlightTargetBoundary())
                this.highlightTargetBoundary()
                return this.next(WORKFLOWSTATES.GETZONETARGETS)

            case WORKFLOWSTATES.GETZONETARGETS:
                await this.getZoneTargets();
                this.log('Zone targets got', {});
                this.gmChatDetails();
                return this.next(WORKFLOWSTATES.GENERATEFLAVOR)

            case WORKFLOWSTATES.GENERATEFLAVOR:
                if(!this.previouslyExecuted){this.flavor();}
                return this.next(WORKFLOWSTATES.GENERATEFLUIDCANVAS)

            case WORKFLOWSTATES.GENERATEFLUIDCANVAS:
                if(fluidCanvasOn){
                    this.promises.push(this.fluidCanvas());
                } else {
                    this.log('Fluid Canvas not active in this world', {fluidCanvasOn: fluidCanvasOn});
                }
                return this.next(WORKFLOWSTATES.GENERATEFOREGROUNDEFFECT)

            case WORKFLOWSTATES.GENERATEFOREGROUNDEFFECT:
                if(sequencerOn){
                    this.promises.push(this.foregroundEffect());
                } else {
                    this.log('Fore/Background effects skipped - Sequencer not active in this world', {sequencerOn: sequencerOn});
                }
                return this.next(WORKFLOWSTATES.GENERATEAUDIOEFFECT)

            case WORKFLOWSTATES.GENERATEAUDIOEFFECT:
                this.promises.push(this.audioEffect());
                return this.next(WORKFLOWSTATES.GENERATEBACKGROUNDEFFECT)

            case WORKFLOWSTATES.GENERATEBACKGROUNDEFFECT:
                if(sequencerOn){
                    this.promises.push(this.backgroundEffect());
                }
                return this.next(WORKFLOWSTATES.CLEARLASTINGEFFECTS)

            case WORKFLOWSTATES.CLEARLASTINGEFFECTS:
                if(!this.previouslyExecuted){await this.deleteLastingEffects();}//hard stop here, pausing those operations that wait for lasting effect delay
                return this.next(WORKFLOWSTATES.GENERATELASTINGEFFECT)

            case WORKFLOWSTATES.GENERATELASTINGEFFECT:
                await this.lastingEffect();//hard stop here, pausing those operations that wait for lasting effect delay
                return this.next(WORKFLOWSTATES.CLEARLIGHT)

            case WORKFLOWSTATES.CLEARLIGHT:
                if(!this.previouslyExecuted){await this.deleteLight();}//hard stop here
                return this.next(WORKFLOWSTATES.GENERATELIGHT)

            case WORKFLOWSTATES.GENERATELIGHT:
                await this.createLight();
                return this.next(WORKFLOWSTATES.GENERATETOKENEFFECT) 
                
            case WORKFLOWSTATES.GENERATETOKENEFFECT:
                this.promises.push(this.tokenEffect());
                return this.next(WORKFLOWSTATES.GENERATEACTIVEEFFECT)  

            case WORKFLOWSTATES.GENERATEACTIVEEFFECT:
                this.promises.push(this.activeEffect());
                return this.next(WORKFLOWSTATES.GENERATEMACRO)  

            case WORKFLOWSTATES.GENERATEMACRO:
                this.promises.push(this.macro());
                return this.next(WORKFLOWSTATES.TOKENSAYS) 

            case WORKFLOWSTATES.TOKENSAYS:
                if(tokenSaysOn){
                    this.promises.push(this.tokenSays());
                } else {
                    this.log('TokenSays not active in this world', {tokenSaysOn: tokenSaysOn});
                }
                return this.next(WORKFLOWSTATES.WARPGATE) 

            case WORKFLOWSTATES.WARPGATE:
                if(warpgateOn){
                    this.promises.push(this.spawnWarpgate())
                } else {
                    this.log('Warpgate not active in this world', {warpgateOn: warpgateOn});
                }
                return this.next(WORKFLOWSTATES.AWAITPROMISES) 

            case WORKFLOWSTATES.CANCEL: 
                this.active = false
                this.log('Zone workflow cancelled', {});
                return this

            case WORKFLOWSTATES.AWAITPROMISES: 
                return await Promise.all(this.promises)
                    .then((results) => {
                        this.log('Zone workflow promises returned ', results)
                        return this.next(WORKFLOWSTATES.COMPLETE) 
                    })
                    .catch((e) => {
                        this.log('Zone workflow promise errors ', e);
                        return this.next(WORKFLOWSTATES.CANCEL) 
                    });

            case WORKFLOWSTATES.COMPLETE: 
                this.active = false
                this.previouslyExecuted = true;
                return this.log('Zone workflow complete', {})
        }
    }
    
    /*prompts the user to select the zone location point (top left grid location) and captures the location*/
    async promptSelectZArea() {
        return new Promise((resolve, reject) => {
            new Dialog({
                title: game.i18n.localize("DANGERZONE.alerts.input-z"),
                content: `<p>${game.i18n.localize("DANGERZONE.alerts.enter-z")}</p><center><input type="number" id="zInput" min="0" steps="1" value="0"></center><br>`,
                buttons: {
                    submit: {
                        label: game.i18n.localize("DANGERZONE.yes"),
                        icon: '<i class="fas fa-check"></i>',
                        callback: async (html) => {
                            this.userSelectedLocation.z = parseInt(html.find("#zInput")[0].value);
                            await this.promptSelectXYArea();
                            resolve(true)
                            }
                        },
                    cancel:  {
                        label: game.i18n.localize("DANGERZONE.cancel"),
                        icon: '<i class="fas fa-times"></i>',
                        callback: () => {
                            resolve(null)
                            }
                        }
                    },
                default: 'submit'
                }, {width: 75}).render(true);
        });
    }

    async promptSelectXYArea(){
        let currentLayer = canvas.activeLayer;
        canvas.activateLayer('grid');
        await dangerZoneDimensions.addHighlightZone(this.zone.id, this.scene.id, '_wf');

        return new Promise((resolve, reject)=>{
            ui.notifications?.info(game.i18n.localize("DANGERZONE.alerts.select-target"));
            canvas.app.stage.once('pointerdown', event => {
                let selected = event.data.getLocalPosition(canvas.app.stage);
                resolve(selected);
            })
        }).then((selected)=> {
                this.userSelectedLocation.x = selected.x;
                this.userSelectedLocation.y = selected.y;
                dangerZoneDimensions.destroyHighlightZone(this.zone.id, '_wf');    
                currentLayer.activate();
        });  
    }
 
    /*Checks random d100 result against the zone's likelihood and outputs a true or false for whether likelihood is met*/
    async happens() {
        if(this.zone.likelihood < 100){
            const maybe = new Roll(`1d100`);
            this.likelihoodResult = await maybe.roll().result;
            if (this.likelihoodResult > this.zone.likelihood){this.active = false}
        }
    }

    async getZoneData(){
        this.zoneBoundary = await this.zone.scene.boundary();
        return this.zoneTokens = this.zoneBoundary.tokensIn(this.sceneTokens);
    }

    getZoneEligibleTokens(){
        return this.zoneEligibleTokens = this.zone.zoneEligibleTokens(this.zoneTokens);
    }

    async establishTargetBoundary() {
        if(Object.keys(this.userSelectedLocation).length){
            return this.getChosenLocationBoundary();
        }
        await this.getRandomLocationBoundary()
    }

    async highlightTargetBoundary(){
        if(this.targetBoundary && game.user.isGM && game.settings.get(dangerZone.ID, 'display-danger-boundary')){
            this.targetBoundary.highlight(this.id, 16711719)
            await wait(5000)
            this.targetBoundary.destroyHighlight(this.id);
        }
    }

    getChosenLocationBoundary(){
        const options = {excludes: this.zoneBoundary.excludes}
        this.zone.stretch(options);
        this.targetBoundary = locationToBoundary(this.selectedPoint, this.zoneType.dimensions.units, options);
        this.eligibleTargets = this.targetBoundary.tokensIn(this.zoneEligibleTokens);
    }

    async getRandomLocationBoundary() {
        let max = 1, i=0;
        const testBoundary = await this.zone.scene.randomDangerBoundary();
        if(this.zone.options.runUntilTokenFound && this.zoneEligibleTokens.length){
            max = 1000;
        }
        do {
            i++;
            const b = testBoundary.next()
            if(!b || b.done){return this.next(WORKFLOWSTATES.CANCEL)}
            this.targetBoundary = b.value;
            this.eligibleTargets = this.targetBoundary.tokensIn(this.zoneEligibleTokens);
        }
        while(this.eligibleTargets.length === 0 && i < max);
        return {attempts: i, max: max}
    }

    getZoneTargets(){
        if(!this.zone.options.allInArea){
            if(this.userSelectedTargets.length){
                return this.targets = this.userSelectedTargets
            }
            if(this.eligibleTargets.length > 1){
                return this.targets.push(this.eligibleTargets[Math.floor(Math.random() * this.eligibleTargets.length)])
            }
        }
        return this.targets = this.eligibleTargets
    }

    async gmChatDetails() {
        if(game.user.isGM && game.settings.get(dangerZone.ID, 'chat-details-to-gm')) {   
            let content = "Danger: " + this.zoneType.name + " w" + this.zoneType.dimensions.units.w + " h" + this.zoneType.dimensions.units.h  + " d" + this.zoneType.dimensions.units.d +
                "<br>Zone: bleed " + this.zone.options.bleed + ", hit all " + this.zone.options.allInArea + ", always hits " + this.zone.options.runUntilTokenFound + ", likelihood " + this.zone.likelihood +
                "<br>Likelihood result: " + this.likelihoodResult;
            if(this.targetBoundary?.A){
                content += "<br>Eligible zone tokens: " + this.zoneEligibleTokens.map(t => t.data.name) +
                "<br>Target boundary start: x" + this.targetBoundary.A.x + " y" + this.targetBoundary.A.y + " z" + this.targetBoundary.A.z +
                "<br>Target boundary end: x" + this.targetBoundary.B.x + " y" + this.targetBoundary.B.y + " z" + this.targetBoundary.B.z +
                "<br>Eligible targets: " + this.eligibleTargets.map(t => t.data.name) +
                "<br>Hit targets: " + this.targets.map(t => t.data.name)
            } 
            ChatMessage.create({
                content: content,
                whisper: [game.user.id]
            },{chatBubble : false})
        }
    }

    async deleteLastingEffects() {
        let tileIds=[];
        switch (this.zone.replace) {
            case 'Z':
                tileIds=this.scene.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId === this.zone.id).map(t => t.id);
                break;
            case 'T':
                tileIds=this.scene.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.zone.type).map(t => t.id);
                break;
            case 'R':
                tileIds=this.scene.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.trigger === this.zone.trigger).map(t => t.id);
                break;
            case 'A':
                tileIds=this.scene.tiles.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]).map(t => t.id);
                break;
            default:
                return this.log('Zone does not clear lasting effects', {});
        }
        if(tileIds.length){
            await wait(this.zoneTypeOptions.lastingEffect.delay);
            await canvas.scene.deleteEmbeddedDocuments("Tile", tileIds);
        }
        return this.log('Lasting effects cleared', {tiles: tileIds})
    }

    async createEffectTile(twinTile) {
        const effect = this.zoneTypeOptions.lastingEffect;
        const tiles = [];
        const boundary = twinTile ? this.twinLocation : this.targetBoundary


        let newTile = {
            flags: {[dangerZone.ID]: {[dangerZone.FLAGS.SCENETILE]: {zoneId: this.zone.id, trigger: this.zone.trigger, type: this.zone.type}}},
            hidden: false,
            img: effect.file,
            locked: false,
            height: boundary.height * effect.scale,
            overhead: boundary.bottom > 0 ? true : false,
            rotation: 0,
            scale: effect.scale,
            width: boundary.width * effect.scale,
            video: {autoplay: true, loop: effect.loop, volume: 0},
            x: boundary.A.x - ((effect.scale - 1) *  (boundary.width/2)),
            y: boundary.A.y - ((effect.scale - 1) *  (boundary.height/2)),
            z: boundary.bottom
        };

        if(betterRoofsOn && boundary.bottom){
            newTile.flags['betterroofs'] = {
                brMode: 3
            }
        }

        if(levelsOn && boundary.bottom){
            newTile.flags['levels'] = {
                "rangeTop": boundary.top,
                "rangeBottom": boundary.bottom,
                "showIfAbove": false,
                "showAboveRange": null,
                "isBasement": false,
                "noFogHide": false
            }
        }

        if(taggerOn && this.zoneTypeOptions.lastingEffect.tag){
            newTile.flags['tagger'] = {
                "tags": [this.zoneTypeOptions.lastingEffect.tag]
            }
        }

        if(monksActiveTilesOn){
            const flag = this.flags?.["monks-active-tiles"];
            if(flag?.macro?.macroid || flag?.teleport) {
                newTile.flags["monks-active-tiles"] = {
                    "actions": [],
                    "active": true,
                    "restriction": "all",
                    "controlled": "all",
                    "trigger": "enter",
                    "pertoken": false,
                    "chance": 100
                };

                //macro
                if(flag.macro?.macroid){
                    newTile.flags['monks-active-tiles'].actions.push(
                        {
                            "delay": flag.macro.delay,
                            "action": "runmacro",
                            "data": {
                                "macroid": flag.macro.macroid,
                                "args": flag.macro.args
                            },
                            "id": foundry.utils.randomID(16)
                        }
                    )
                };

                //teleport
                if(flag.teleport?.add){
                    if(isObjectEmpty(this.twinLocation)){
                        const rBoundary = await this.zone.scene.randomDangerBoundary();
                        this.twinLocation = rBoundary.next().value
                    };
                    const boundaryTwin = twinTile ? this.targetBoundary : this.twinLocation;
                    
                    newTile.flags['monks-active-tiles'].actions.push(
                        {
                            "action": "teleport",
                            "data": {
                                "animatepan": flag.teleport.animatepan,
                                "avoidtokens": flag.teleport.avoidtokens,
                                "deletesource": flag.teleport.deletesource,
                                "location": boundaryTwin.center
                            },
                            "id": foundry.utils.randomID(16)
                        }
                    )
                    
                    if(flag.teleport.twin && !twinTile && sequencerOn){
                        this.promises.push(this.foregroundEffect(true));
                        this.promises.push(this.backgroundEffect(true));
                        return await this.createEffectTile(newTile);
                    } 
                }
            }
        }

        tiles.push(newTile);
        if(twinTile){tiles.push(twinTile)}

        return await this.scene.createEmbeddedDocuments("Tile", tiles);
    }

    flavor() {
        if(this.zone.flavor) {   
            ChatMessage.create({
                content : this.zone.flavor
            },{chatBubble : false})
            return this.log('Zone flavor generated', {});
        }
        return this.log('Zone flavor skipped', {});
    }

    async foregroundEffect(twin = false){
        if(this.zoneTypeOptions.foregroundEffect?.file) {
            const boundary = twin ? this.twinLocation : this.targetBoundary;
            let s = new Sequence()
            if(this.zoneTypeOptions.foregroundEffect.delay){
                s = s.wait(this.zoneTypeOptions.foregroundEffect.delay)
            }
            if(this.zoneTypeOptions.foregroundEffect.source?.enabled && this.zoneTypeOptions.foregroundEffect.source?.name ){
                const tagged = await getTagEntities(this.zoneTypeOptions.foregroundEffect.source.name, this.scene);
                if(tagged && tagged.length){
                    for(let i=0; i<tagged.length; i++){
                        const document = tagged[i]
                        const documentName = document.documentName ? document.documentName : document.document.documentName;
                        const source = documentBoundary(documentName, document, {retain:true});
                        s = this._foregroundSequence(boundary, s, source);
                    }
                }
            } else {
                s = this._foregroundSequence(boundary, s);
            }
            s.play()
            return this.log('Zone foreground effect generated', {});
        } 
        return this.log('Zone foreground effect skipped', {});
    }

    _foregroundSequence(boundary, s, source = {}){
        const jb2a = this.zoneTypeOptions.foregroundEffect.file.indexOf('jb2a')===-1 ? false : true
        s = s.effect()
            .file(this.zoneTypeOptions.foregroundEffect.file)
            .zIndex(boundary.top)
            
            if(jb2a){
                s=s.JB2A()
            }

            if(source.center){
                s = s.atLocation(source.center)
                    .reachTowards(boundary.center)
                    if(!jb2a){
                        s=s.gridSize(this.zoneTypeOptions.foregroundEffect.scale * 200)
                        .startPoint(this.zoneTypeOptions.foregroundEffect.scale * 200)
                        .endPoint(this.zoneTypeOptions.foregroundEffect.scale * 200)
                    }
                    if(this.zoneTypeOptions.foregroundEffect.duration){
                        s = s.waitUntilFinished(this.zoneTypeOptions.foregroundEffect.duration)
                    }
            } else {
                s = s.atLocation(boundary.center)
                .scale(this.zoneTypeOptions.foregroundEffect.scale)
                .randomizeMirrorX()
                if(this.zoneTypeOptions.foregroundEffect.duration && this.zoneTypeOptions.foregroundEffect.duration>0){
                    s = s.duration(this.zoneTypeOptions.foregroundEffect.duration)
                }
            }

            if(this.zoneTypeOptions.foregroundEffect.repeat){
                s = s.repeats(this.zoneTypeOptions.foregroundEffect.repeat)
            }

        return s
    }

    async backgroundEffect(twin = false){ 
        if(this.zoneTypeOptions.backgroundEffect?.file) {
            const boundary = twin ? this.twinLocation : this.targetBoundary;      
            const jb2a = this.zoneTypeOptions.foregroundEffect.file.indexOf('jb2a')===-1 ? false : true
            let s = new Sequence()
                if(this.zoneTypeOptions.backgroundEffect.delay){
                    s = s.wait(this.zoneTypeOptions.backgroundEffect.delay)
                }
                
                s = s.effect()
                    .file(this.zoneTypeOptions.backgroundEffect.file)
                    .atLocation(boundary.center)
                    .scale(this.zoneTypeOptions.backgroundEffect.scale)
                    .zIndex(boundary.bottom)
                    
                    if(this.zoneTypeOptions.backgroundEffect.rotate){
                        s = s.randomRotation()
                    }

                    if(this.zoneTypeOptions.backgroundEffect.duration){
                        s = s.duration(this.zoneTypeOptions.backgroundEffect.duration)
                    }

                    if(this.zoneTypeOptions.backgroundEffect.repeat){
                        s = s.repeats(this.zoneTypeOptions.backgroundEffect.repeat)
                    }

                    if(jb2a){
                        s=s.JB2A()
                    }

                s.play()
            return this.log('Zone background effect generated', {});
        } 
        return this.log('Zone background effect skipped', {});
    }

    async lastingEffect(){
        if(this.zoneTypeOptions.lastingEffect?.file) {//the delay is handled during the clear operation
            let tile = await this.createEffectTile();
            return this.log('Zone lasting effect generated', {tile: tile});
        } 
        return this.log('Zone lasting effect skipped', {});
    }

    async audioEffect() {
        if(this.zoneTypeOptions.audio?.file) {
            const audio = this.zoneTypeOptions.audio;
            await wait(audio.delay);
            const sound = await AudioHelper.play({src: audio.file, volume: audio.volume, loop: false, autoplay: true}, true);
            this.log('Zone audio effect generated', {sound: sound});
            return {audio: sound}
        }
        this.log('Zone audio effect skipped', {});
        return {audio: false}
    }

    async tokenEffect(){
        if(this.zoneTypeOptions.tokenEffect?.file) {
            const jb2a = this.zoneTypeOptions.foregroundEffect.file.indexOf('jb2a')===-1 ? false : true
            for (let i = 0; i < this.targets.length; i++) { 

                let s = new Sequence()
                if(this.zoneTypeOptions.tokenEffect.delay){
                   s = s.wait(this.zoneTypeOptions.tokenEffect.delay)
                }
                s = s.effect()
                    .file(this.zoneTypeOptions.tokenEffect.file)
                    .attachTo(this.targets[i])
                    .scale(this.zoneTypeOptions.tokenEffect.scale)
                if(this.zoneTypeOptions.tokenEffect.duration){
                   s = s.duration(this.zoneTypeOptions.tokenEffect.duration)
                    .fadeOut(500)
                } else {
                    s=s.persist()
                }
                if(jb2a){
                    s=s.JB2A()
                }
                s.play()
            }
            return this.log('Zone token effect generated', {});
        } 
        return this.log('Zone token effect skipped', {});
    }

    async activeEffect() {
        if(Object.keys(this.zoneTypeOptions.effect).length && this.targets.length) {
            for (let i = 0; i < this.targets.length; i++) { 
                await this.targets[i].actor.createEmbeddedDocuments("ActiveEffect", [this.zoneTypeOptions.effect]);
            }
            this.log('Zone active effect generated', {});
            return {activeEffect: this.zoneTypeOptions.effect}
        }
        this.log('Zone active effect skipped', {});
        return {activeEffect: false}
    }

    async macro() {
        if(this.zoneTypeOptions.macro) {
            const macro = await game.macros.get(this.zoneTypeOptions.macro);
            if(macro){
                await macro.execute(this);
                this.log('Zone macro generated', {macro: macro});
            } else {
                this.log('Zone macro not Found', {});
            }
            return {macro: macro}
        }
        this.log('Zone macro skipped', {});
        return {macro: false}
    }

    async deleteLight() {
        let lightIds;
        switch (this.zone.lightReplace) {
            case 'Z':
                lightIds=this.scene.lights.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.zoneId === this.zone.id).map(t => t.id);
                break;
            case 'T':
                lightIds=this.scene.lights.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.type === this.zone.type).map(t => t.id);
                break;
            case 'R':
                lightIds=this.scene.lights.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]?.trigger === this.zone.trigger).map(t => t.id);
                break;
            case 'A':
                lightIds=this.scene.lights.filter(t => t.data.flags[dangerZone.ID]?.[dangerZone.FLAGS.SCENETILE]).map(t => t.id);
                break;
            default:
                return this.log('Zone does not clear ambient lighting', {});
        }
		await canvas.scene.deleteEmbeddedDocuments("AmbientLight", lightIds);
        return this.log('Ambient light cleared', {lights: lightIds})
    }

    async createLight() {
        if(this.zoneTypeOptions.ambientLight?.dim || this.zoneTypeOptions.ambientLight?.bright) {
            let c = this.targetBoundary.center

            const light = {
                t: "l",
                x: c.x,
                y: c.y,
                rotation: this.zoneTypeOptions.ambientLight.rotation,
                dim: this.zoneTypeOptions.ambientLight.dim,
                bright: this.zoneTypeOptions.ambientLight.bright,
                angle: this.zoneTypeOptions.ambientLight.angle,
                tintColor: this.zoneTypeOptions.ambientLight.tintColor,
                tintAlpha: Math.pow(this.zoneTypeOptions.ambientLight.tintAlpha, 2).toNearest(0.01),
                lightAnimation: {
                    speed: this.zoneTypeOptions.ambientLight.lightAnimation.speed,
                    intensity: this.zoneTypeOptions.ambientLight.lightAnimation.intensity,
                    type: this.zoneTypeOptions.ambientLight.lightAnimation.type
                },
                hidden: false,
                flags: {[dangerZone.ID]: {[dangerZone.FLAGS.SCENETILE]: {zoneId: this.zone.id, trigger: this.zone.trigger, type: this.zone.type}}}
            }

            if(levelsOn && (this.targetBoundary.bottom || this.targetBoundary.top)){
                light.flags['levels'] = {
                    "rangeTop": this.targetBoundary.top,
                    "rangeBottom": this.targetBoundary.bottom
                }
            }
            if(taggerOn && this.zoneTypeOptions.ambientLight.tag){
                light.flags['tagger'] = {
                    "tags": [this.zoneTypeOptions.ambientLight.tag]
                }
            }
            await this.scene.createEmbeddedDocuments("AmbientLight",[light]);
            return this.log('Zone ambient light generated', {light: light});
        }
        return this.log('Zone ambient light not generated', {});
    }

    /*Module Integrations*/
    async fluidCanvas(){
        const flag = this.flags?.fluidCanvas;
        if(flag?.type){
            if(flag.delay){await wait(flag.delay)}
            const users = game.users.map(u => u.id);
            switch (flag.type){
                case 'black':
                   await KFC.executeAsGM("black",users);
                   await wait(flag.duration);
                   await KFC.executeAsGM("black",users);
                   break;
                case 'blur':
                    await KFC.executeAsGM("blur",users, flag.intensity);
                    await wait(flag.duration);
                    await KFC.executeAsGM("blur",users);
                    break;
                case 'drug':
                    await KFC.executeAsGM("drug",users, flag.intensity, flag.duration, flag.iteration);
                    await wait(flag.duration);
                    await KFC.executeAsGM("drug",users);
                    break;
                case 'earthquake':
                    await KFC.executeForEveryone("earthquake", flag.intensity, flag.duration, flag.iteration);
                    break;
                case 'heartbeat':
                    await KFC.executeForEveryone("heartbeat", flag.intensity, flag.duration, flag.iteration);
                    break;
                case 'negative':
                    await KFC.executeAsGM("negative",(users));
                    await wait(flag.duration);
                    await KFC.executeAsGM("negative",(users));
                    break;
                case 'sepia':
                    await KFC.executeAsGM("sepia",(users));
                    await wait(flag.duration);
                    await KFC.executeAsGM("sepia",(users));
                    break;
                case 'spin':
                    await KFC.executeForEveryone("spin",flag.intensity, flag.duration, flag.iteration);
                    break;
            }
        }
    }

    async tokenSays() {
        const flag = this.flags?.tokenSays;
        if(this.targets.length && flag?.fileType && (flag?.fileName || flag?.fileType)) {
            const options = {
                type: flag.fileType,
                source: flag.fileName,
                compendium: flag.compendiumName,
                quote: flag.fileTitle
            }
            let actor = '';
            for (let i = 0; i < this.targets.length; i++) { 
                let token = this.targets[i].id;
                await tokenSays.saysDirect(token, actor, this.scene.id, options);
            }
            this.log('Token Says generated', {options: options});
            return {'token-says': options}
        }
        this.log('Token Says skipped', {});
        return {'token-says': false}
    }

    async spawnWarpgate() {
        const flag = this.flags?.warpgate;
        if(flag?.actor){                           
            let options = {}, callbacks = {}, updates = {token: {elevation: this.targetBoundary.bottom}}, actor = '';
            if(flag.duplicates > 1){options= {"duplicates": flag.duplicates}}
            if(flag.isRolltable){
                let table = game.tables.getName(flag.actor);
                if(!table){return dangerZone.log(false,'Warpgate Rolltable Not Found ', {"warpgate-data": flag})}
                let rolledResult = await table.roll(); 
                actor = rolledResult.results[0].data.text;
            } else {actor = flag.actor}
            const token = await game.actors.getName(actor).getTokenData();
        
            if(!token){return this.log('Warpgate Token is Blank ', {"warpgate-data": flag})}
            else {
                if(flag.delay > 0){
                    await warpgate.wait(flag.delay);
                }
                await warpgate.spawnAt(this.targetBoundary.center, token, updates, callbacks, options);
            }
            this.log('Warpgate spawned! ', {"actor": actor, "warpgate-data": flag});
            return {warpgate: {"actor": actor, "data": flag}}
        }
        this.log('Warpgate skipped ', {})
        return {warpgate: false}
    }
}


