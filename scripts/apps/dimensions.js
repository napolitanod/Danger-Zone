import {dangerZone} from '../danger-zone.js';
import {helper} from './helpers.js';

export class dangerZoneDimensions {
    /**
     * @param {string} zoneId - id of the parent zone
     * @param {string} sceneId - the id of the scene  
     * @param {string} regionId - the id of the region that defines the zone dimensions. Can be blank, which indicates full scene dimensions.
    */
    constructor (sceneId, zoneId, regionId = '') {
        this.zoneId = zoneId;
        this.sceneId = sceneId;
        this.regionId = regionId;
        this.levels = [];
    }

    dangerId

    /**Returns the danger class for the zone
     * 
     */
    get danger(){
        return this.zone.danger;
    }

    /**
     * Create the zone elevation, also patching up infinities to allow for some boundary to the zone targeting
     */
    get elevation(){
        const e = this.hasRegion ? this.region.elevation : this.zone.dimensions
        const elevation = {
            top: helper.fallbackElevationTop(e.top),
            bottom: helper.fallbackElevationBottom(e.bottom)
        }
        return elevation
    }

    /**
     * The presence of a danger id means that this dangerZoneDimensions class was created as part of a pseudo zone to facilitate global danger functionality
     * This is a temporary class and thus the id is also transient
     */
    get hasWorldZone(){
        return !!this.dangerId 
    }

    /**
     * A region is associated to this zone
     */
    get hasRegion(){
        return !!this.region?.id;
    }


    /**
     * returns the region document for the given region id
     */
    get region(){
        if(this.regionId) return this.scene.getEmbeddedDocument("Region",this.regionId)
    }

    /**
     * returns the scene document for the given zone scene id
     */
    get scene(){
        return game.scenes.get(this.sceneId);
    }


    get zone(){
        return this.dangerId ? dangerZone.getGlobalZone(this.dangerId, this.sceneId) : dangerZone.getZoneFromScene(this.zoneId, this.sceneId);
    }

    /**
     * Generates the boundary for this zone
     * @returns boundary class
     */
    get zoneBoundary(){
        const region = this.hasRegion ? this.region : helper.documentToRegion(this.scene, this.scene)
        const options = this.zoneBoundaryOptions
        options.region = region
        
        //return the boundary for the zone, with settings for exclude, universe, and region
        dangerZone.log(false, 'Creating zone boundary on zone dimensions', {zone: this.zone, region: region, options: options})

        return new boundary(this.elevation, this.scene, options) 
    }

    /**
     * returns an object typically submitted into the boundary constructor when pulling the actual zone boundary
     */
    get zoneBoundaryOptions(){
        const source = this.zone?.source;
        const sourceArea = this.zone?.sourceArea;
        return {
            elevation: this.elevation,
            exclude: helper.getTagEntities(game.settings.get(dangerZone.ID, 'zone-exclusion-tag'), this.scene),    //Generate the exclusion list of documents 
            levels: this.zoneLevels,    //include the zone levels   
            universe: sourceArea,   //Generate a universe of documents for the boundary to use that consists of the zone's sources
            regionUuid: this.region?.uuid,  //include the region
            stretch: this.stretch,
            sourceTarget: source?.target || sourceArea?.target || 'I'
        }
    }

    /**Provides data for use in performing the stretch on the top and bottom elevation
     * 
     * @returns {object} elevation //top and bottom if stretched
    */
    get stretch(){

        const stretch = {type: '', elevation: {}}
        
        stretch.type = this.zone?.dimensions?.stretch
        
        if(!stretch.type) return stretch
        
        switch(stretch.type){
            case "B":
                stretch.elevation.bottom = this.elevation.bottom
                break;
            case "G":
                stretch.elevation.bottom = 0
                break;
            case "S":
                stretch.elevation.top = Infinity
                break;
            case "T":
                stretch.elevation.top = this.elevation.top
                break;
            }

        return stretch
    }

    /**
     * Array of zone level ids
     * An empty array = all levels
     */
    get zoneLevels(){
        let levels
        if(this.hasRegion){
            levels = this.region.levels.size ? [...this.region.levels] : []
        } else if(this.levels.length) {
            //filter out level ids on zone that are no longer on the scene (were deleted)
            levels = helper.filterLevels(this.scene, {output: 'ids', filterIds: this.levels}) 
        } else {
            levels = []
        }
        return levels
    }

    /**
     * id of zone level visible to GM. 
     * Is blank if no zone level is visible to GM
     * Assumes that all danger zone processing is on the GM's instance
     */
    get zoneLevelGMVisible(){
        let visible

        //return array of level documents from scene that are considered zone levels
        const arr = helper.filterLevels(this.scene, {output: 'documents', filterIds:this.zoneLevels}) 

        //return the id for the level in view
        if(arr.length){
            visible = arr.find(lvl => lvl.isView)?.id
        }

        return visible
    }


    /****Highlighting methods */

    /**Add a highlight for a zone on the given scene
     * 
     * @param {zone} zone 
     * @param {string} sceneId id of a scene
     * @param {object} options {danger: string id of danger, level: string id of level to use for highlighting, id: string that is used to build the name of the highlight layer}
     */
    static addHighlightZone(zone, sceneId, options = {}){
        const zn = zone.scene ?? (options.danger ? dangerZone.getGlobalZone(options.danger, sceneId)?.scene : dangerZone.getZoneFromScene(zone, sceneId)?.scene)
        if(zn) zn.addHighlightZone(options)
    }


