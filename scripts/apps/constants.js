import {daeOn} from '../index.js';
import {tokenSaysOn, monksActiveTilesOn, perfectVisionOn, warpgateOn, fluidCanvasOn, sequencerOn, betterRoofsOn, levelsOn, taggerOn, wallHeightOn, midiQolOn} from '../index.js';

export const WORKFLOWSTATES = {
    NONE: 0,
    INITIALIZE: 1,
    EXECUTE: 2,
    INFORM: 3,
    CANCEL: 98,
    COMPLETE: 99
}

export const WORLDZONE = {
    "options": {
        "bleed": false,
        "delay": {"min": 0, "max": 0},
        "placeTemplate": false,
        "noPrompt": false,
        "stretch": "",
        "allInArea": false
    },
    "source": {
        "actor": ""
    },
    "tokenDisposition": "",
    "actor": "",
    "loop": 1,
    "replace": "N",
    "lightReplace": "N",
    "wallReplace": "N",
    "flavor": "",
    "enabled": true
  }

export const AMBIENTLIGHTCLEAROPS = {
    'D': 'DANGERZONE.light.clear-types.delete',
    'O': 'DANGERZONE.light.clear-types.off'
}

export const SCENEFORMICONDISPLAYOPTIONS = {
    'B': 'DANGERZONE.setting.scene-header.display.iconLabel', 
    'I': 'DANGERZONE.setting.scene-header.display.iconOnly', 
    'N': 'DANGERZONE.setting.scene-header.display.none'
};

export const TRIGGERDISPLAYOPTIONS = {
    "S": "DANGERZONE.trigger-display-options.scene.label",
    "H":"DANGERZONE.trigger-display-options.hotbar.label"
}

export const TOKENDISPOSITION = {
    "0": "DANGERZONE.token-disposition.neutral.label",
    "1": "DANGERZONE.token-disposition.friendly.label",
    "-1": "DANGERZONE.token-disposition.hostile.label"
}

export const DANGERZONEREPLACE = {
    "N": "DANGERZONE.replace-types.N.label", 
    "R": "DANGERZONE.replace-types.R.label",
    "T": "DANGERZONE.replace-types.T.label",
    "Z": "DANGERZONE.replace-types.Z.label",
    "A": "DANGERZONE.replace-types.A.label"
}

export const DANGERZONELIGHTREPLACE = {
    "N": "DANGERZONE.light.replace-types.N.label", 
    "R": "DANGERZONE.light.replace-types.R.label",
    "T": "DANGERZONE.light.replace-types.T.label",
    "Z": "DANGERZONE.light.replace-types.Z.label",
    "A": "DANGERZONE.light.replace-types.A.label"
}

export const DANGERZONEWALLREPLACE = {
    "N": "DANGERZONE.wall.replace-types.N.label", 
    "R": "DANGERZONE.wall.replace-types.R.label",
    "T": "DANGERZONE.wall.replace-types.T.label",
    "Z": "DANGERZONE.wall.replace-types.Z.label",
    "A": "DANGERZONE.wall.replace-types.A.label"
}

export const DANGERZONETRIGGERS = {
    "manual":  "DANGERZONE.trigger-types.manual.label",
    "aura":  "DANGERZONE.trigger-types.aura.label",
    "move":  "DANGERZONE.trigger-types.move.label",
    "combat-start":  "DANGERZONE.trigger-types.combat-start.label",
    "combat-end":  "DANGERZONE.trigger-types.combat-end.label",
    "initiative-start":  "DANGERZONE.trigger-types.initiative-start.label",
    "initiative-end":  "DANGERZONE.trigger-types.initiative-end.label",
    "round-start":  "DANGERZONE.trigger-types.round-start.label",
    "round-end":  "DANGERZONE.trigger-types.round-end.label",
    "turn-start":  "DANGERZONE.trigger-types.turn-start.label",
    "turn-end":  "DANGERZONE.trigger-types.turn-end.label"
} 

