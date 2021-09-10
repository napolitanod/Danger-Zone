/*
lock bottom or top
better roofs/levels
*/

import {dangerZone} from '../danger-zone.js';
import {dangerZoneType} from './zone-type.js';

export class dangerZoneDimensions {

    /**
     * @param {string} zoneId - id of the parent zone
     * @param {string} sceneId - the id of the scene  
    */
    constructor (sceneId, zoneId) {
        this.zoneId = zoneId,
        this.sceneId = sceneId,
        this.end = {
            x: 0,
            y: 0,
            z: 0
        },
        this.start = {
            x: 0,
            y: 0,
            z: 0
        }
        ;
        this._init();
    }
  
    /**
     * refreshes class data with scene data
     */
     _init() {
        const scene = game.scenes.get(this.sceneId);
        const dim = scene.dimensions;

        this.start.x = dim.paddingX,
        this.start.y = dim.paddingY,
        this.end.x = dim.sceneWidth + dim.paddingX,
        this.end.y = dim.sceneHeight + dim.paddingY;
    }

  
   /**
    * generates a random target area based on zone size zone bleed, scene size and zone type size
    * @returns object with dimension coordinats indicating boundary of the area
    */
    async randomArea() {
        const zn = dangerZone.getZoneFromScene(this.zoneId, this.sceneId);
        const znType = dangerZoneType.getDangerZoneType(zn.type).dimensions.units;
        const g = this.getUnitDimensions();

        const adjX = Math.min(g.start[0], (znType.w-1));
        const adjY = Math.min(g.start[1], (znType.h-1));
        let adjZ = 0;
        if(g.d){
            if(znType.d){
                adjZ = znType.d
            } else {
                adjZ = (g.d - 1)
            }
        } 
        
        if(zn.options.bleed){
            g.w += adjX;
            g.h += adjY;
            g.d += adjZ;
            g.start[0] -= adjX;
            g.start[1] -= adjY;
            g.start[2] -= adjZ;
        } else {
            g.w -= (znType.w-1);
            g.h -= (znType.h-1);
            g.d -= adjZ;
        }

        const area = (g.w * g.h);
        if(area < 1 || g.d < 0){
            return dangerZone.log(false,'Invalid zone settings ', {unitDimensions: g, area: area, zoneType: znType, zone: zn})
        }

        const rolledResult = await new Roll(`1d${area}`).roll().result;
        const posY = g.start[1] + Math.floor((rolledResult-1)/g.w);
        const posX = g.start[0] + ((rolledResult - 1) % g.w);  

        let start = canvas.grid.grid.getPixelsFromGridPosition(posX, posY);
        let end = canvas.grid.grid.getPixelsFromGridPosition(posX+znType.w, posY+znType.h);
        
        if(g.d > 0){
            const zResult = await new Roll(`1d${g.d}`).roll().result;
            let zStart = g.start[2] + (zResult-1);
            start.push(zStart);
            end.push(zStart + adjZ);
        } else {
            start.push(g.start[2]);
            end.push(g.start[2] + adjZ);
        }

        //dangerZone.log(false,'Random Area Variables ', {"zoneScene": this, randomArea: {units: g, start: start, end: end}, roll: rolledResult, zoneType: znType, zone: zn})
        return this._conformBoundary(start[0], start[1], start[2], end[0], end[1], end[2])
    }

    /**
     * intakes PIXEL coordinates for two locations on the grid and conforms them to the expected boundary object structure 
     * with locations shifted to be top right and bottom left and to be top left point of grid location
     * @param {integer} x1 location 1 x
     * @param {integer} y1 location 1 y
     * @param {integer} z1 location 1 z
     * @param {integer} x2 location 2 x
     * @param {integer} y2 location 2 y
     * @param {integer} z2 location 2 z
     * @returns object with x, y, and z coordinates for top left and bottom right of boundary in PIXELS
     */
    static conformBoundary(x1, y1, z1, x2, y2, z2){    
        const s = canvas.grid.getTopLeft(Math.min(x1, x2), Math.min(y1, y2));
        const e = canvas.grid.getTopLeft(Math.max(x1, x2), Math.max(y1, y2));
        return {
            start: {
                x: s[0], 
                y: s[1],
                z: Math.min(z1, z2)
            }, 
            end: {
                x: e[0], 
                y: e[1],
                z: Math.max(z1, z2)
            }
        }
    }

