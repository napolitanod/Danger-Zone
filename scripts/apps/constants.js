import {daeOn} from '../index.js';

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

export const STRETCH = {
    "": "",
    "B": "DANGERZONE.stretch.bottom.label",
    "G": "DANGERZONE.stretch.ground.label",
    "S": "DANGERZONE.stretch.sky.label",
    "T": "DANGERZONE.stretch.top.label"
}

export const DAEDuration = daeOn ? DAE.daeSpecialDurations() : {}

export function actorOps(){
    return game.actors.reduce((obj, a) => {obj['']=''; obj[a.id] = a.name; return obj;}, {})
}

export function moveTypes(){
    return Object.keys(CONST.WALL_MOVEMENT_TYPES).reduce((obj, key) => {
        let k = CONST.WALL_MOVEMENT_TYPES[key];
        obj[k] = key.titleCase();
        return obj;
    }, {})
}

export function senseTypes(){
   return Object.keys(CONST.WALL_SENSE_TYPES).reduce((obj, key) => {
        let k = CONST.WALL_SENSE_TYPES[key];
        obj[k] = key.titleCase();
        return obj;
    }, {})
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