export const COMBATTRIGGERS = ["combat-start","combat-end","initiative-start","initiative-end","round-start","round-end","turn-start","turn-end"];
export const ENDOFTURNTRIGGERS = ["combat-end","initiative-end","round-end","turn-end"]

export const DANGERZONETRIGGERSORT = {
    "manual":  8,
    "aura": 21,
    "move": 20,
    "combat-start":  7,
    "combat-end":  0,
    "initiative-start":  2,
    "initiative-end":  5,
    "round-start":  3,
    "round-end":  4,
    "turn-start":  1,
    "turn-end":  6
} 

export const TRIGGEROPERATION = {
    "Q": "DANGERZONE.trigger-operation.sequential",
    "G": "DANGERZONE.trigger-operation.staggered",
    "T": "DANGERZONE.trigger-operation.together"
}

export const SOURCETREATMENT = {
    "": "DANGERZONE.source.treatment.none",
    "I": "DANGERZONE.source.treatment.ignore",
    "S": "DANGERZONE.source.treatment.also",
    "O": "DANGERZONE.source.treatment.only"
}

//a few options are added via the setModOptions function if tagger is on
export const SOURCEAREA = {
    "": "DANGERZONE.source.area.none",
    "A": "DANGERZONE.source.area.actor",
    "D": "DANGERZONE.source.area.danger.placeable",
    "T": "DANGERZONE.source.area.tag",
    "Z": "DANGERZONE.source.area.zone.placeable"
}

export const SOURCEAREATARGET = {
    "": "DANGERZONE.source.target.none",
    "A": "DANGERZONE.source.target.adjacent",
    "I": "DANGERZONE.source.target.in",
    "B": "DANGERZONE.source.target.both"
}

export const STRETCH = {
    "": "",
    "B": "DANGERZONE.stretch.bottom.label",
    "G": "DANGERZONE.stretch.ground.label",
    "S": "DANGERZONE.stretch.sky.label",
    "T": "DANGERZONE.stretch.top.label"
}

export const HORIZONTALMOVEMENT = {
    "": "",
    "D": "DANGERZONE.type-form.tokenMove.horizontal-directions.left.label",
    "U": "DANGERZONE.type-form.tokenMove.horizontal-directions.right.label",
    "R": "DANGERZONE.type-form.tokenMove.horizontal-directions.random.label"
}

export const VERTICALMOVEMENT = {
    "": "",
    "D": "DANGERZONE.type-form.tokenMove.vertical-directions.down.label",
    "U": "DANGERZONE.type-form.tokenMove.vertical-directions.up.label",
    "R": "DANGERZONE.type-form.tokenMove.vertical-directions.random.label"
}

export const ELEVATIONMOVEMENT = {
    "": "",
    "R": "DANGERZONE.type-form.tokenMove.elevation-types.relative.label",
    "S": "DANGERZONE.type-form.tokenMove.elevation-types.set.label"
}

export const FLUIDCANVASTYPES = {
    "black": "DANGERZONE.type-form.fluidCanvas.types.black",
    "blur": "DANGERZONE.type-form.fluidCanvas.types.blur",
    "drug": "DANGERZONE.type-form.fluidCanvas.types.drug",
    "earthquake": "DANGERZONE.type-form.fluidCanvas.types.earthquake",
    "fade": "DANGERZONE.type-form.fluidCanvas.types.fade",
    "heartbeat": "DANGERZONE.type-form.fluidCanvas.types.heartbeat",
    "negative": "DANGERZONE.type-form.fluidCanvas.types.negative",
    "sepia": "DANGERZONE.type-form.fluidCanvas.types.sepia",
    "spin": "DANGERZONE.type-form.fluidCanvas.types.spin"
}

export const SOURCETRIGGERS = {
    "": "DANGERZONE.edit-form.source.triggers.any",
    "C": "DANGERZONE.edit-form.source.triggers.scene",
    "S": "DANGERZONE.edit-form.source.triggers.source"
}

export const TOKENSAYSTYPES = {
    "audio":  "DANGERZONE.type-form.tokenSays.rule-type-option.playlist",
    "rollTable":  "DANGERZONE.type-form.tokenSays.rule-type-option.roll-table"
}

