import {dangerZone} from '../danger-zone.js';
import {circleAreaGrid, getTagEntities, rayIntersectsGrid} from './helpers.js';

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
        };
        this._init();
    }
  
    /**
     * refreshes class data with scene data
     */
     _init() {
        const dim = this.scene.dimensions;
        this.start.x = dim.paddingX,
        this.start.y = dim.paddingY,
        this.end.x = dim.sceneWidth + dim.paddingX,
        this.end.y = dim.sceneHeight + dim.paddingY;
    }

    get scene(){
        return game.scenes.get(this.sceneId);
    }

    get danger(){
        return this.zone.danger;
    }

    get zone(){
        return this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(this.zoneId, this.sceneId);
    }

    _subDimensions(w,h){
		const [startY, startX] = canvas.grid.grid.getGridPositionFromPixels(this.start.x, this.start.y);
		const [endY, endX] = canvas.grid.grid.getGridPositionFromPixels(this.end.x, this.end.y);
        return [w ? w : endX-startX, h ? h : endY-startY]
    }

    async boundary(){
        const ex = await this._excludedTagged();
        const un = await this.zone.sourceArea();
        return new boundary(this.start, this.end, {exclude: ex, limit: un})
    }

    async boundaryBleed(){
        const {w,h,d} = this.danger.dimensions.units; 
        const b = await this.boundary();
        const dim = b.dimensions;
        const [x,y] = canvas.grid.grid.getPixelsFromGridPosition(dim.y -(Math.min(dim.y, (h-1))), dim.x - (Math.min(dim.x, (w-1))));
        const p = new point({x: x, y: y, z: dim.z - (d ? d-1 : 0)})
        return new boundary(p, b.B, {excludes: b.excludes, universe: b.universe})
    }

    async boundaryConstrained(){
        let {w,h,d} = this.danger.dimensions.units;
        [w, h] = this._subDimensions(w,h);
        const b = await this.boundary();
        const dim = b.dimensions;
        return boundary.locationToBoundary(b.A, {d: Math.abs(dim.d - (d ? d : dim.d ? dim.d : 0)), h: Math.abs(dim.h - (h-1)), w: Math.abs(dim.w - (w-1))}, {excludes: b.excludes, universe: b.universe})
    }

    async grids(){
        const b = await this.boundary();
        return b.grids()
    }

    async randomDangerBoundary() {
        let {w,h,d} = this.danger.dimensions.units;
        [w, h] = this._subDimensions(w,h);
        const b = this.zone.options.bleed ? await this.boundaryBleed() : await this.boundaryConstrained();
        const options = {range:{w: w, h: h, d: d}}
        this.zone.stretch(options);
        const grids = b.randomBoundary(options);
        dangerZone.log(false,'Random Area Variables ', {"zoneScene": this, boundary: b, dangerUnits: [w,h,d], zone: this.zone, options: options})
        return grids
    }

    static tokenMovement(token, update){
        const endXPixel = update.x ? update.x : token.data.x;
		const endYPixel = update.y ? update.y : token.data.y;
		const [startY, startX] = canvas.grid.grid.getGridPositionFromPixels(token.data.x, token.data.y);
		const [endY, endX] = canvas.grid.grid.getGridPositionFromPixels(endXPixel, endYPixel);
		const endDepth = update.elevation ? update.elevation : token.data.elevation;
		return {
			startPos: {x: token.data.x, y: token.data.y, z: token.data.elevation},
			endPos: {x: endXPixel, y: endYPixel, z: endDepth},
			moveYGrids: Math.abs(startY - endY),
			moveXGrids: Math.abs(startX - endX),
			moveYPixels: Math.abs(token.data.y - endYPixel),
			moveXPixels: Math.abs(token.data.x - endXPixel),
			moveDepth: Math.abs(token.data.elevation - endDepth)
		}
    }

    static async addHighlightZone(zoneId, sceneId, nameModifier = '', dangerId = ''){
        const zn = dangerId ? dangerZone.getGlobalZone(dangerId, sceneId)?.scene : dangerZone.getZoneFromScene(zoneId, sceneId)?.scene;
        if(zn) await zn.addHighlightZone(nameModifier)
    }

    async addHighlightZone(nameModifier = ''){
        const boundary = await this.boundary()
        this.dangerId ? boundary.highlight(this.dangerId + nameModifier, 10737280) : boundary.highlight(this.zoneId + nameModifier, 16737280)
    }

    static destroyHighlightZone(zoneId, nameModifier = '', dangerId = ''){
        const name = 'dz-' + (dangerId ? dangerId : zoneId) + nameModifier;
        if(canvas.grid.highlightLayers[name]) canvas.grid.destroyHighlightLayer(name)
    }

    destroyHighlightZone(nameModifier = ''){
        const name = 'dz-'+ (this.dangerId ? this.dangerId : this.zoneId) + nameModifier;
        if(canvas.grid.highlightLayers[name]) canvas.grid.destroyHighlightLayer(name)
    }

    async _excludedTagged(){
        return getTagEntities(game.settings.get(dangerZone.ID, 'zone-exclusion-tag'), this.scene)
    }
}

