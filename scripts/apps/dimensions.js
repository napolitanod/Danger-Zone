import {dangerZone} from '../danger-zone.js';
import {circleAreaGrid, getTagEntities, rayIntersectsGrid} from './helpers.js';
import { wallHeightOn } from '../index.js';

export class dangerZoneDimensions {
    /**
     * @param {string} zoneId - id of the parent zone
     * @param {string} sceneId - the id of the scene  
    */
    constructor (sceneId, zoneId, regionId = '') {
        this.zoneId = zoneId,
        this.sceneId = sceneId,
        this.regionId = regionId;
    }
  ;

    /**Migration */
    get _migrationData(){
        return {
            regionData: {
                elevation: {bottom: this.start?.z, top: this.end?.z},
                name: `Danger Zone Region: ${this.zone.title}`,
                shapes: [{
                    type: 'rectangle',
                    height: this.end?.y - this.start?.y,
                    rotation: 0,
                    width: this.end?.x - this.start?.x,
                    x: this.start?.x,
                    y: this.start?.y
                }]
            }
        }
    }

    _migrateRegionMatch(regionArray){
        return regionArray.find(rg => 
            rg.elevation.bottom === this._migrationData.regionData.elevation.bottom
            && rg.elevation.top === this._migrationData.regionData.elevation.top
            && rg.shapes[0].x === this._migrationData.regionData.shapes[0].x
            && rg.shapes[0].y === this._migrationData.regionData.shapes[0].y
            && rg.shapes[0].height === this._migrationData.regionData.shapes[0].height
            && rg.shapes[0].width === this._migrationData.regionData.shapes[0].width
        )
    }

    async convertToRegion(regionId){
        if(!this.scene || !this.start) return

        if(regionId || this.hasFullSceneDimensions) {
            await this.zone.update({scene: {
                start: null,
                end: null,
                regionId: regionId ?? ''
            }}, {insertKeys: true, enforceTypes: false})
        }
        if (game.user.isGM && regionId ) ui.notifications?.info(`The dimensions for zone ${this.zone.title} on scene ${this.scene.name} have been converted to a region.`)
        dangerZone.log(false, regionId ? 'Converted scene to Zone' : 'Converted to scene-wide zone', {zoneScene: this, region: regionId})
    }

    /**Migration end */

    get boundary(){
        return this.region?.id ? boundary.documentBoundary("Region", this.region) : boundary.documentBoundary("Scene", this.scene)
    }

    get region(){
        return this.regionId ? this.scene.getEmbeddedDocument("Region",this.regionId) : {}
    }

    get scene(){
        return game.scenes.get(this.sceneId);
    }

    get danger(){
        return this.zone.danger;
    }

    get dangerRelativeDimensions(){
        return {w:this.danger.dimensions.units.w ?? this.boundary.dimensions.w, h: this.danger.dimensions.units.h ?? this.boundary.dimensions.h, d:this.danger.dimensions.units.d ?? this.boundary.depth}
    }

    get hasFullSceneDimensions(){
        return (
            (!this.start && !this.regionId)
            || (
                this.start 
                && this.start.x === this.scene.dimensions.sceneX
                && this.start.y === this.scene.dimensions.sceneY
                && this.start.z === 0
                && this.end.x === this.scene.dimensions.sceneX + this.scene.dimensions.sceneWidth
                && this.end.y === this.scene.dimensions.sceneY + this.scene.dimensions.sceneHeight
                && this.end.z === 0
            )
         ) ? true : false
    }

    get zone(){
        return this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(this.zoneId, this.sceneId);
    }

    async _excludedTagged(){
        return getTagEntities(game.settings.get(dangerZone.ID, 'zone-exclusion-tag'), this.scene)
    }

    async boundaryBleed(options = {}){
        const b = await this.getZoneBoundary();
        const topLeft = canvas.grid.getTopLeftPoint({j:b.dimensions.j -(Math.min(b.dimensions.j, (this.danger.dimensions.units.w -1))), i:b.dimensions.i - (Math.min(b.dimensions.i, (this.danger.dimensions.units.h-1)))});
        const p = new point(topLeft, b.bottom - this.danger.dimensions.units.d )
        return new boundary(p.coords, b.B, {bottom: p.elevation, top: b.top}, Object.assign(options, {excludes: b.excludes, universe: b.universe, regionUuid: this.region.uuid, inclusive: false}))
    }