    /**Add a highlight for a zone's level
     * 
     * @param {object} options {level: string id of level to use for highlighting, id: string that is used to build the name of the highlight layer}
     */
    addHighlightZone(options = {}){

        const name = options.id ?? ''
        const level = options.level ?? helper.getDefaultLevel(this.scene.sceneId)

        let namePrefix, color;

        if (this.dangerId) {
            namePrefix = this.dangerId
            color = 10737280
        } else {
            namePrefix = this.zoneId
            color = 16737280
        }

        this.zoneBoundary.highlight({level: level, id: namePrefix + name, color: color})
    }


    /**Deletes a highlight layer for the given zone. 
     * 
     * @param {string} zoneId 
     * @param {string} id name of the highlight layer
     * @param {string} dangerId 
     */
    static destroyHighlightZone(zoneId, id = '', dangerId = ''){
        const name = 'dz-' + (dangerId ? dangerId : zoneId) + id;
        if(canvas.interface.grid.highlightLayers[name]) canvas.interface.grid.destroyHighlightLayer(name)
    }



    /**Deletes a highlight layer for this zone
     * 
     * @param {string} id name of the highlight layer
     */
    destroyHighlightZone(id = ''){
        const name = 'dz-'+ (this.dangerId ? this.dangerId : this.zoneId) + id;
        if(canvas.interface.grid.highlightLayers[name]) canvas.interface.grid.destroyHighlightLayer(name)
    }
}


    /*
        options:{
            name: string //name of region. Default is Boundary Region
            bottom: Integer //override value for bottom
            top: Integer //override value for top
            universe: object { //object for universe definition that is returned from the SourceArea() functionA
                target: string// the source.target (A: Adjacent, I: In, B: Both)
                documents: array //an array of documents that are used to build the universe for establishing boundary dimensions
                }   
            exclude: array //an array of documents that are used to exclude areas from the boundary
            levels: array// passed in for constructor. These are the leves that further define the boundary
            stretch: the stretched dimensions (as override object)

            regionUuid: a Uuid to select back a region that is permanent
            region: the region. used when region is temporary
        }
    */
export class boundary{
    constructor ( elevation = {bottom: -Infinity, top: Infinity, topInclusive: false}, scene, options = {}) {
        this.#options = options;
        this.#scene = scene;
        this.#elevation = elevation;

        if (new.target === boundary) {
            this._init();
        }
    }

    /**Elevation as passed in to the constructor
     * @type object {bottom, top}
     */
    #elevation

    /**shapes that make up the excludes (holes) by level
     * @type Map()
     */
    #excludes 

    /**Regions that make up the boundary by level
     * @type Map()
     */
    #levelsRegions = new Map()

    /**Options passed into the construcoor
     * @type object
     */
    #options

    #region 

    /**Object data used to construct regions when building out the boundary levels regions
     * @type object
     */
    #regionData = {}

    /**Scene the boundary exists on
     * @type scene
     */
    #scene
    
    /**The type of boundary, which is determined by the data used to create it
     * //'dimension', 'region', 'universe'
     * @type string
     */
    #type 

    /**Shapes that make up the universe by level
     * @type Map()
     */
    #universe

    /**Source-target grid pools indexed by level
     * @type Map()
     */
    #targetGridPools = new Map()



    /** GETTERS */

    get A(){
        const {x, y} = this.bounds
        return {x: x, y:y}
    }

    get B(){
        const {x, y, width, height} = this.bounds
        return {x: x + width, y: y + height}
    }

    get bottom(){
        return this.elevation.bottom
    }

    get bottomIsInfinite(){
        return helper.isInfinite(this.bottom)
    }
    
    get bottomToElevation(){
        return this.bottomIsInfinite ? 0 : this.bottom
    }

    get bounds(){
        return this.region.bounds
    }

    get center(){
        return this.bounds.center
    }

    get depth(){
        return this.depthIsInfinite ? null : Math.abs(this.top - this.bottom)
    }

    get depthIsInfinite(){
        return this.topIsInfinite || this.bottomIsInfinite
    }

    get elevation(){
        return this.#elevation
    }

    get excludes(){
        return this.#excludes
    }

    get gridDimensions(){
        const A = this.A;
        const B = this.B;

        const top = canvas.grid.getOffset(A);
        const bottom = canvas.grid.getOffset(B);
        const left = canvas.grid.getOffset({x: A.x, y: B.y});
        const right = canvas.grid.getOffset({x: B.x, y: A.y});

        const w = Math.max(right.j, bottom.j) - Math.min(top.j, left.j);
        const h = Math.max(bottom.i, left.i) - Math.min(top.i, right.i);

        return {w, h}
    }


    get hasExclusions(){
        return !!this.excludes?.size;
    }

    get hasRegion(){
        return !!(this.options.regionUuid); //removed check for this.region. If re-added, see how scenes are converted to documents. Downstream effect is boundary is seen as a region boundary, not scene, and elevation becomes wrong.
    }

    get hasUniverse(){
        return !!this.options.universe?.target;
    }

    get height(){
        return this.bounds.height 
    }

    get infoBoundaryStart(){
        const {x, y} = this.A
        return `x: ${x} y: ${y} bottom: ${this.bottomIsInfinite ? '-&infin;' : this.bottom}`
    }

    get infoBoundaryEnd(){
        const {x, y} = this.B
        return `x: ${x} y: ${y} top: ${this.topIsInfinite ? '&infin;' : this.top}`
    }

    get levelIds(){
        return this.levels.length ? this.levels : helper.filterLevels(this.scene, {output: 'ids'})
    }
    
    get levels(){
        return [...this.region.levels]
    }

    /**
     * Names of the levels associated with this danger's targeting
     */
    get levelsNames(){
        return helper.getLevelsNames(this.scene, this.levels)
    }