export class boundary{
    constructor (a = {x:0, y:0, z:0}, b = {x:0, y:0, z:0}, options = {}) {
        this.A = {
            x: a.x ? Math.min(a.x, a.x ? b.x : b.x) : 0,
            y: a.y ? Math.min(a.y, a.y ? b.y : b.y) : 0,
            z: a.z ? Math.min(a.z, a.z ? b.z : b.z) : 0
        },
        this.B = {
            x: b.x ? Math.max(a.x ? a.x : b.x, b.x) : 0,
            y: b.y ? Math.max(a.y ? a.y : b.y, b.y) : 0,
            z: b.z ? Math.max(a.z ? a.z : b.z, b.z) : 0
        },
        this.excludes = options.excludes ? options.excludes : new Set(),
        this.universe = options.universe ? options.universe : (options.limit?.target ? new Set() : ''),
        this.gridIndex = new Set();
        if('bottom' in options){this.A.z = options.bottom}
        if('top' in options){this.B.z = options.top}
        if(!('retain' in options)) this._toTopLeft();
        if(options.exclude){this._exclude(options.exclude)}
        if(options.limit?.target){this._universe(options.limit)}
        this._setGridIndex();
    }

    get width(){
        return Math.abs(this.B.x - this.A.x)
    }

    get height(){
        return Math.abs(this.B.y - this.A.y)
    }

    get depth(){
        return Math.abs(this.B.z - this.A.z)
    }

    get bottom(){
        return this.A.z
    }

    get top(){
        return this.B.z
    }

    get center(){
        return {x: this.A.x + (this.width/2), y: this.A.y + (this.height/2)}
    }

    get dimensions(){
        const [topY, topX] = canvas.grid.grid.getGridPositionFromPixels(this.A.x, this.A.y);
        const [leftY, leftX] = canvas.grid.grid.getGridPositionFromPixels(this.A.x, this.B.y);
        const [rightY, rightX] = canvas.grid.grid.getGridPositionFromPixels(this.B.x, this.A.y);
        const [bottomY, bottomX] = canvas.grid.grid.getGridPositionFromPixels(this.B.x, this.B.y);
        const w = Math.max(rightX,bottomX) - Math.min(topX,leftX);
        const h = Math.max(leftY,bottomY) - Math.min(topY,rightY);
        const d = this.B.z - this.A.z;
        return {w: w, h: h, d:d, x:topX, y:topY, z:this.A.z}
    }

    _setGridIndex(){
        const grids = this.grids();
        for(const [yPos, xPos] of grids){
            this.gridIndex.add(yPos + '_' + xPos)
        }
    }

    _toTopLeft(){    
        const [x1, y1] = canvas.grid.getTopLeft(this.A.x, this.A.y);
        const [x2, y2] = canvas.grid.getTopLeft(this.B.x, this.B.y);
        this.A.x = x1;
        this.A.y = y1;
        this.B.x = x2;
        this.B.y = y2;
    }

    * grids(options={}){
        const {w,h,d,x,y,z} = this.dimensions;
        for(let j=0; (options.inclusive ? j<=w : j<w) || j===0; j++){
            for(let i=0; (options.inclusive ? i<=h: i<h) || i===0; i++){
                if((!this.universe || this.universe.has((y+i) + '_' + (x+j))) && !this.excludes.has((y+i) + '_' + (x+j))){yield[y+i, x+j, z, [i, j]]}
            }
        }
    } 

    * randomBoundary (options={}){
        const grids = this.grids(options);
        const all = []
        for(const [y,x,z] of grids){all.push([y,x, z])}
        const dim = this.dimensions;
        const w = options.range?.w ? options.range?.w : 0
        const h = options.range?.h ? options.range?.h : 0
        const d = options.range?.d ? options.range?.d : 0

        const ops = {excludes: this.excludes, universe: this.universe}
        if('bottom' in options){ops.bottom = options.bottom}
        if('top' in options){ops.top = options.top}

        if(all.length < 1 || dim.d < 0){
            if(dim.d<0 && game.user.isGM){
                ui.notifications?.error(game.i18n.localize("DANGERZONE.alerts.danger-depth-exceeds-zone"));
            }
            return dangerZone.log(false,'Invalid zone settings ', {boundary: this})
        }
        const zAdj = dim.d ? d ? d : dim.d-1 : 0 

        while(true){
            const [posY, posX, posZ] = all[Math.floor(Math.random() * all.length)]
            const [x1,y1] = canvas.grid.grid.getPixelsFromGridPosition(posY, posX);
            const [x2,y2] = canvas.grid.grid.shiftPosition(x1, y1, w, h)
            const z1 = posZ + Math.floor(Math.random() * dim.d);
            yield new boundary({x:x1, y:y1, z:z1}, {x:x2, y:y2, z:z1 + zAdj}, ops)
        }

    }