    async boundaryConstrained(options = {}){
        const b = await this.getZoneBoundary();
        const dim = {d:b.depth - this.dangerRelativeDimensions.d, h: b.dimensions.h - this.dangerRelativeDimensions.h, w: b.dimensions.w - this.dangerRelativeDimensions.w}
        return boundary.locationToBoundary(b.A, b.elevation, dim, Object.assign(options, {excludes: b.excludes, universe: b.universe, regionUuid: this.region.uuid}))
    }

    async getZoneBoundary(){
        const ex = await this._excludedTagged();
        const un = await this.zone.sourceArea();
        return new boundary(this.boundary.A, this.boundary.B, this.boundary.elevation, {exclude: ex, limit: un, regionUuid: this.region.uuid})
    }

    async grids(){
        const b = await this.getZoneBoundary();
        return b.grids()
    }

    async randomDangerBoundary() {
        const options = {range: this.dangerRelativeDimensions}
        const b = this.zone.options.bleed ? await this.boundaryBleed(options) : await this.boundaryConstrained(options);
        this.zone.stretch(options);
        const grids = b.randomBoundary();
        dangerZone.log(false,'Random Area Variables ', {"zoneScene": this, boundary: b, grids: grids, zone: this.zone, options: options})
        return grids
    }

    static tokenMovement(token, update){
        const endPos = {
            coords: {
                x: update.x ? update.x : token.x,
                y: update.y ? update.y : token.y
            },
            elevation: update.elevation ? update.elevation : token.elevation 
        };
        const startPos = {
            coords: {
                x: token.x,
                y: token.y
            },
            elevation: token.elevation
        };
		const startGrid = canvas.grid.getOffset(token);
		const endGrid = canvas.grid.getOffset(endPos.coords);
		return {
            start:startPos,
            end: endPos,
            dimensions: {
                h:  Math.abs(startGrid.i - endGrid.i),
                w: Math.abs(startGrid.j - endGrid.j),
                d: Math.abs(startPos.elevation - endPos.elevation)
            },
			height: Math.abs(startPos.coords.y - endPos.coords.y ),
			width: Math.abs(startPos.coords.x - endPos.coords.x)
		}
    }

    static async addHighlightZone(zoneId, sceneId, nameModifier = '', dangerId = ''){
        const zn = dangerId ? dangerZone.getGlobalZone(dangerId, sceneId)?.scene : dangerZone.getZoneFromScene(zoneId, sceneId)?.scene;
        if(zn) await zn.addHighlightZone(nameModifier)
    }

    async addHighlightZone(nameModifier = ''){
        const boundary = await this.getZoneBoundary()
        this.dangerId ? boundary.highlight(this.dangerId + nameModifier, 10737280) : boundary.highlight(this.zoneId + nameModifier, 16737280)
    }

    static destroyHighlightZone(zoneId, nameModifier = '', dangerId = ''){
        const name = 'dz-' + (dangerId ? dangerId : zoneId) + nameModifier;
        if(canvas.interface.grid.highlightLayers[name]) canvas.interface.grid.destroyHighlightLayer(name)
    }

    destroyHighlightZone(nameModifier = ''){
        const name = 'dz-'+ (this.dangerId ? this.dangerId : this.zoneId) + nameModifier;
        if(canvas.interface.grid.highlightLayers[name]) canvas.interface.grid.destroyHighlightLayer(name)
    }
}


    /*
        options:{ 
            inclusive: bool //indicates whether the bottom and right edges are included in the boundary
        }
    */
export class boundary{
    constructor (a = {x:0, y:0}, b = {x:0, y:0}, elevation = {bottom: null, top: null}, options = {}) {
        this.A = {
            x: a.x ? Math.min(a.x, a.x ? b.x : b.x) : 0,
            y: a.y ? Math.min(a.y, a.y ? b.y : b.y) : 0
        },
        this.B = {
            x: b.x ? Math.max(a.x ? a.x : b.x, b.x) : 0,
            y: b.y ? Math.max(a.y ? a.y : b.y, b.y) : 0
        },
        this.elevation = elevation,
        this.excludes = new Set(),
        this.gridIndex = new Set(),
        this.options = options,
        this.universe = options.universe ?? (options.limit?.target ? new Set() : '');
        this._init()
    }
    
    get region(){
        return this.regionUuid ? fromUuidSync(this.regionUuid) : {}
    }
    
    get bottom(){
        return this.options.bottom ?? this.elevation.bottom
    }

    get center(){
        return {x: this.A.x + (this.width/2), y: this.A.y + (this.height/2)}
    }

    get depth(){
        return this.depthIsInfinite ? null : Math.abs(this.top - this.bottom)
    }

    get depthIsInfinite(){
        return this.bottom === null || this.top === null
    }

