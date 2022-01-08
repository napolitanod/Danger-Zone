import {daeOn} from '../index.js';


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

export const SOURCETREATMENT = {
    "": "DANGERZONE.source.treatment.none",
    "I": "DANGERZONE.source.treatment.ignore",
    "S": "DANGERZONE.source.treatment.also",
    "O": "DANGERZONE.source.treatment.only"
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