    static documentBoundary(documentName, document, options = {}){
        let dim;
        switch(documentName){
            case "Wall":
                dim=document.object.bounds;
                break
            case "AmbientLight":
                const dm = (document.object.radius*2)-1
                dim={x:document.object.bounds.x, y:document.object.bounds.y, width: dm, height: dm} 
                break
            case "Tile":
                dim={x: document.data.x, y:document.data.y, width: document.data.width - 1, height: document.data.height - 1}
                break;
            case "Token":
                const multiplier = game.settings.get(dangerZone.ID, 'token-depth-multiplier');
                const [TyPos, TxPos] = canvas.grid.grid.getGridPositionFromPixels(document.data.x, document.data.y);
                const [Tx2, Ty2] = canvas.grid.grid.getPixelsFromGridPosition(TyPos + document.data.height, TxPos + document.data.width); 
                const distance = document.parent?.dimensions?.distance ? document.parent?.dimensions?.distance : 1
                const Td = (distance * Math.max(document.data.width, document.data.height) * multiplier);
                dim = {x:document.data.x, y:document.data.y, width: Tx2 - document.data.x, height: Ty2 - document.data.y, depth: Td,  bottom:document.data.elevation};
                break
            default: 
                dim=document.data
        }
        const b = new boundary({x:dim.x, y:dim.y, z:dim.bottom ? dim.bottom : 0}, {x: dim.x + dim.width, y: dim.y + dim.height, z: dim.depth ? dim.bottom + dim.depth : 0}, options)
        return b
    }
    
    _exclude(documents){
        this._indexDocuments(documents, this.excludes)
    }

    _indexDocuments(documents, indices){
        for(const document of documents){
            const documentName = document.documentName ? document.documentName : document.document.documentName;
            const b = boundary.documentBoundary(documentName, document);
            const dim=b.dimensions
            const inclusive = documentName === "Token" ? false : true
            const grids = b.grids({inclusive:inclusive})  
            switch(documentName){
                case "Wall":
                    for(const [yPos,xPos] of grids){
                        if(indices.has(yPos + '_' + xPos)){continue}
                        if(rayIntersectsGrid([yPos,xPos], document.object.toRay())){indices.add(yPos + '_' + xPos)}
                    }
                    break
                case "AmbientLight":
                    for(const [yPos,xPos, zPos, [xLoc, yLoc]] of grids){
                        if(indices.has(yPos + '_' + xPos)){continue}
                        if(circleAreaGrid(xLoc,yLoc,dim.w, dim.h)){indices.add(yPos + '_' + xPos)}
                    }
                    break
                default: 
                    for(const [yPos,xPos] of grids){
                        if(indices.has(yPos + '_' + xPos)){continue}
                        indices.add(yPos + '_' + xPos)
                    }
            }
        }
        dangerZone.log(false, 'Tagged ', {tagged: documents, boundary: this});
    }

    _universe(limit){
        this._indexDocuments(limit.documents, this.universe)
        if(limit.target === 'I') return
        const newUniv = new Set() 
        this.universe.forEach((value) => {
            const[yPos, xPos] = value.split('_')
            const nghbrs = canvas.grid.grid.getNeighbors(Number(yPos), Number(xPos))
            for(const pos of nghbrs){
                if(limit.target === 'A') {
                    if (!this.universe.has(pos[0] + '_' + pos[1])) newUniv.add(pos[0] + '_' + pos[1])
                } else {
                    newUniv.add(pos[0] + '_' + pos[1])
                }
            }
        })
        this.universe = newUniv
    }

    static locationToBoundary(point, units, options={}){
        let [x1,y1] = canvas.grid.grid.shiftPosition(point.x, point.y, units.w, units.h)
        dangerZone.log(false,'Location to boundary...', {point: point, units: units, options: options});
        return new boundary(point,{x:x1, y:y1, z:(point.z + units.d)},options)
    }

    tokensIn(tokens){
        const multiplier = game.settings.get(dangerZone.ID, 'scene-control-button-display');
        let kept = [];
        for(let token of tokens){
            const b = boundary.documentBoundary('Token', token);
            if(this.intersectsBoundary(b)){
                kept.push(token)
            }
        }
        return kept
    } 

    intersectsBoundary(boundary){
        if(!this.depth || (this.bottom <= boundary.top) && (this.top > boundary.bottom)) {
            const grids = boundary.grids()
            for(const [yPos,xPos] of grids){
                if(this.gridIndex.has(yPos + '_' + xPos)){return true}
            }
        }
        return false
    }

    highlight(name, color = 16737280){
        let hId = 'dz-' + name;
        canvas.grid.addHighlightLayer(hId);
        const grids = this.grids();
        for(const [yPos,xPos] of grids){
            let [x, y] = canvas.grid.grid.getPixelsFromGridPosition(yPos, xPos);
            canvas.grid.highlightPosition(hId, {x: x, y: y, color:color});
        }
    }

    destroyHighlight(name){
        canvas.grid.destroyHighlightLayer('dz-' + name)
    }
}

export class point{
    constructor({x=0, y=0, z=0}){
        this.x = x ? x : 0, 
        this.y = y ? y : 0,
        this.z = z ? z : 0;
        this._toTopLeft();
    }
    
    _toTopLeft(){    
        const [x1, y1] = canvas.grid.getTopLeft(this.x, this.y);
        this.x = x1;
        this.y = y1;
    }
}