    get dimensions(){
        const top = canvas.grid.getOffset(this.A);
        const left = canvas.grid.getOffset({x:this.A.x, y:this.B.y});
        const right = canvas.grid.getOffset({x:this.B.x, y:this.A.y});
        const bottom = canvas.grid.getOffset(this.B);
        const w = Math.max(right.j,bottom.j) - Math.min(top.j,left.j);
        const h = Math.max(left.i,bottom.i) - Math.min(top.i,right.i);

        return {w: w, h: h, j:top.j, i:top.i}
    }

    get exclude(){
        return this.options.exclude
    }

    get height(){
        return Math.abs(this.B.y - this.A.y)
    }

    get inclusive(){
        return (this.options.inclusive || (!('inclusive' in this.options) && this.region?.id)) ? true : false
    }

    get limit(){
        return this.options.limit ?? {}
    }

    get offset(){
        return this.options.offset
    }

    get range(){
        return this.options.range ?? {w: 1, h:1, d:0}
    }

    get regionUuid(){
        return this.options.regionUuid ?? ''
    }

    get top(){
        return this.options.top ?? this.elevation.top
    }

    get width(){
        return Math.abs(this.B.x - this.A.x)
    }
    
    _exclude(){
        this._indexDocuments(this.exclude, this.excludes)
    }

    _universe(){
        this._indexDocuments(this.limit.documents, this.universe)
        if(this.limit.target === 'I') return
        const newUniv = new Set() 
        this.universe.forEach((value) => {
            const[i, j] = value.split('_')
            const nghbrs = canvas.grid.getAdjacentOffsets({i:Number(i), j:Number(j)})
            for(const pos of nghbrs){
                let index = boundary.makeIndex(pos)
                if(this.limit.target === 'A') {
                    if (!this.universe.has(index)) newUniv.add(index)
                } else {
                    newUniv.add(index)
                }
            }
        })
        this.universe = newUniv
    }

    _indexDocuments(documents, indices){
        for(const document of documents){
            const documentName = document.documentName ?? document.document.documentName;
            const b = boundary.documentBoundary(documentName, document, {inclusive: documentName === "Token" ? false : true});
            const grids = b.grids()  
            for(const grid of grids){
                let index = boundary.makeIndex(grid);
                if(indices.has(index)) continue
                switch(documentName){
                    case "Wall":
                        if(!rayIntersectsGrid(grid, document.object.toRay())) continue
                        break
                    case "AmbientLight":
                        if(!circleAreaGrid(grid.shift.w, grid.shift.h, b.dimensions)) continue
                        break
                    default:
                }
                indices.add(index)
            }
        }
        dangerZone.log(false, 'Tagged ', {tagged: documents, boundary: this, indices: indices});
    }

    _init(){
        if(!('retain' in this.options)) this._toTopLeft();
        if(this.exclude) this._exclude();
        if(this.limit.target) this._universe();
        this._setGridIndex();
    }

    _setGridIndex(){
        const grids = this.grids();
        for(const grid of grids){
            this.gridIndex.add(boundary.makeIndex(grid))
        }
    }

    _testGridToRegion(dim = {}){
        let inRegion = false, i = 0;
        let vertices = []//canvas.grid.getVertices(dim)
        if(this.range.h > 1) vertices = vertices.concat(canvas.grid.getCenterPoint(canvas.grid.getTopLeftPoint({i: dim.i + (this.range.h-1), j: dim.j})))//vertices = vertices.concat(canvas.grid.getVertices({i: dim.i + (this.range.h-1), j: dim.j}))
        if(this.range.w > 1) vertices = vertices.concat(canvas.grid.getCenterPoint(canvas.grid.getTopLeftPoint({i: dim.i, j: dim.j + (this.range.w - 1)})))//vertices = vertices.concat(canvas.grid.getVertices({i: dim.i, j: dim.j + (this.range.w - 1)}))
        if(this.range.h > 1 && this.range.w  > 1) vertices = vertices.concat(canvas.grid.getCenterPoint(canvas.grid.getTopLeftPoint({i: dim.i + (this.range.h-1), j: dim.j + (this.range.w - 1)}))) //vertices = vertices.concat(canvas.grid.getVertices({i: dim.i + (this.range.h-1), j: dim.j + (this.range.w - 1)}))
        vertices.push(canvas.grid.getCenterPoint(dim))
        //dangerZone.log(true, "Testing Grid to Region", {dimensions: this, coord: dim, vertices: vertices})
        do {
            inRegion = this.region.object.testPoint(vertices[i])
            i++
        } while (!inRegion && i < vertices.length)
        return inRegion
    }

