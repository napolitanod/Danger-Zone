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

export const DANGERZONETRIGGERS = {
    "manual":  "DANGERZONE.trigger-types.manual.label",
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
    "combat-start":  7,
    "combat-end":  0,
    "initiative-start":  2,
    "initiative-end":  5,
    "round-start":  3,
    "round-end":  4,
    "turn-start":  1,
    "turn-end":  6
} 

export function actorOps(){
    return game.actors.reduce((obj, a) => {obj['']=''; obj[a.id] = a.name; return obj;}, {})
}