    /**
     * private call of conformBoundary. See that method's definition
     */
    _conformBoundary(x1, y1, z1, x2, y2, z2){
        return dangerZoneDimensions.conformBoundary(x1, y1, z1, x2, y2, z2);
    }

    /**
     * convert a given pixel location and one object in height, width and depth in grid units to 2 x/y/z pixel coordinates
     * @param {integer} x - starting location position x in PIXELS
     * @param {integer} y - starting location position y in PIXELS
     * @param {integer} z - starting location position z 
     * @param {array} units -array of width, height and depth in grid units
     * @returns objects with two x/y/z PIXEL coordinates in boundary structure
     */
    locationToBoundary(x,y,z, units){
        let start = canvas.grid.grid.getGridPositionFromPixels(x, y);
        let end = canvas.grid.grid.getPixelsFromGridPosition(start[0]+units.w, start[1]+units.h);
        return this._conformBoundary(x, y, z, end[0], end[1], (z + units.d))
    }
    
    _conformBoundaryToZone(boundary){
        let start = this._conformLocationToZone(boundary.start.x, boundary.start.y, boundary.start.z);
        let end = this._conformLocationToZone(boundary.end.x, boundary.end.y, boundary.end.z);
        dangerZone.log(false, 'Conform to zone', {boundary: boundary, conform: {start: start, end: end}});
        return {start: start.location, end: end.location}
    }

    static conformLocationToZone(x,y,z,zoneId,sceneId,conformOnly = false){
        let zn = dangerZone.getZoneFromScene(zoneId, sceneId);
        const g = zn.getUnitDimensions();
        return zn._conformLocationToZone(x,y,z,g, conformOnly)
    }

    _conformLocationToZone(x,y,z,conformOnly = false){
        let b = this.getUnitDimensions();
        return dangerZoneDimensions.conformCheck(x,y,z,b,conformOnly)
    }
 
    static conformLocationToBoundary(x,y,z,boundary,conformOnly = false){
        let b = dangerZoneDimensions.getUnitDimensions(boundary);
        return dangerZoneDimensions.conformCheck(x,y,z,b,conformOnly)
    }

    static conformCheck(x,y,z,b,conformOnly){
        let g = canvas.grid.grid.getGridPositionFromPixels(x, y);
        let location={x:g[0], y:g[1], z:z}; let conforms = true;
        if(g[0] >= b.start[0]){
            if (g[0] >= (b.start[0] + b.w)) {
                if(conformOnly){return false}
                location.x=b.start[0] + (b.w -1); conforms = false;
            } 
        } else {
            if(conformOnly){return false}
            location.x=b.start[0]; conforms = false;
        }

        if(g[1] >= b.start[1]){
            if (g[1] >= (b.start[1] + b.h)) {
                if(conformOnly){return false}
                location.y=b.start[1] + (b.h-1); conforms = false;
            } 
        } else {
            if(conformOnly){return false}
            location.y=b.start[1]; conforms = false;
        }

        if(!b.d || z >= b.start[2]){
            if (b.d && z >= (b.start[2] + b.d)) {
                if(conformOnly) {
                    return false
                }
                location.z = b.start[2] + (b.d - 1); 
                conforms = false;
            } 
        } else {
            if(conformOnly){
                return false
            }
            location.z = b.start[2]; 
            conforms = false;
        }

        return {location: location, conforms: conforms}
    }

    static unitDimensionsInBoundary(tokenU, boundary){
        let g = dangerZoneDimensions.getUnitDimensions(boundary);
        if(!g.d || (tokenU.start[2] <= (g.start[2] + g.d)) && ((tokenU.start[2] + tokenU.d) >= g.start[2])) {
            for(let j=0; j < g.h || j===0; j++){
                for(let i=0; i < g.w || i===0; i++){
                    if (tokenU.start[0] === g.start[0]+i && tokenU.start[1] === g.start[1]+j) {
                        return true
                    }
                }
            }
        }
        return false
    }