    _toTopLeft(){    
        this.A = canvas.grid.getTopLeftPoint(this.A);
        this.B = canvas.grid.getTopLeftPoint(this.B);
    }

    * grids(){
        const dim = this.dimensions; 
        for(let m=0; (this.inclusive ? m<=dim.w : m<dim.w) || m===0; m++){
            for(let n=0; (this.inclusive ? n<=dim.h: n<dim.h) || n===0; n++){
                let coord = {i: dim.i+n, j: dim.j+m}; let coordIndex = boundary.makeIndex(coord);
                if(this.excludes.has(coordIndex)) continue;
                if((this.universe && !this.universe.has(coordIndex))) continue;
                if(!this.region?.object || this._testGridToRegion(coord)){
                    yield {i:coord.i, j:coord.j, e: this.bottom, index: coordIndex, shift: {w:n, h:m}}
                }
            }
        }
    } 

    * randomBoundary (){
        const grids = this.grids(), all = [], ops = {excludes: this.excludes, universe: this.universe};
        for(const grid of grids){all.push(grid)}
        if('inclusive' in this.options){ops.inclusive = this.options.inclusive}
        if('regionUuid' in this.options){ops.regionUuid = this.options.regionUuid}
        if('bottom' in this.options){ops.bottom = this.options.bottom}
        if('top' in this.options){ops.top = this.options.top}
        if('range' in this.options) ops.range = this.range
        if(all.length < 1 || this.depth < 0){
            if(this.depth < 0 && game.user.isGM){
                ui.notifications?.error(game.i18n.localize("DANGERZONE.alerts.danger-depth-exceeds-zone"));
            }
            return dangerZone.log(false,'Invalid zone settings ', {boundary: this})
        }
        const zAdj = this.depth ? (this.range.d ?? this.depth-1) : 0 
        while(true){
            const test = all[Math.floor(Math.random() * all.length)]
            const topLeft = canvas.grid.getTopLeftPoint(test); 
            const bottomRight = point.shiftPoint(topLeft, this.range);
            const e = test.e + Math.floor(Math.random() * this.depth);
            yield new boundary(topLeft, bottomRight, {bottom: e, top: e + zAdj}, ops)
        }

    }

    static documentBoundary(documentName, document, options = {}){
        //dangerZone.log(false,'Determine document boundary ', {documentName: documentName, document: document, options: options})
        let dim;
        switch(documentName){
            case "Wall":
                const wallHeight = (wallHeightOn && document.flags?.['wall-height']) ? document.flags?.['wall-height'] : {bottom: 0, top: 0}
                dim={x: document.object.bounds.x, y:document.object.bounds.y, width: document.object.bounds.width, height: document.object.bounds.height, bottom: wallHeight.bottom, top: wallHeight.top}
                break
            case "AmbientLight":
                const radius = document.object.radius
                const dm = (radius*2)-1
                dim={x:document.object.bounds.x, y:document.object.bounds.y, width: dm, height: dm, bottom: document.elevation - radius , top: document.elevation + radius} 
                break
            case "Drawing":
                dim={x: document.x, y:document.y, width: document.shape.width, height: document.shape.height, bottom: document.elevation, top: document.elevation}
                break;
            case "Region":
                dim={x: document.object.bounds.x, y:document.object.bounds.y, width: document.object.bounds.width, height: document.object.bounds.height, bottom: document.elevation.bottom, top: document.elevation.top}
                break;
            case "Scene":
                dim={x: document.dimensions.sceneX, y:document.dimensions.sceneY, width: document.dimensions.sceneWidth, height: document.dimensions.sceneHeight, bottom: 0, top: 0}
                break;
            case "Tile":
                dim={x: document.x, y:document.y, width: document.width - 1, height: document.height - 1, bottom: document.elevation, top: document.elevation}
                break;
            case "Token":
                const multiplier = game.settings.get(dangerZone.ID, 'token-depth-multiplier');
                const position = canvas.grid.getOffset(document);
                const topLeft = canvas.grid.getTopLeftPoint({j:position.j + document.width, i:position.i + document.height}); 
                const distance = document.parent?.dimensions?.distance ? document.parent?.dimensions?.distance : 1
                const Td = (wallHeightOn && document.getFlag('wall-height', 'tokenHeight')) ? document.getFlag('wall-height', 'tokenHeight') : (distance * Math.max(document.width, document.height) * multiplier);
                dim = {x:document.x, y:document.y, width: topLeft.x - document.x, height: topLeft.y - document.y, bottom:document.elevation, top: document.elevation + Td};
                break
            default: 
                dim=document
        }
        const b = new boundary({x:dim.x, y:dim.y}, {x: dim.x + dim.width, y: dim.y + dim.height}, {bottom:dim.bottom, top: dim.top}, options)
        return b
    }