export const DAMAGEONSAVE = {
    "N": "DANGERZONE.type-form.tokenResponse.damage.save.options.none",
    "H":"DANGERZONE.type-form.tokenResponse.damage.save.options.half",
    "F": "DANGERZONE.type-form.tokenResponse.damage.save.options.full"
}

export const SAVERESULT = {
    0: "DANGERZONE.type-form.tokenResponse.save.result.both",
    2: "DANGERZONE.type-form.tokenResponse.save.result.fail",
    1: "DANGERZONE.type-form.tokenResponse.save.result.success"
}

export const DAEDuration = daeOn ? DAE.daeSpecialDurations() : {}

export function actorOps(){
    return game.actors.reduce((obj, a) => {obj['']=''; obj[a.id] = a.name; return obj;}, {})
}

export function sceneOps(){
    return game.scenes.reduce((obj, a) => {obj['']=''; obj[a.id] = a.name; return obj;}, {})
}

export const MOVETYPES = {
    0: "DANGERZONE.restrictions.none",
    1: "DANGERZONE.restrictions.normal"
}

export const FVTTMOVETYPES = {
    0: 0,
    1: 20
}

export const SENSETYPES = {
    0: "DANGERZONE.restrictions.none",
    2: "DANGERZONE.restrictions.limited",
    1: "DANGERZONE.restrictions.normal"
}

export const FVTTSENSETYPES = {
    0: 0,
    1: 20,
    2: 10
}

export function dirTypes(){ 
    return Object.keys(CONST.WALL_DIRECTIONS).reduce((obj, key) => {
        let k = CONST.WALL_DIRECTIONS[key];
        obj[k] = key.titleCase();
        return obj;
    }, {})
}

export function doorTypes(){
    return Object.keys(CONST.WALL_DOOR_TYPES).reduce((obj, key) => {
        let k = CONST.WALL_DOOR_TYPES[key];
        obj[k] = key.titleCase();
        return obj;
    }, {})
}

export function animationTypes() {
    const animationTypes = {"": game.i18n.localize("DANGERZONE.none")};
    for ( let [k, v] of Object.entries(CONFIG.Canvas.lightAnimations) ) {
      animationTypes[k] = v.label;
    }
    return animationTypes;
}

export function determineMacroList() {
  let list = {};
  for (let macro of game.macros.contents.sort((a, b) => { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)})) {
    list[macro.id] = macro.name;
  }
  return list;
}

export function saveTypes() {
    switch(game.world.data.system){
        case "dnd5e":
            return game.dnd5e.config.abilities
        default:
            return {}
    }
}

export function damageTypes() {
    switch(game.world.data.system){
        case "dnd5e":
            return Object.assign(game.dnd5e.config.damageTypes, game.dnd5e.config.healingTypes)
        default:
            return {}
    }
}

export const TILEOCCLUSIONMODES = {
    "NONE": "DANGERZONE.occlusionmodes.none",
    "FADE": "DANGERZONE.occlusionmodes.fade",
    "ROOF": "DANGERZONE.occlusionmodes.roof",
    "RADIAL": "DANGERZONE.occlusionmodes.radial"
}

export const TIMESUPMACROREPEAT = {
    "startEveryTurn": "DANGERZONE.times-up-macro.start",
    "endEveryTurn": "DANGERZONE.times-up-macro.end"
}

export const WALLSBLOCK = {
    "" : "DANGERZONE.walls-block.none.label",
    "A" : "DANGERZONE.walls-block.all.label"
}

export const TILESBLOCK = {
    "" : "DANGERZONE.tiles-block.none.label",
    "A" : "DANGERZONE.tiles-block.all.label",
    "R" : "DANGERZONE.tiles-block.roof.label",
    "B" : "DANGERZONE.tiles-block.bottom.label",
    "T" : "DANGERZONE.tiles-block.top.label"
}

export function setModOptions(){
    if(taggerOn){
        SOURCEAREA["C"] = "DANGERZONE.source.area.danger.tile"; 
        SOURCEAREA["Y"] = "DANGERZONE.source.area.zone.tile";  
    }     
}