    get levelsRegions(){
        return this.#levelsRegions
    }

    get location(){
        return {x:this.bounds.x, y:this.bounds.y, elevation: this.bottom}
    }

    get options(){
        return this.#options
    }

    get regionData(){
        return this.#regionData
    }

    get region(){
        return this.#region
    }

    get scene(){
        return this.#scene
    }

    get stretch(){
        return this.options.stretch ?? {}
    }

    get top(){
        return this.elevation.top
    }

    get topIsInfinite(){
        return helper.isInfinite(this.top)
    }
    
    get topToElevation(){
        return this.topIsInfinite ? 0 : this.top
    }

    get type(){
        return this.#type
    }

    get universe(){
        return this.#universe
    }

    get width(){
        return this.bounds.width
    }

    /**  PRIVATE METHODS */
    /**
     * Initializes additional index and positional data for boundary
     */
    _init(){

        //set the type of boundary
        this._setType()

        //set the data object used for generating boundary regions
        this.#setRegionData()
        
        this.#setBoundaryRegion()

        //index the exclusion grids
        this.#setExcludes();

        //index the universe grids
        this.#setUniverse();

        //set the region
        this.#setLevelsRegions();

        //cache target grids against the final per-level regions
        this.#setTargetGridPools();
    }



    /**Delete on the levelsRegions map the level id 
     * 
     * @param {string} level  level id 
     */
    #deleteLevelRegion(level){
        this.#levelsRegions.delete(level)
    }



    /**
     * Intakes a set of documents and outputs an array of documents that are within this boundary's levels
     * @param {set} documents //set of documents
     * @param {array} levels //array of level ids to filter down to
     * @returns 
     */
    #filterDocumentsByBoundaryLevel(documents, levels = []){
        //all leves are included
        if(!this.levels.length) return documents

        //if levels are passed in, use those, making sure they exist in this boundary
        const filterLevels = levels.length ? levels.filter(l => this.levelIds.includes(l)) : this.levelIds

        //boundary specifies levels
        return documents.filter(doc => filterLevels.some(id => doc.locatedInLevel(id)));
    }



    /**
     * creates a Map of all of the level ids on this boundary. 
     * The ids will each be associated to a region document once set
     */
    #initializeExcludes(){
        this.#excludes = new Map(this.levelIds.map(id => [id, []]));
    }


    /**
     * Set the boundary region - used for calculating overall size. Possibly deprecated in future
     */
    #setBoundaryRegion(){
        this.#region = RegionDocument.implementation.fromSource(this.regionData, {parent: this.scene})
    }


    /**
     * run through the documents in the exclude option and create shapes that will then be part of creating this boundary's region
     * @returns 
     */
    #setExcludes(){
        if(!this.options.exclude?.length) return 

        //initialize excludes
        this.#initializeExcludes();

        //reduce the passed in exclusion documents to only those that are applicable (those locate on a level in the boundary)
        const documents = this.#filterDocumentsByBoundaryLevel(this.options.exclude)
        
        //generate the shapes for all of the documents as holes
        //the insert them into the level applicable for that shape
        for(const document of documents){  
            const {shapes, levels} = helper.documentToRegion(document, null, {hole: true, asObject: true})
            if(shapes.length) {
                for(const [id, array] of this.excludes){
                    if(!levels.size || levels.has(id)) array.push(...shapes)
                } 
            }
        }
    }




    /**Set on the levelsRegions map the region associated to the level id as key
     * 
     * @param {string} level  level id 
     * @param {document} region region document 
     */
    #setLevelRegion(level, region){
        this.#levelsRegions.set(level, region)
    }


    /**Iterate through each level of this boundary and
     * set a region, assigning it to that level
     * Region includes consideration towards exclusion and universe
     */
    #setLevelsRegions(){
        for(const level of this.levelIds){
            //get the generic options
            let source = foundry.utils.deepClone(this.regionData)

            //check for universe. 
            if(this.hasUniverse){
                //if universe exists, get the shapes for this level
                const universeShapes = this.universe.get(level)

                //if there are no universe shapes for this level, delete the level from the map and continue
                if(!universeShapes.length) {
                    this.#deleteLevelRegion(level)
                    continue
                }

                //else replace the source shapes with the universe shapes
                source.shapes = universeShapes
            }

            //add the exclusions
            if(this.hasExclusions){
                const exclusions = this.excludes.get(level)
                if(exclusions?.length) source.shapes = source.shapes.concat(exclusions)
            }

            //create the region
            const region = RegionDocument.implementation.fromSource(source, {parent: this.scene})

            this.#setLevelRegion(level, region)
        } 
    }

    #setRegionData(){
        
        //insert options
        const opts = this.options;

        let regionData = opts.region ? opts.region.toObject() : {}

        //For boundaries not created by a region, shell out (dimensions) or overwrite (universes) some of the regionData
        if(this.type !== 'region') {
            const {bottom, top} = this.#elevation;

            Object.assign(regionData,
                {
                    elevation: {
                        bottom,
                        top,
                        topInclusive: false
                    },
                    levels:[],
                    name: "Universe Boundary"
                }
            )
        }


        if(opts.name) regionData.name = opts.name;
        if(opts.bottom != null) regionData.elevation.bottom = opts.bottom;
        if(opts.top != null) regionData.elevation.top = opts.top;
        if(opts.levels) regionData.levels = opts.levels;

        this._setRegionData(regionData)
    }



    /**Generate the universe as an array of shapes associated to each level the document exists in
     * Include handling for source area settings (adjance, in, in and adjacent)
     */
    #setUniverse(){
        if(this.hasUniverse){

            this.#universe = new Map(this.levelIds.map(id => [id, []]))

            //reduce the passed in universe documents to only those that are applicable (those locate on a level in the boundary)
            const documents = this.#filterDocumentsByBoundaryLevel(this.options.universe.documents)

            
            //generate the shapes for all of the documents as holes
            //the insert them into the level applicable for that shape
                //I = keep as is, A = adjacent, then another is for ajacent or in
            for(const document of documents){  
                const {shapes, levels} = helper.documentToRegion(
                    document, 
                    this.scene//, {asObject: true}

                )
                if(shapes.length) {
                    //confirm that the shape is in the actual region
                    const finalShapes = [];

                    for (const s of shapes) {
                        const poly = helper.shapeToPolygon(s, s.type)
                        if (this.polygonIsInRegion(this.region, poly)) {
                            //push the shape in, converted to an object
                            finalShapes.push(s);
                        }
                    }

                    if (!finalShapes.length) continue;

                    for(const [id, array] of this.#universe){
                        if(!levels.size || levels.has(id)) {
                            array.push(...finalShapes)
                        }
                    } 
                }
            }
        }
    }
    

    /**Stretches the given elevation object based on zone stretch settings
     * 
     * @param {object} elevation 
     * @returns object
     */
    #stretch(elevation){
        return Object.assign(elevation, this.stretch.elevation)
    }

    /**
     * Exposed private method for setting region data
     * @param {object} data 
     */
    _setRegionData(data = {}){
        Object.assign(this.#regionData, data)
    }


    /**Set a type identifier
     *  @param {string} type 
     */
    _setType(intype = ''){
        let type

        if(intype){
            type = intype
        }
        else if(this.hasRegion){
            type = 'region'
        } else {
            type = 'universe'
        }

        this.#type = type
    }


    /**  METHODS */


    /**destroy a highlight layer previously created for displaying this boundary in highlight
     * 
     * @param {string} name the name of the highlight layer
     */
    destroyHighlight(name){
        canvas.interface.grid.destroyHighlightLayer('dz-' + name)
    }
    



    /**
     * 
     * @param {object} elevation testing againt with top, bottom, topInclusive 
     * @param {object} elevation to test top / bottom
     * @returns boolean test, true if the elevation to test is within the elevation to test against
     */
    static testElevation({bottom, top, topInclusive}, elevation){
        if ( elevation.top < bottom ) return false;
        if (
            elevation.top === elevation.bottom &&
            elevation.bottom === bottom &&
            bottom === top
        ) {
            return true
        }
        if ( topInclusive ) return elevation.bottom <= top;
        return elevation.bottom < top;
    }



    /**Generates an object containing bounds for the boundary region associated with the given level
     * 
     * @param {string or level} level level id or the level class
     * @returns object
     */
    getLevelRegionBounds(level){

        const id = level?.id ?? level
        const region = this.levelsRegions.get(id)
        const dim = this.scene.dimensions
        const elevation = region.elevation
        const {x, y, bottom: lower, right} = region.bounds
        const {top, bottom, topInclusive} = elevation

        //establish grid points
        const topLeft = canvas.grid.getOffset({x, y})
        const bottomRight = canvas.grid.getOffset({x: right, y: lower})

        //establish how many grids can fit in this dimension
        const maxXGrids = Math.max((bottomRight.j - topLeft.j),1)
        const minYGrids = Math.max((bottomRight.i - topLeft.i),1)

        const bounds = {
            grids: {
                size: dim.size,
                maxX: maxXGrids,
                maxY: minYGrids
            },
            scene: this.scene,
            level: id,
            bounds: region.bounds,
            elevation: elevation,
            maxDepth: (top - bottom) + (topInclusive ? 1 : 0)
        }

        return bounds
    }



    /**
     * 
     * @param {object} options 
     *               //bleed boolean
     *               //range object {
     *                          d: int //depth in elevation 
     *                          w: int //width in grid spaces
     *                          h: int //height in grid spaces
     *                      }
     *               //levels array of level ids to restrict search to
    *                //documents array of documents to restrict point to include
     *               //fail object {
     *                  noLevel //fail if no level is found under the given options
     *                  }
     *               //sourceTarget string source targeting rules (In, Adjacent, Both)
     */
    getRandomBoundary(options = {}){
        const {units: {w, h, d}, bleed, stretch} = options

        //return a random level and set it for the level to use from here onward.
        const _levels = this.getRandomLevelInBoundary(options)
        if(_levels.invalid){
            return dangerZone.log(false, `${_levels.invalid}`, {options, boundary: this, levelsData: _levels.levels})
        }
        const level = _levels.levels.selected;
        
        //Shift and validate the final danger boundary against the original zone bounds.
        const regionBounds = this.getLevelRegionBounds(level)
        options.regionBounds = regionBounds
        
        const pointData = this.getTargetBoundaryGrids(level, options);
        if(pointData.invalid){
            return dangerZone.log(false, `${pointData.invalid}`, {options, boundary: this, pointData})
        }

        const shiftedPoint = this.#getShiftedPoint(pointData, bleed);

        if(shiftedPoint.invalid){
            dangerZone.log(false, `No valid boundary found; aborting boundary generation`, {options, boundary: this, pointData: shiftedPoint})
            return false
        }
        
        const {coord: {x, y, elevation: bottom}} = shiftedPoint

        const topInclusive = regionBounds?.elevation?.topInclusive
        const b = dimensionBoundary.locationToBoundary(
            {x,y}, 
            {bottom, top: bottom + d, topInclusive}, 
            {w, h, d}, 
            this.scene, 
            {levels: [level], stretch}
        )

        dangerZone.log(false, 'Random boundary got got....', {b, pointData, shiftedPoint, _levels, regionBounds, options})
        
        return b
    }



    /**Returns a random level within the boundary
     * 
     * @param {boundary} testBoundary //boundary to use for selecting the random level and checking for fitting dimensions
     * @param {object} options 
    *               //level array of level ids to restrict search to
    *               //documents array of documents to restrict point to include
    *               //fail object {
    *                  noLevel //fail if no level is found under the given options
    *                  }
    *               //units object //the units height, width, depth that must fit within the boundary when bleed is not allowed. Typically these are from the danger
    *               //bleed boolean //when bleed is false, the units must fully fit in the bounds of the selected level
     * @returns object data (see definition in function)
     */
    getRandomLevelInBoundary(options = {}){
        //extract options
        const {units: {w, h, d}, levels, documents, bleed, fail} = options

        //variables to hold the return data 
            //levels: object
                //eligible: array levels to test within using the levels passed in else the test boundary's levels
                //filtered: array levels filtered to those that are included in one or more of the passed in documents, if applicable. Also must be large enough to fit the danger dimensions.
                //selected: the level selected at random
            //invalid: message for invalid data
        const data = {
            levels: {
                filtered: [],
                eligible: levels?.length ? levels : this.levelIds,
                selected: ''
            },
            invalid: ''
        }

        //if documents are provided, filter the levels to ones found within the documents
        if(documents) {
      
            //filter the leves to those that are included in one or more of the passed in documents
            const filteredLevels = data.levels.eligible.filter(l => documents.some(d => d.level === l || d.locatedInLevel(l)))

            data.levels.filtered = filteredLevels
            dangerZone.log(false, 'Boundary levels filtered by documents...', {data, documents, filteredLevels})

            //if no levels remain
            if(!data.levels.filtered.length){
                //if fail on no levels, return
                if(fail?.noLevel) {console.trace()
                    data.invalid = 'no levels met universe document level requirements for this test point in boundary'
                    return data
                }
            
                //else set levels back to eligible levels
                data.levels.filtered = data.levels.eligible 
            } 
        } else {
            //else use the eligible levels
            data.levels.filtered = data.levels.eligible 
        }

        //if no levels remain, set
        if(!data.levels.filtered.length) {
            data.invalid = 'No levels meet target dimension requirements for this test point in boundary'
        } else {
            //generate random level as selected level
            data.levels.selected = data.levels.filtered.length < 2 ? data.levels.filtered[0] : helper.pickRandom(data.levels.filtered);
        }     

        return data
    }


    /**Searches shuffled grid/elevation candidates for a footprint that satisfies the bleed rule.*/
    #getShiftedPoint(pointData = {}, bleed = false){
        const {grids, region, regionBounds, units} = pointData;
        const data = {invalid: '', regionBounds};
        const {top, bottom, topInclusive} = regionBounds.elevation;
        const maxElevation = topInclusive ? top : top - 1;
        const {maxX, maxY} = regionBounds.grids;
        const maxDepth = regionBounds.maxDepth;
        const oversized = {
            w: !bleed && units.w >= maxX,
            h: !bleed && units.h >= maxY,
            d: !bleed && units.d >= maxDepth
        };
        const maxStartElevation = bleed || oversized.d
            ? (oversized.d ? bottom : maxElevation)
            : top - units.d + (topInclusive ? 1 : 0);
        const minStartElevation = oversized.d
            ? maxElevation - units.d + 1
            : bottom;
        const elevations = [];

        for(let elevation = minStartElevation; elevation <= maxStartElevation; elevation++){
            elevations.push(elevation);
        }

        const [i0, j0, i1, j1] = canvas.grid.getOffsetRange(region.bounds);
        const {x: regionLeft, y: regionTop, right: regionRight, bottom: regionBottom} = region.bounds;
        const candidateGridIndices = new Set(grids.map(({i, j}) => `${i},${j}`));

        const isInRegionOrCandidateGrid = testPoint => {
            const {i, j} = canvas.grid.getOffset(testPoint);
            return region.testPoint(testPoint) || candidateGridIndices.has(`${i},${j}`);
        };

        const {dimensions} = regionBounds.scene;
        const sceneLeft = dimensions.sceneX;
        const sceneTop = dimensions.sceneY;
        const sceneRight = sceneLeft + dimensions.sceneWidth;
        const sceneBottom = sceneTop + dimensions.sceneHeight;
        const spansSceneWidth = !bleed && units.w >= Math.ceil(dimensions.sceneWidth / dimensions.size);
        const spansSceneHeight = !bleed && units.h >= Math.ceil(dimensions.sceneHeight / dimensions.size);
        const singleGrid = units.w === 1 && units.h === 1;

        for(const grid of grids){
            const coord = {x: grid.x, y: grid.y};
            const shifts = singleGrid ? [{w: 0, h: 0}] : [];
            if(!singleGrid){
                for(let x = 0; x < units.w; x++){
                    for(let y = 0; y < units.h; y++){
                        shifts.push({w: x, h: y});
                    }
                }
            }

            for(const shift of helper.shuffleArray(shifts)){
                const shiftedCoord = point.shiftPoint(coord, {
                    w: -shift.w,
                    h: -shift.h
                });
                if(spansSceneWidth) shiftedCoord.x = sceneLeft;
                if(spansSceneHeight) shiftedCoord.y = sceneTop;
               
                const pointB = point.shiftPoint(shiftedCoord, units);
                const inScene = shiftedCoord.x >= sceneLeft
                    && shiftedCoord.y >= sceneTop
                    && (bleed || (pointB.x <= sceneRight && pointB.y <= sceneBottom));
                 if(!inScene) continue;

                if(!singleGrid && !spansSceneWidth && !spansSceneHeight){
                    if(bleed){
                        const footprint = helper.shapeToPolygon({
                            x: shiftedCoord.x,
                            y: shiftedCoord.y,
                            width: pointB.x - shiftedCoord.x,
                            height: pointB.y - shiftedCoord.y
                        });
                        if(!this.polygonIsInRegion(region, footprint)) continue;
                    } else {
                        if(oversized.w){
                            const startJ = canvas.grid.getOffset(shiftedCoord).j;
                            if(startJ > j0 || startJ + units.w < j1) continue;
                        }
                        if(oversized.h){
                            const startI = canvas.grid.getOffset(shiftedCoord).i;
                            if(startI > i0 || startI + units.h < i1) continue;
                        }
                    }
                }

                for(const elevation of helper.shuffleArray([...elevations])){
                    shiftedCoord.elevation = elevation;
                    pointB.elevation = elevation + units.d - 1;

                    if(!bleed && !singleGrid && !spansSceneWidth && !spansSceneHeight){
                        if(oversized.d && (elevation > bottom || pointB.elevation < maxElevation)){
                            continue;
                        }

                        const testA = {...shiftedCoord};
                        const testB = {...pointB};

                        if(oversized.w){
                            testA.x = Math.min(Math.max(testA.x, regionLeft), regionRight - 1);
                            testB.x = Math.min(Math.max(testB.x, regionLeft), regionRight - 1);
                        }
                        if(oversized.h){
                            testA.y = Math.min(Math.max(testA.y, regionTop), regionBottom - 1);
                            testB.y = Math.min(Math.max(testB.y, regionTop), regionBottom - 1);
                        }
                        if(oversized.d){
                            testA.elevation = bottom;
                            testB.elevation = maxElevation;
                        }
                        if(!isInRegionOrCandidateGrid(testA) || !isInRegionOrCandidateGrid(testB)){
                            continue;
                        }
                    }

                    data.coord = shiftedCoord;
                    return data;
                }
            }
        }

        data.invalid = `No valid ${bleed ? 'bleed' : 'non-bleed'} boundary found for the candidate grids`;
        return data;
    }


    /**Iterates through all of the grids in a region and yields the grid offset and top left coordinates
     * 
     * @param {region} region
     */
    *#iterateRegionGrids(region){
        const [i0, j0, i1, j1] = canvas.grid.getOffsetRange(region.bounds);

        for(let i = i0; i < i1; i++){
            for(let j = j0; j < j1; j++){
                const offset = {i, j};
                const center = canvas.grid.getCenterPoint(offset);
                const poly = helper.shapeToPolygon({points: canvas.grid.getVertices(center)}, 'polygon');
                if(!this.polygonIsInRegion(region, poly)) continue;

                const topLeft = canvas.grid.getTopLeftPoint(center);
                yield {
                    i,
                    j,
                    x: topLeft.x,
                    y: topLeft.y
                };
            }
        }
    }

    #setTargetGridPools(){
        this.#targetGridPools = new Map();
        const sourceTarget = ['A', 'B'].includes(this.options.sourceTarget)
            ? this.options.sourceTarget
            : 'I';

        for(const [level, region] of this.levelsRegions){
            const inside = [...this.#iterateRegionGrids(region)];
            if(sourceTarget === 'I'){
                this.#targetGridPools.set(level, inside);
                continue;
            }

            const insideIndices = new Set(inside.map(({i, j}) => `${i},${j}`));
            const adjacent = new Map();

            for(const grid of inside){
                for(const offset of canvas.grid.getAdjacentOffsets({i: grid.i, j: grid.j})){
                    const key = `${offset.i},${offset.j}`;
                    if(insideIndices.has(key) || adjacent.has(key)) continue;

                    const topLeft = canvas.grid.getTopLeftPoint(canvas.grid.getCenterPoint(offset));
                    adjacent.set(key, {
                        i: offset.i,
                        j: offset.j,
                        x: topLeft.x,
                        y: topLeft.y
                    });
                }
            }

            const adjacentGrids = [...adjacent.values()];
            const grids = sourceTarget === 'A'
                ? adjacentGrids
                : sourceTarget === 'B'
                    ? [...inside, ...adjacentGrids]
                    : inside;
            this.#targetGridPools.set(level, grids);
        }
    }


    /**Returns this level's cached target grids, optionally narrowed to documents
     * 
     * @param {string} level //id of level
     * @param {array} documents //array of documents, typically tokens
     * @returns array of candidate grids
     */
    #getBoundaryGridPool(level, documents = []){
        const candidates = this.#targetGridPools.get(level) ?? [];
        if(!documents?.length) return candidates;

        const documentPolygons = documents.map(document => helper.shapeToPolygon({
            x: document.x,
            y: document.y,
            width: document.width,
            height: document.height
        }));

        const documentGrids = candidates.filter(grid =>
            documentPolygons.some(polygon => polygon.contains(grid.x, grid.y))
        );
        return documentGrids.length ? documentGrids : candidates;
    }
    
    /**
     * 
     * @param {string} level //level id
     * @param {*} options 
     * @param {*} param2 
     * @returns 
     */
    getTargetBoundaryGrids(level, options = {}){
        const {documents, regionBounds, units} = options;

        const grids = this.#getBoundaryGridPool(level, documents);

        if(!grids.length) return {invalid: 'No target boundary grids found'};

        dangerZone.log(false, `Grids iterator created...`, {options, grids, documents, regionBounds, units})

        return {
            boundary: this,
            level,
            region: this.levelsRegions.get(level),
            regionBounds,
            invalid: '',
            units,
            grids: helper.shuffleArray([...grids])
        };
    }


    /**Highlights a grid highlight layer with the dimensions of this boundary
     * 
     * @param {object} options {
     *              id //highlight layer name to use for locating the highlight and turning it off
     *              level //id for the level holding the region to highlight
     *              color //the color to use for highlight
     */
    highlight(options = {} ){

        //highlight only if the scene of this boundary matches the canvas scene
        if(canvas.scene.id !== this.scene.id) return

        //set variables
        const color = options.color ?? 16737280
        const name = options.id ?? ''
        const level = options.level ?? helper.getDefaultLevel()
        const region = this.levelsRegions.get(level)

        //the boundary must exist on the level in order to highlight
        if(!region) return dangerZone.log(false, 'Boundary does not exist on this level. No highlighting applied')

        //level must be the visible one
        if(helper.getVisibleLevel().id !== level) return dangerZone.log(false, 'Level to highlight is not visible')

        //append to id for the highlight layer the danger zone prefix
        const hId = 'dz-' + name;

        //add the highlight level
        canvas.interface.grid.addHighlightLayer(hId);

        dangerZone.log(false, `Highlight ${hId} for region...`, {region, boundary: this})

        for(const grid of this.#targetGridPools.get(level) ?? []){
            canvas.interface.grid.highlightPosition(hId, {x: grid.x, y: grid.y, color});
        }
    }



    /**Tests a polygon within a region to see if they intersect
     * This is a temporary approach until I can figure out how to use polygon tree and/or clipper paths
     * Original attempt could not deal with a region that had a whole entirely within a larger shape.
     * @param {region} region 
     * @param {polygon} poly 
     * @returns boolean
     */
    polygonIsInRegion(region, poly){
        const tree = region.polygonTree.intersectPolygon(poly);
        return !tree.isEmpty;
    }





    /**Intakes an array of tokens and outputs an array consisting of those tokens that exist within the document bounds. 
     * 
     * @param {array} tokens //an array of token documents
    *  @param {object} options // stretch: the stretch object, including type and elevation                              
     * @returns  array of tokens
     */
    tokensIn(tokens, options = {}){
        let kept = [];
        const tokenCount = tokens?.length ?? tokens?.size;
        if (!this.levelsRegions?.size || !tokenCount) return kept; 
    
        //iterate over tokens, keeping those that exist in the boundary
        for(let token of tokens){
            const {elevation, object} = token
            const {x, y, w, h} = object

            const polygon = helper.shapeToPolygon({x, y, width: w, height: h})
            if(!polygon) continue

            const region = this.levelsRegions.get(token.level);
            if(!region) continue;

            const regionElevation = foundry.utils.deepClone(region.elevation);
            if(options.stretch) this.#stretch(regionElevation);

            const tokenElevation = {
                bottom: elevation,
                top: elevation + helper.getTokenDepth(token)
            };
            if(!boundary.testElevation(regionElevation, tokenElevation)) continue;

            const targetGrids = this.#targetGridPools.get(token.level) ?? [];
            if(targetGrids.some(grid => polygon.contains(grid.x, grid.y))) kept.push(token);
        }

        return kept
    } 



    /**
     * Checks boundary data for correctness
     * @returns boolen //true = valid boundary, false = invalid
     */
    validate(){
        //at least one level/region is required
        if(!this.levelsRegions.size){
            return false
        }
        //check elevations
        if(!this.bottomIsInfinite && !this.topIsInfinite && this.top < this.bottom) {
            dangerZone.log(true, 'Boundary dimensions are invalid - top at a lower elevation than bottom', {boundary: this})
            return false
        }
        return true
    }
}