    /**
     * Returns an array of tokens that have x and y coordinate that fit within the boundary provided.
     * @param {array} tokens - an array of tokens
     * @param {object} boundary - an object indicating the top left start point and bottom right end point 
     *                            in a boundy {start: {x: , y:, z: }, end: {x: , y: ,z: }}
     * @returns array of tokens
    */
     static tokensInBoundary(tokens, boundary){
        const b = dangerZoneDimensions.conformBoundary(boundary.start.x, boundary.start.y, boundary.start.z, boundary.end.x, boundary.end.y, boundary.end.z);
        const multiplier = game.settings.get(dangerZone.ID, 'scene-control-button-display');
        let kept = [];
        for(let token of tokens){
            let d = (token.parent.dimensions.distance * Math.max(token.data.width, token.data.height) * token.data.scale * multiplier);
            let s = canvas.grid.grid.getGridPositionFromPixels(token.data.x, token.data.y);
            s.push(token.data.elevation);
            let g = {w: token.data.width, h: token.data.height, d: d, start:s};
            if(dangerZoneDimensions.unitDimensionsInBoundary(g, b)){
                kept.push(token)
            }
        }
        return kept
    } 

    /**
     * intakes an array of tokens and identifies which are in a given zone (the whole zone)
     * @param {array} tokens 
     * @returns array of tokens
     */
    tokensInZone(tokens){
        if(!tokens){tokens = game.scenes.get(this.sceneId)}
        return dangerZoneDimensions.tokensInBoundary(tokens, {start: this.start, end: this.end});
    } 

    /**
     * Returns tokens from an array that are found in the given boundary as well as the given zone
     * @param {array} tokens - an array of tokens 
     * @param {object} boundary - an object in standard boundary structure
     * @returns array of tokens
     */
    tokensInBoundaryInZone(tokens, boundary){
        return dangerZoneDimensions.tokensInBoundary(this.tokensInZone(tokens), boundary);
    }

    /**
     * convert a given pixel location along with it's height and width in grid units to a PIXEL based x/y center point and the width and height in PIXELS
     * @param {integer} x - starting location position x in PIXELS
     * @param {integer} y - starting location position y in PIXELS
     * @param {integer} z - starting z location position 
     * @param {array} units -array of width, height and depth in grid units 
     * @returns objects with width, height and depth in PIXELS, the center point location on the grid as x/y object in PIXELS, and top and bottom elevations
     */
    widthHeightCenterFromLocation(x,y,z,units){
        let xyU = canvas.grid.grid.getGridPositionFromPixels(x, y);
        let px = canvas.grid.grid.getPixelsFromGridPosition(xyU[0] + units.w, xyU[1]);
        let py = canvas.grid.grid.getPixelsFromGridPosition(xyU[0], xyU[1] + units.h);
        //dangerZone.log(false, 'Width Height Center Initial Boundary ', {xyAsUnits:xyU, unitsIn: units, py: py, px: px});

        const w = Math.max(px[0], py[0]) - x;
        const h = Math.max(px[1], py[1]) - y;
        const cnt = canvas.grid.getCenter(x + (w/2), y + (h/2))
        const c = {x: cnt[0], y: cnt[1]}
        return {w: w, h: h, d: units.d, c: c, bottom: z, top: z + units.d}
    }

    static getUnitDimensions(boundary){
        let s = canvas.grid.grid.getGridPositionFromPixels(boundary.start.x, boundary.start.y);
        let se = canvas.grid.grid.getGridPositionFromPixels(boundary.start.x, boundary.end.y);
        let es = canvas.grid.grid.getGridPositionFromPixels(boundary.end.x, boundary.start.y);
        let w = se[0] - s[0];
        let h = es[1] - s[1];
        let d = boundary.end.z - boundary.start.z
        s.push(boundary.start.z)

        //dangerZone.log(false, 'Unit dimensions', {s: s, se: se, es:es, w:w, h:h, d:d});
        return {w: w, h: h, d:d, start: s}
    }

    getUnitDimensions(){
        return dangerZoneDimensions.getUnitDimensions({start: this.start, end: this.end});
    }

    static addHighlightZone(zoneId, sceneId, nameModifier = ''){
        let hId = 'dz-'+ zoneId + nameModifier;
        canvas.grid.addHighlightLayer(hId);
        const zn = dangerZone.getZoneFromScene(zoneId, sceneId).scene;
        const g = zn.getUnitDimensions();
        for(let j=0; j < g.h; j++){
            for(let i=0; i < g.w; i++){
                let pos = canvas.grid.grid.getPixelsFromGridPosition((g.start[0]+i), (g.start[1]+j));
                canvas.grid.highlightPosition(hId, {x: pos[0], y: pos[1], color:16737280});
            }
        }
    }

    static destroyHighlightZone(zoneId, nameModifier = ''){
        canvas.grid.destroyHighlightLayer('dz-'+zoneId + nameModifier)
    }
}