export const EXECUTABLEOPTIONS = {};

export function setExecutableOptions(){
    Object.assign(EXECUTABLEOPTIONS, {
            'effect': {
                title: "Active Effect", 
                icon: "fas fa-hand-sparkles",
                scope: "token"
            },
            'audio': {
                title: "Audio", 
                icon: "fas fa-music", 
                modules: [{active: sequencerOn, name: "sequencer", dependent: false}],
                scope: "scene"
            },
            'foregroundEffect': {
                title: "Primary Effect", 
                icon: "fas fa-fire", 
                modules: [{active: sequencerOn, name: "sequencer", dependent: true}],
                scope: "boundary"
            },
            'ambientLight': {
                title: "Ambient Light", 
                icon: "fas fa-lightbulb", 
                document: "AmbientLight", 
                wipeable: true, 
                modules: [
                    {active: levelsOn, name: "levels", dependent: false}, 
                    {active: perfectVisionOn, name: "perfect-vision", dependent: false},
                    {active: taggerOn, name: "tagger", dependent: false}
                ],
                scope: "boundary"
            },
            'fluidCanvas': {
                title: "Canvas", 
                icon: "fas fa-wind", 
                modules: [{active: fluidCanvasOn, name: "kandashis-fluid-canvas", dependent: true}],
                scope: "scene"
            },
            'damage': {
                title: "Damage", 
                icon: "fas fa-skull", 
                modules: [{active: midiQolOn, name: "midi-qol", dependent: true}],
                scope: "token"
            },
            'lastingEffect': {
                title: "Lasting Effect", 
                icon: "fas fa-cube", 
                document: "Tile",  
                wipeable: true, 
                modules: [
                    {active: monksActiveTilesOn, name: "monks-active-tiles", dependent: false},
                    {active: taggerOn, name: "tagger", dependent: false},
                    {active: levelsOn, name: "levels", dependent: false},
                    {active: betterRoofsOn, name: "better-roofs", dependent: false}
                ],
                scope: "boundary"
            },
            'macro': {
                title: "Macro", 
                icon: "fas fa-file-code",
                scope: "scene"
            },
            'mutate': {
                title: "Mutate", 
                icon: "fas fa-pastafarianism", 
                modules:[
                    {active: warpgateOn, name: "warpgate", dependent: true}, 
                    {active: taggerOn, name: "tagger", dependent: false}
                ],
                scope: "token"
            },
            'backgroundEffect': {
                title: "Secondary Effect", 
                icon: "fas fa-bomb", 
                modules: [{active: sequencerOn, name: "sequencer", dependent: true}],
                scope: "boundary"
            },
            'save': {
                title: "Save", 
                icon: "fas fa-shield-alt",
                scope: "token"
            },
            'warpgate': {
                title: "Spawn", 
                icon: "fas fa-circle-notch", 
                modules:[
                    {active: warpgateOn, name: "warpgate", dependent: true}, 
                    {active: taggerOn, name: "tagger", dependent: false}
                ],
                scope: "boundary"
            },
            'tokenMove': {
                title: "Token Move", 
                icon: "fas fa-arrows-alt",
                scope: "token"
            },
            'tokenEffect': {
                title: "Token Effect", 
                icon: "fas fa-male", 
                modules: [{active: sequencerOn, name: "sequencer", dependent: true}],
                scope: "token"
            },
            'tokenSays': {
                title: "Token Says", 
                icon: "fas fa-comment", 
                modules: [{active: tokenSaysOn, name: "token-says", dependent: true}],
                scope: "token"
            },
            'wall': {
                title: "Wall", 
                icon: "fas fa-university", 
                document: "Wall",  
                wipeable: true,
                modules:[
                    {active: wallHeightOn, name: "wall-height", dependent: false}, 
                    {active: taggerOn, name: "tagger", dependent: false}
                ],
                scope: "boundary"
            },
            'flavor': {
                title: "Flavor", 
                icon:"fas fa-book",
                scope: "scene"
            } 
        });
  }