    static locationToBoundary(coords, elevation, units, options={}){
        let position = point.shiftPoint(coords, units)
        dangerZone.log(false,'Location to boundary...', {point: coords, units: units, options: options});
        return new boundary(coords, position, {bottom: elevation.bottom, top: elevation.bottom + units.d}, options)
    }

    static makeIndex(coords) {
        return coords.i + '_' + coords.j
    }

    static offsetAxis(offsetAxis, flip, scene, random){
        function randomRange(min, max, random){
            if(min === max) return min
            return (Math.floor(random * (max - min + 1)) + min)
        }
        switch(offsetAxis.type){
            case "pxl":
                return (randomRange(offsetAxis.min, offsetAxis.max, random) * flip)
            case "pct":
                return (Math.floor((randomRange(offsetAxis.min, offsetAxis.max, random)/100) * scene.dimensions.size) * flip)
            default:
                return 0
        }
    }

    static offsetBoundary(bndry, globalOffset, offset, scene = canvas.scene){
        function flip(flip, flipLocation){
            if (typeof flip == "boolean") {
                return ((flip && flipLocation) ? -1 : 1)
            }
            return ((['N', 'L', 'B'].includes(flip) && flipLocation) ? -1 : 1 )
        }
        const obj = {A: {x: 0, y: 0}, B: {x: 0, y: 0}, elevation: bndry.elevation,options: {offset: {x: {flip: 0, amt: 0}, y: {flip: 0, amt: 0}}, retain: true}};
        obj.options.offset.x.flip = flip(offset.x.flip, globalOffset.x.flipLocation)
        obj.options.offset.y.flip = flip(offset.y.flip, globalOffset.y.flipLocation)
        obj.options.offset.x.amt = boundary.offsetAxis(offset.x, obj.options.offset.x.flip, scene, globalOffset.x.random)
        obj.options.offset.y.amt = boundary.offsetAxis(offset.y, obj.options.offset.y.flip, scene, globalOffset.y.random)
        Object.assign(obj.A, {x: bndry.A.x + obj.options.offset.x.amt, y:bndry.A.y + obj.options.offset.y.amt})
        Object.assign(obj.B, {x: bndry.B.x + obj.options.offset.x.amt, y:bndry.B.y + obj.options.offset.y.amt})
        return new boundary(obj.A, obj.B, obj.elevation, obj.options)
    }

    tokensIn(tokens){
        let kept = [];
        for(let token of tokens){
            const b = boundary.documentBoundary('Token', token);
            if(this.intersectsBoundary(b)){
                kept.push(token)
            }
        }
        return kept
    } 

    intersectsBoundary(bound = boundary){
        if((this.bottom === null || this.bottom < bound.top) && (this.top === null || this.top >= bound.bottom)) {
            const grids = bound.grids()
            for(const grid of grids){
                if(this.gridIndex.has(grid.index)) return true
            }
        }
        return false
    }

    highlight(name, color = 16737280){
        let hId = 'dz-' + name;
        canvas.interface.grid.addHighlightLayer(hId);
        const grids = this.grids();
        for(const grid of grids){ 
            let position = canvas.grid.getTopLeftPoint(grid); 
            canvas.interface.grid.highlightPosition(hId, {x: position.x, y: position.y, color:color});
        }
    }

    destroyHighlight(name){
        canvas.interface.grid.destroyHighlightLayer('dz-' + name)
    }
}

export class point{
    constructor(coords = {x: 0, y: 0}, elevation = null){
        this.coords = coords,
        this.elevation = elevation;
        this._toTopLeft();
    }
    
    _toTopLeft(){    
        this.coords = canvas.grid.getTopLeftPoint(this.coords);
    }

    static shiftPoint(reference = {}, shift = {}){
        for(let i=0;i<Math.abs(shift.w);i++){reference = canvas.grid.getShiftedPoint(reference, shift.w > 0 ? CONST.MOVEMENT_DIRECTIONS.RIGHT : CONST.MOVEMENT_DIRECTIONS.LEFT)}
        for(let i=0;i<Math.abs(shift.h);i++){reference = canvas.grid.getShiftedPoint(reference, shift.h > 0 ? CONST.MOVEMENT_DIRECTIONS.DOWN : CONST.MOVEMENT_DIRECTIONS.UP)}
        return reference
    }
}