/*
    options:{
        A: top left coordinate of boundary (x,y)
        B: bottom right coordinate of boundary (x,y)
        retain: bool //prevents the boundary during initialization to locking the boundary points to the grid. Instead, point may be anywhere and not residing on a grid intersection
    }
*/
export class dimensionBoundary extends boundary {

    constructor(...args){
        super(...args)

        this._init()
    }

    /****Initialization Activities */
    #A

    #B

        /** GETTERS */
    //this initial coordinate passed in for top left
    /**@override */
    get A(){
        return this.#A
    }

    //this initial coordinate passed in for bottom right
    /**@override */
    get B(){
        return this.#B
    }

    /**
     * @override
     */    
    _init(){
        const {A,B} = this.options
        const ax = A.x ?? 0;
        const ay = A.y ?? 0;
        const bx = B.x ?? 0;
        const by = B.y ?? 0;

        this.#setA({
            x: Math.min(ax, bx),
            y: Math.min(ay, by)
        });

        this.#setB({
            x: Math.max(ax, bx),
            y: Math.max(ay, by)
        });

        //if not set to keep points where they are, locks the boundary points to the grid 
        if(!('retain' in this.options)) this.#toTopLeft();

        const x1 = this.A.x;
        const y1 = this.A.y;
        const x2 = this.B.x;
        const y2 = this.B.y;

        const regionData = {
            shapes: [
                {
                    type: 'rectangle',
                    x: Math.min(x1, x2),
                    y: Math.min(y1, y2),
                    width: Math.abs(x2 - x1),
                    height: Math.abs(y2 - y1),
                    hole: false
                }
            ]
        }
        this._setRegionData(regionData)

        super._init()
    }

    
      
    /**Offsets an x or y axis
     * 
     * @param {number} axis x or y
     * @param {boolean} flip performs mirroring
     * @param {scene} scene 
     * @param {number} random a generated random number, often at the global level to keep results consistent
     * @returns 
     */
    static _offsetAxis(axis, flip, scene, random){

        const rand = (min, max) =>
            min === max ? min : (Math.floor(random * (max - min + 1)) + min);

        const value = rand(axis.min, axis.max);

        if (axis.type === "pxl") return value * flip

        if (axis.type === "pct") return Math.floor((value / 100) * scene.dimensions.size) * flip

        return 0
    }

    /**
     * sets x and y for A (top left)
     * @param {object} data 
     */
    #setA(data){
        this.#A = data
    }

    /**
     * sets x and y for B (bottom right) 
     * @param {object} data 
     */
    #setB(data){
        this.#B = data
    }
   

    /**
     * @override
     */
    _setType(){
        super._setType('dimension')
    }


    
    /**Initialization: lock into grid
     * Used to ensure that that boundary points are locked to the grid points (as opposed to mid-grid)
     */
    #toTopLeft(){    
        this.#setA(canvas.grid.getTopLeftPoint(this.A));
        this.#setB(canvas.grid.getTopLeftPoint(this.B));
    }

    
    /**Converts a foundry document into a Danger Zone boundary
     * 
     * @param {document} document 
     * @param {scene} scene
     * @param {object} options  //options not used here are also passed through into the boundary method
     *  {
     *      elevation: {bottom: integar, top: integer}} //used to pass in bottom and top of zone for world zones,
     *  }
     * @returns 
     */
    static documentBoundary(document, scene = document.scene, options = {}){
        const region = helper.documentToRegion(document, scene)

        //generate the new bound
        const {x, y, width, height, radius} = region.shapes[0]
        const {top, bottom} = region.elevation

        options.A = {x, y}
        options.B = {x: x + (width ?? radius), y: y + (height ?? radius)}
        const e = {bottom: options.elevation?.bottom ?? bottom, top: options.elevation?.top ?? top}

        //options.levels = region.levels

        const b = new dimensionBoundary(e, scene, options)

        dangerZone.log(false, 'Creating document boundary', {boundary: b, document: document})
        //return the boundary
        return b
    }

    


    /**Generates a new boundary based on a given location and dimensions
     * 
     * @param {*} startingCoords 
     * @param {*} elevation 
     * @param {*} dimension 
     * @param {*} options 
     * @returns 
     */
    static locationToBoundary(startingCoords, elevation, dimension, scene, options={}){

        //Define the ending coordinates for the boundary end point given the start point and dimension
        options.B = point.shiftPoint(startingCoords, dimension)
        options.A = startingCoords;

        //generate the new boundary
        const b = new dimensionBoundary(elevation, scene, options)

        dangerZone.log(false,'Creating location dimension boundary...', {newBoundary: b, startingCoords: startingCoords, dimension: dimension, options: options});
        return b
    }



    /**Offsets a boundary based on passed in settings
     * 
     * @param {boundary} bndry 
     * @param {object} globalOffset offset random generated settings at global level {random: number; biRandom: boolean}
     * @param {object} offset offset settings for x and y, typically set on the danger part
     * @param {scene} scene 
     * @returns 
     */
    static offsetBoundary(bndry, globalOffset, offset, scene = canvas.scene){
        const resolveFlip = (flip, flipLocation) => {
            const isBool = typeof flip === "boolean";
            const shouldFlip = isBool ? flip : ['N', 'L', 'B'].includes(flip);
            return shouldFlip && flipLocation ? -1 : 1;
        };

        const opts = Object.assign(
                bndry.options, {
                offset: {
                    x: { flip: resolveFlip(offset.x.flip, globalOffset.x.flipLocation), amt: 0 },
                    y: { flip: resolveFlip(offset.y.flip, globalOffset.y.flipLocation), amt: 0 }
                },
                retain: true
            }
        );

        opts.offset.x.amt = dimensionBoundary._offsetAxis(offset.x, opts.offset.x.flip, scene, globalOffset.x.random);
        opts.offset.y.amt = dimensionBoundary._offsetAxis(offset.y, opts.offset.y.flip, scene, globalOffset.y.random);

        opts.A = {
            x: bndry.A.x + opts.offset.x.amt,
            y: bndry.A.y + opts.offset.y.amt
        };

        opts.B = {
            x: bndry.B.x + opts.offset.x.amt,
            y: bndry.B.y + opts.offset.y.amt
        };

        dangerZone.log(false, 'Creating dimension boundary from offset', {
            globalOffset,
            offset,
            scene,
            options: opts,
            originalBoundary: bndry
        });

        return new dimensionBoundary(bndry.elevation, scene, opts);
    }
}


export class point{
    constructor(coords = {x: 0, y: 0}, elevation = null){
        this.coords = coords,
        this.elevation = elevation;
        this.#toTopLeft();
    }
    
    #toTopLeft(){    
        this.coords = canvas.grid.getTopLeftPoint(this.coords);
    }

    static shiftPoint(reference = {}, shift = {}){
        const {w, h, d} = shift
        let shifted = foundry.utils.deepClone(reference)

        for(let i=0;i<Math.abs(w);i++){
            shifted = canvas.grid.getShiftedPoint(
                shifted, 
                w > 0 ? 
                CONST.MOVEMENT_DIRECTIONS.RIGHT : 
                CONST.MOVEMENT_DIRECTIONS.LEFT
             )
            } 
        
        for(let i=0;i<Math.abs(h);i++){
            shifted = canvas.grid.getShiftedPoint(
                shifted, 
                h > 0 ? 
                CONST.MOVEMENT_DIRECTIONS.DOWN : 
                CONST.MOVEMENT_DIRECTIONS.UP
                )
            }
        
        if(d && shifted.elevation !== undefined){
            const elevation = shifted.elevation + d
            shifted.elevation = elevation 
        }
        
        return shifted
    }
}