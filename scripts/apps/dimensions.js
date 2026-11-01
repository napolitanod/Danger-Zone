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
        const region = this.regionId ? this.scene.getEmbeddedDocument("Region",this.regionId) : {}
        return region ?? {}
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
        return {
            elevation: this.elevation,
            exclude: helper.getTagEntities(game.settings.get(dangerZone.ID, 'zone-exclusion-tag'), this.scene),    //Generate the exclusion list of documents 
            levels: this.zoneLevels,    //include the zone levels   
            universe: this.zone?.sourceArea,   //Generate a universe of documents for the boundary to use that consists of the zone's sources
            regionUuid: this.region.uuid,  //include the region
            stretch: this.stretch
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
        if(opts.bottom) regionData.elevation.bottom = opts.bottom;
        if(opts.top) regionData.elevation.top = opts.top;
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
                const {shapes, levels} = helper.documentToRegion(document, null, {asObject: true})
                if(shapes.length) {
                    for(const [id, array] of this.#universe){
                        if(!levels.size || levels.has(id)) array.push(...shapes)
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
    


    /**return a boundary region that includes the shape
     * 
     * @param {PIXI} shape a PIXI shape
     * @param {object} elevation bottom and top of token
     * @param {array} levels array of level ids
     * @param {object} options stretch
     * @returns boolean false or object {region id, region} 
     */
    findRegionContainingShape(shape, elevation, levels = [], {stretch}){

        //must be shape and must have regions on the boundary
        if(!shape || !this.levelsRegions?.size) return false
        
        //convert shape to polygon
        const poly = shape.toPolygon()
 
        //test the region polygon tree for including shape. Return region key and region if so
        for(const [key, value] of this.levelsRegions) {
            if(levels.length && !levels.includes(key)) continue;

            const regionElevation = foundry.utils.deepClone(value.elevation)
            if(stretch){
                this.#stretch(regionElevation)
            }

            if(elevation) {
                const inEl = boundary.testElevation(regionElevation, elevation)
                if(inEl){
                    const inRegion = this.polygonIsInRegion(value, poly)
                    if(inRegion) return { key, value }
                }
            }
        }

        //else return false
        return false
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
     */
    getRandomBoundary(options = {}){
        const {units: {w, h, d}, bleed, documents, stretch} = options

        //return a random level and set it for the level to use from here onward.
        const _levels = this.getRandomLevelInBoundary(options)
        if(_levels.invalid){
            return dangerZone.log(false, `${_levels.invalid}`, {options, boundary: this, levelsData: _levels.levels})
        }
        const level = _levels.levels.selected;

        if(documents?.length){
            const _documents = this.getRandomDocumentBoundary(level, documents)
            if(_documents.invalid){
                //currently doesn't break flow
                dangerZone.log(false, `${_documents.invalid}`, {options, boundary: this, documentsData: _documents.documents})
            }
            options.boundaryRestricted = _documents.boundary
        }
        
        let shiftedPoint

        

        let _point = this.getRandomPointInBoundary(level, options)
        if(_point.invalid){
            return dangerZone.log(false, `${_point.invalid}`, {options, boundary: this, pointData: _point})
        }


        /* Begin Boundary Testing */
        let testPassed = false

        //the random point can be used if the target dimensions is 1 grid/e
        if(Math.max(d,w,h) <= 1){
            shiftedPoint = _point
            testPassed = true
        }

        //else boundaries need to be tested. Start with non-bleed testing
        if(!testPassed && !bleed) {
            //test for non-bleed (if no valid non-bleed is found, then will attempt as bleed)
            let maxNonBleed = 1000; 
            let nonBleedI = 0
            while (nonBleedI < maxNonBleed && !testPassed){
                if(!_point.invalid){
                    shiftedPoint = this.#getShiftedNoBleedPoint(_point)
                    if (shiftedPoint.invalid) {
                        dangerZone.log(false, `${shiftedPoint.invalid}`, {options, boundary: this, originalPoint: _point, shiftedPoint: shiftedPoint})
                    } else {
                        testPassed = true
                    }
                } else {
                    dangerZone.log(false, `${_point.invalid}`, {options, boundary: this, pointData: _point})
                }
                
                nonBleedI++
            }
        }
        
        //test for bleed
        if(!testPassed){
            shiftedPoint = this.#getShiftedBleedPoint(_point)
            if (shiftedPoint.invalid) {
                dangerZone.log(false, `${shiftedPoint.invalid}`, {options, boundary: this, originalPoint: _point, shiftedPoint: shiftedPoint})
            } else {
                testPassed = true
            }
        }

        if(!testPassed){
            dangerZone.log(false, `No valid boundary found. Default to original point`, {options, boundary: this, pointData: shiftedPoint})
        }
        
        const {coord: {x, y, elevation: bottom}, regionBounds} = shiftedPoint

        const topInclusive = regionBounds?.elevation?.topInclusive
        const b = dimensionBoundary.locationToBoundary(
            {x,y}, 
            {bottom, top: bottom + d, topInclusive}, 
            {w, h, d}, 
            this.scene, 
            {levels: [level], stretch}
        )

        dangerZone.log(false, 'Random boundary got got....', {b, _point, shiftedPoint, _levels, options})
        
        return b
    }



    
    /**Generate a random point from within the boundary
     * 
     * @param {string} level id 
     * @param {object} options 
    *               //level array of level ids to restrict search to
    *               //documents array of documents to restrict point to include
    *               //fail object {
    *                  noLevel //fail if no level is found under the given options
    *                  }
    *               //testingBoundary boundary is the original boundary to use for testing points, as may be the case when this function is called recursively 
    *                       in the case larger boundary is restricted down to a token document 
     * @returns object {point {x,y,elevation}, string level}
     */
    getRandomDocumentBoundary(level, documents){
         //variables to hold the return data 
            //documents: object 
                // eligible: array of documents passed into this method
                // filtered: array of eligible documents in the level to reduce the random point range to 
                // selected: the document to use for the boundary within to generate the point
            //invalid: message for invalid data
        const data = {
            boundary: null,
            documents: {
                eligible: documents,
                filtered: documents ? this.#filterDocumentsByBoundaryLevel(documents, [level]) : [],
                selected: ''
            },
            invalid: ''
        }

        //if a document still remains after the , establish that as the new boundary and get a random point from there
        //this will recursive the process through again
        if(documents.length){
            if(data.documents.filtered?.length) {
                //if documents provided, find a target point located in the document boundary
                data.documents.selected = helper.pickRandom(data.documents.filtered)

                //create a boundary from this new document
                data.boundary = dimensionBoundary.documentBoundary(data.documents.selected)

                dangerZone.log(false, 'Document selected for use in restricting random point', {data})
            } else {
                data.invalid = 'No passed in document exists on the level being used to select a random point';
            }
        } 

        return data
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
            data.levels.filtered = data.levels.eligible.filter(l => documents.some(d => d.locatedInLevel(l)))
            dangerZone.log(false, 'Boundary levels filtered by documents...', {data, documents})

            //if no levels remain
            if(!data.levels.filtered.length){
                //if fail on no levels, return
                if(fail?.noLevel) {
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

        //if bleed isn't allowed, the level must be large enough to fit the dimensions of the danger
        if(!bleed && (Math.max(d,w,h) > 1)){
            const kept = []; 
            for(const level of data.levels.filtered){
                const bounds = this.getLevelRegionBounds(level)
                if (
                    bounds.grids.maxX >= w 
                    && bounds.grids.maxY >= h
                    && bounds.maxDepth >= d
                ){
                    kept.push(level)
                }
            }

            //update the filtered levels to be only those kept
            data.levels.filtered = kept
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




    /**Generate a random point from within the boundary 
     * 
     * @param {string} level id 
     * @param {object} options 
    *               //boundaryRestricted boundary //an override boundary to use for selecting the point, typically from a document
     * @returns object data (see definition in function)
     */
    getRandomPointInBoundary(level, options = {}){
        //extract options
        const {boundaryRestricted, units} = options

        //variables to hold the return data 
            //bounds: object //the A and the B and the elevation within with the random point is selected
            //boundary: the boundary to select the region from, either the overall boundary or the restricted one passed in
            //region: the region for the level passed in of the boundary 
            //regionBounds: object containing the boundary for the region on the given level
            //level: string //the id of the level passed in on options
            //coord: object x,y,elevation for the selected point. elevation is an integer
            //invalid: message for invalid data
            //units: the units passed in on options
        const data = {
            boundary: boundaryRestricted ?? this,
            level: level,
            region: null,
            regionBounds: null,
            invalid: '',
            coord: {
                x: 0,
                y: 0,
                elevation: 0
            },
            bounds: {
                A: {
                    x: 0,
                    y: 0
                },
                B: {
                    x: 0,
                    y: 0
                },
                elevation: {
                    bottom: 0,
                    top: 0
                }
            },
            units: units
        }

        //for simpler code, set some of the data boundaries into variables
        const A = data.bounds.A
        const B = data.bounds.B
        const elevation = data.bounds.elevation
        const coord = data.coord

        //get the region for testing
        data.region = data.boundary.levelsRegions.get(level)

        //get remainder of bounds for iterating
        data.regionBounds = data.boundary.getLevelRegionBounds(level)
        const {bounds, elevation: {top, bottom, topInclusive}} = data.regionBounds

        //set the boundary points and shift amounts
        A.x = bounds.x;
        A.y = bounds.y;
        B.x = bounds.right;
        B.y = bounds.bottom;
        elevation.top = (topInclusive ? top : (top - 1));
        elevation.bottom = bottom;

        //set a max in case all tests fail (should not happen)
        const max = 1000

        //Perform the tests
        let i=0, inRegion = false;
        do {
            //pull the next randomly targeted area from within the overall boundary
            coord.x = helper.pickRandom(A.x, B.x)
            coord.y = helper.pickRandom(A.y, B.y)
            const rs = helper.pickRandom(elevation.bottom, elevation.top)
  
            coord.elevation = rs

            inRegion = data.region.testPoint(coord)

            i++;
        } while(!inRegion && i < max);
        
        if(!inRegion){
            data.invalid = 'No random point could be found within the provided boundary'
        } else {
            //set the coordinate to grid top left
            const topLeft = canvas.grid.getTopLeftPoint(coord)
            coord.x = topLeft.x
            coord.y = topLeft.y
        }

        return data
    }


    /**Generate a random point from within the boundary when units are allowed to bleed over the boundary perimeter
     * Because the original point targeted within the boundary, this shifting allows for targeting to occur outside boundary
     * but bleed into, which increases likelihood of targeting around edges of boundary
     * @param {string} level id 
     * @param {object} options 
    *               //level array of level ids to restrict search to
    *               //documents array of documents to restrict point to include
    *               //fail object {
    *                  noLevel //fail if no level is found under the given options
    *                  }
    *               //testingBoundary boundary is the original boundary to use for testing points, as may be the case when this function is called recursively 
    *                       in the case larger boundary is restricted down to a token document 
     * @returns object {point {x,y,elevation}, string level}
     */
    #getShiftedBleedPoint(pointData = {}){
        //extract options
        const {coord, regionBounds, units, region} = pointData

        //variables to hold the return data 
            //coord
            //invalid //message set when any issue is hit
        const data = {
            coord: {
                x: 0,
                y: 0,
                elevation: 0
            },
            invalid: '',
            regionBounds
        }

        const {scene: dimensions} = regionBounds
        const sceneWidth = dimensions.width;
        const sceneHeight = dimensions.height;

        //the boundary will be created based on coordinate settled on being top left coordinate. Thus, size of the final coordinate bottom right cannot exceed scene
        //this reduces acceptable bottom and right dimensions by the width of the target area
        const bottomRight = point.shiftPoint({x: sceneWidth, y: sceneHeight}, {w: ((units.w -1) * -1), h: ((units.h - 1) * -1)})

        //set a max in case all tests fail
        const max = 500

        //Perform the tests
        let i=0, inScene = false;
        do {
            const test = this.#getShiftedPoints(coord, units)
            
            //confirm the new boundary fits in the scene overall dimension (Can go into margin)
            if(Math.min(test.A.x, test.A.y) >=0
                && test.B.x < bottomRight.x
                && test.B.y < bottomRight.y
            ){
                const width = test.B.x - test.A.x
                const height = test.B.y - test.A.y
                const shape = new PIXI.Rectangle(test.A.x, test.A.y, width, height)
                const poly = shape.toPolygon()

                //final test to ensure the area overlaps region 
                if(this.polygonIsInRegion(region, poly)){
                    //establish new boundary
                    data.coord = test.A
                    inScene = true
                }
            }
            
            i++;
        } while(!inScene && i < max);
        
        //if no point could be found, use top left of the region boundary
        if(!inScene){
            data.invalid = `No valid bleed boundary found for coord x${coord.x}, y${coord.y}, e${coord.elevation}`
            data.coord = coord
        } 

        return data
    }

    /**Generate a random point from within the boundary when units are allowed to bleed over the boundary perimeter
     * 
     * @param {string} level id 
     * @param {object} options 
    *               //level array of level ids to restrict search to
    *               //documents array of documents to restrict point to include
    *               //fail object {
    *                  noLevel //fail if no level is found under the given options
    *                  }
    *               //testingBoundary boundary is the original boundary to use for testing points, as may be the case when this function is called recursively 
    *                       in the case larger boundary is restricted down to a token document 
     * @returns object {point {x,y,elevation}, string level}
     */
    #getShiftedNoBleedPoint(pointData = {}){
        //extract options
        const {coord, region, regionBounds, units} = pointData
        const {bounds, elevation, grids: {maxX, maxY}, maxDepth} = regionBounds

        //variables to hold the return data 
            //coord
            //locked //indicates that the coordinate set was set due to having to boundary being same size as danger units
            //invalid //message set when any issue is hit
        const data = {
            coord: {
                x: 0,
                y: 0,
                elevation: 0
            },
            locked: {
                x: false,
                y: false,
                elevation: false,
                fullZone: 0
            },
            invalid: '',
            regionBounds
        }

        const locked = data.locked
        const maxElevation = (elevation.topInclusive ? elevation.top : elevation.top -1)

        //lock in coordinates when the unit value matches the boundary dimension.
        //Reminder that the shifted points need to keep the original coordinate in the boundary

        //if the target has same dimensions as boundary for depth, or the test coordinate is on the bottom
        //then elevation must be kept as the bottom
        if(units.d === maxDepth || elevation.bottom === coord.elevation || maxElevation === coord.elevation){
            if(coord.elevation === maxElevation){
                data.coord.elevation = maxElevation - units.d
            } else {
                data.coord.elevation = elevation.bottom
            }
            locked.elevation = true;
            locked.fullZone++
        } 
        
        //if the target has same dimensions as boundary for x, or the test coordinate is on the x edge
        //then x must be kept as the top left point
        if(units.w === maxX || coord.x === bounds.x || coord.x === bounds.right){
            if(coord.x === bounds.right){
                const ShiftFromBottomX = point.shiftPoint({w: (w*-1), h: 0}, coord)
                data.coord.x = ShiftFromBottomX.x
            } else {
                data.coord.x = bounds.x;
            }
            locked.x = true;
            locked.fullZone++
        }

        //if the target has same dimensions as boundary for y, or the test coordinate is on the y edge
        //then y must be kept as the top left point
        if(units.h === maxY || coord.y === bounds.y || coord.y === bounds.bottom){
            if(coord.y === bounds.bottom){
                const ShiftFromBottomY = point.shiftPoint({w: 0, h: (h*-1)}, coord)
                data.coord.y = ShiftFromBottomY.y
            } else {
                data.coord.y = bounds.y;
            }
            
            locked.y = true;
            locked.fullZone++
        } 

        //set a max in case all tests fail
        const max = 25

        let inBoundary = false

        //if all of the dimensions are
        if(locked.fullZone < 3){
            //Perform the tests
            let i=0
            do {
                //generate a test point that is within a vacinity of the random point
                const test = this.#getShiftedPoints(coord, units, locked)
                
                //confirm the test boundary is within the scene bounds and the region
                //move point B to center, else it will be read as out of zone if it exists on the edge
                if(
                    Math.min(test.A.x, test.A.y) >=0 
                    && region.testPoint(test.A)
                    && region.testPoint(test.B)
                ){
                    inBoundary = true
                    data.coord = test.A
                }

                i++;
            } while(!inBoundary && i < max);
        } 
        
        //if no point could be found, use top left of the region boundary
        if(!inBoundary){
            data.invalid = `No valid non-bleed boundary found for coord x${coord.x}, y${coord.y}, e${coord.elevation}`
        } 

        return data
    }




    /**Returns a randomly shifted coordinate based on units provided and existing coordinate
     * 
     * @param {object} coord {x,y,elevation}
     * @param {object} units {w,h,d}
     * @param {object} locked {x,y,elevation,fullZone}
     * @returns object {A,B} coordinates marking top left and bottom right
     */
    #getShiftedPoints(coord,{w,h,d}, locked = {}) {
    
        const left = locked.x ? 0 : (w === 1 ? 0 : helper.pickRandom(0, w));
        const top = locked.y ? 0 : (h === 1 ? 0 : helper.pickRandom(0, h));
        const down = locked.d ? 0 : (d === 1 ? 0 : helper.pickRandom(0, d));

        const right = locked.x ? w : (w === 1 ? 1 : w - left);
        const bottom = locked.y ? h : (h === 1 ? 1 : h - top);
        const up = locked.d ? d : (d === 1 ? 1 : d - down);

        const coordA = point.shiftPoint(coord, {
            w: -1 * left,
            h: -1 * top,
            d: -1 * down
        });

        //after shift, center it to not have failures on tests at the edges of the boundary
        const coordB = point.shiftPoint(coord, {
            w: right,
            h: bottom,
            d: up
        });

        const B = {
                x: Math.max(coordA.x, coordB.x),
                y: Math.max(coordA.y, coordB.y),
                elevation: Math.max(coordA.elevation, coordB.elevation)
            }
        
        //The bottom right point may be out of the region if on the edge, so center and back up one diagonal left for the test\
        const centerB = point.shiftPoint(canvas.grid.getCenterPoint(B), {w: -1, h: -1});

        return {
            A: {
                x: Math.min(coordA.x, centerB.x),
                y: Math.min(coordA.y, centerB.y),
                elevation: Math.min(coordA.elevation, coordB.elevation)
            },
            B: {
                x: centerB.x,
                y: centerB.y,
                elevation: B.elevation
            }
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

        //the bounds for the given region
        const {x,y, right, bottom} = region.bounds;
        let {x: iX, y: iY} = canvas.grid.getTopLeftPoint({x,y})
        let baseY = iY;

        //add the highlight level
        canvas.interface.grid.addHighlightLayer(hId);

        dangerZone.log(false, `Highlight ${hId} for region...`, {region, boundary: this})

        //iterate through the grids in the region and highlight
        do{
            do{//iterate on Y axis, highlighting each grid in boundary level region
                const options = {x: iX, y: iY, color:color}

                //convert grid to shape
                const polygon = new PIXI.Polygon(canvas.grid.getVertices(options))

                if(this.polygonIsInRegion(region, polygon)){
                    canvas.interface.grid.highlightPosition(hId, options);
                }

                //moves to next grid in downward direction (2)
                const shiftDown = canvas.grid.getShiftedPoint(options, CONST.MOVEMENT_DIRECTIONS.DOWN)
                iY = shiftDown.y; iX = shiftDown.x;
            }
            while(iY < bottom)

            //moves to the next grid in right direction, keeping index of the Y
            const shiftRight = canvas.grid.getShiftedPoint({x: iX, y: baseY}, CONST.MOVEMENT_DIRECTIONS.RIGHT)
            baseY = shiftRight.y; iY = shiftRight.y; iX = shiftRight.x;
        }
        while(iX < right)
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

        if(!this.levelsRegions?.size) return

        let kept = [];
    
        //iterate over tokens, keeping those that exist in the boundary
        for(let token of tokens){
            const{x,y,width,height, elevation} = token
            const shape = new PIXI.Rectangle(x, y, width, height)

            //get elevation
            const tokenDepth = helper.getTokenDepth(token)
            const e = {bottom: elevation, top: elevation + tokenDepth}

            //checks the shape against the region. Will also check level
            if(this.findRegionContainingShape(shape, e, [token.level], options)) kept.push(token)
        }

        return kept
    } 



    /**
     * Checks boundary data for correctness
     * @returns boolen //true = valid boundary, false = invalid
     */
    validate(){

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