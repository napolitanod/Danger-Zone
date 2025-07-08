import {dangerZone} from "../danger-zone.js";
import {dangerZoneDimensions} from "./dimensions.js";
import {DangerForm} from './danger-form.js';
import {ZoneForm} from './zone-form.js';
import {triggerManager} from './trigger-handler.js';
import {CONTROLTRIGGERS, DANGERZONECONFIG} from './constants.js';
import {getEventData} from './helpers.js';

export class ExecutorForm extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
    constructor(sceneId, executor = {}, zones, ...args) {
      super(...args);
      this.sceneId = sceneId, 
      this.zoneId = executor?.zone?.id ? executor.zone.id : '',
      this.zones = zones ? zones : dangerZone.getExtendedZones(sceneId),
      this.executor = executor,
      this.locked = {
          boundary: false,
          source: false,
          saves: false,
          target: false
      };
    }

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        classes: [],
        id : DANGERZONECONFIG.ID.FORM.ZONEEXECUTOR,
        actions: {
            'boundary-clear': ExecutorForm.#boundaryClear,
            'boundary-highlight': ExecutorForm.#boundaryHighlight,
            'boundary-prompt': ExecutorForm.#boundaryPrompt,
            'boundary-random': ExecutorForm.#boundaryRandom,
            'boundary-target': ExecutorForm.#boundaryTarget,
            'boundary-eligible-fail': ExecutorForm.#boundaryEligibleFail,
            'boundary-eligible-succeed': ExecutorForm.#boundaryEligibleSucceed,
            'boundary-eligible-refresh': ExecutorForm.#boundaryEligibleRefresh,
            'boundary-eligible-fail': ExecutorForm.#boundaryEligibleFail,
            'boundary-eligible-highlight': ExecutorForm.#boundaryEligibleHighlight,
            'edit-danger': ExecutorForm.#editDanger,
            'edit-zone': ExecutorForm.#editZone,
            'play':  ExecutorForm.#play,
            'play-zone':  ExecutorForm.#playZone,
            'save-add-fail': ExecutorForm.#saveAddFail,
            'save-add-success': ExecutorForm.#saveAddSuccess,
            'save-clear': ExecutorForm.#saveClear,
            'save-highlight': ExecutorForm.#saveHighlight,
            'source-add': ExecutorForm.#sourceAdd,
            'source-clear': ExecutorForm.#sourceClear,
            'source-fail': ExecutorForm.#sourceFail,
            'source-highlight': ExecutorForm.#sourceHighlight,
            'source-replace': ExecutorForm.#sourceReplace,
            'source-succeed': ExecutorForm.#sourceSucceed,
            'stop':  ExecutorForm.#stop,
            'target-add': ExecutorForm.#targetAdd,
            'target-boundary-eligible': ExecutorForm.#targetBoundaryEligible,
            'target-clear': ExecutorForm.#targetClear,
            'target-fail': ExecutorForm.#targetFail,
            'target-highlight': ExecutorForm.#targetHighlight,
            'target-random': ExecutorForm.#targetRandom,
            'target-replace': ExecutorForm.#targetReplace,
            'target-succeed': ExecutorForm.#targetSucceed,
            'target-zone': ExecutorForm.#targetZone,
            'toggle-lock':ExecutorForm.#toggleLock,
            'trigger': ExecutorForm.#triggerZone,
            'wipe':  ExecutorForm.#wipe,
            'zone-fail': ExecutorForm.#zoneFail,
            'zone-highlight': ExecutorForm.#zoneHighlight,
            'zone-refresh': ExecutorForm.#zoneRefresh,
            'zone-succeed': ExecutorForm.#zoneSucceed
        },
        form: {
            submitOnChange: false,
            closeOnSubmit: true
        },
        position: {
            width: 350
        },
        tag: "form",
        window: {
            contentClasses: ["danger-zone-executor", "sheet"],
            title : DANGERZONECONFIG.LABEL.ZONEEXECUTOR,
            icon: DANGERZONECONFIG.ICON.ZONEEXECUTOR
        }
    }

      /** @override */
    static PARTS = {
        tabs: {template: DANGERZONECONFIG.TEMPLATE.TABNAV},
        trigger: {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.ZONEEXECUTOR.TRIGGER},
        exploded: {classes: ["standard-form"], scrollable: [""], template: DANGERZONECONFIG.TEMPLATE.ZONEEXECUTOR.EXPLODED},
        footer: {template: DANGERZONECONFIG.TEMPLATE.FOOTER}
    }

    /** @override */
    static TABS = {
        sheet: {
            initial: "trigger", 
            tabs: DANGERZONECONFIG.TAB.ZONEEXECUTOR
        }
    }

    /** @override */
    async _prepareContext() {
        return {
            boundary: this.boundaryInfo,
            dangerId: this.worldId,
            eligibleTargetList: this.eligibleTargetList,
            eligibleZoneList: this.eligibleZoneList,
            dangerOps: this.dangerOps,
            executor: this.executor,
            executables: this.executor.executables.sort((a, b) => a.name.localeCompare(b.name)),
            hasSave: this.hasSave,
            hasSourcing: this.hasSourcing,
            hasTargeting: this.hasTargeting,
            includesIncludeRandomTrigger: this.triggerZones.find(zn => zn.enabled && zn.hasManualEvent && zn.trigger.random) ? true : false,
            locked: this.locked,
            randomTitle: game.i18n.localize("DANGERZONE.scene.random-trigger.label"),
            saveList: this.saveList,
            sceneId: this.sceneId,
            sourceList: this.sourceList,
            targetList: this.targetList,
            triggerZones: this.triggerZones,
            worldZoneOps: this.worldZoneOps,
            zoneId: this.zoneId,
            zoneOps: this.zoneOps,
            tabs: this._prepareTabs("sheet")
        }
    }
    
    /*******           custom            ********/

    /**         GETTERS         **/

    get hasExecutor(){
        return Object.keys(this.executor).length ? true : false
    }

    get boundary(){
        return this.executor.boundary
    }

    get boundaryInfo(){
        return this.boundary ? `x: ${this.boundary.A.x} y: ${this.boundary.A.y} bottom: ${this.boundary.bottomIsInfinite ? '&infin;' : this.boundary.bottom} to x: ${this.boundary.B.x} y: ${this.boundary.B.y} top: ${this.boundary.topIsInfinite ? '&infin;' : this.boundary.top}` : '&nbsp;'//game.i18n.localize("DANGERZONE.executor-form.boundary.none.label")
    }

    get control(){
        return ui.controls?.controls[dangerZone.ID]?.tools?.executor
    }

    get currentTab(){
        if(this.element) return this.element.querySelector('.active.tab').getAttribute('data-tab') 
    }

    get dangerOps(){
        return this.zones.filter(z => z.scene.isPseudoZone).reduce((obj, a) => {obj[a.id] = a.title; return obj;}, {})
    }

    get worldId(){
        return this.zone.scene.dangerId ? this.zone.scene.dangerId : ''
    }

    get eligibleTargetList(){
        return (this.hasExecutor && this.executor.eligibleTargets.length) ? this.executor.eligibleTargets.map(t => t.name).join(', ') : '&nbsp;'// game.i18n.localize("DANGERZONE.executor-form.eligible.none.label")
    }

    get eligibleZoneList(){
        return (this.hasExecutor && this.executor.zoneEligibleTokens.length) ? this.executor.zoneEligibleTokens.map(t => t.name).join(', ') : '&nbsp;'// game.i18n.localize("DANGERZONE.executor-form.zone.none.label")
    }

    get firstZone(){
        return this.hasZones ? this.zones[0] : {}
    }

    get hasSave(){
        return this.executor?.hasSave ? true : false
    }

    get hasSaveFails(){
        return (this.hasExecutor && this.executor.data.hasFails) ? true : false
    }

    get hasSaveSuccesses(){
        return (this.hasExecutor && this.executor.data.hasSuccesses) ? true : false
    }

    get hasSources(){
        return (this.hasExecutor && this.executor.sources.length) ? true : false
    }

    get hasSourcing(){
        return this.executor?.hasSourcing ? true : false
    }

    get hasTargeting(){
        return this.executor.hasTargeting ? true : false
    }

    get hasTargets(){
        return (this.hasExecutor && this.executor.targets.length) ? true : false
    }

    get hasZones(){
        return this.zones.length ? true : false
    }

    get executorOptions(){
        return {
            boundary: this.locked.boundary ? this.boundary  : false,
            sources: this.locked.source ? this.executor.sources : [],
            save: {
                failed: this.locked.saves ? this.executor.saveFailed : [],
                succeeded:  this.locked.saves ? this.executor.saveSucceeded : []
            },
            targets: this.locked.target ? this.executor.targets : []
        }
    }

    get saveList(){
        return (this.hasSaveFails || this.hasSaveSuccesses) ? this.executor.saveSucceeded.map(t => t.name + ' <i class="fas fa-thumbs-up"></i>').concat(this.executor.saveFailed.map(t => t.name + ' <i class="fas fa-thumbs-down"></i>' )).concat(this.executor.targets.filter(t=> !this.executor.saveFailed.find(s=>s.id === t.id) && !this.executor.saveSucceeded.find(s=>s.id === t.id) ).map(t => t.name + ' <i class="fas fa-question"></i>')).join(', ') : '&nbsp;'//game.i18n.localize("DANGERZONE.executor-form.save.none.label")
    }

    get scene(){
        return this.sceneId ? game.scenes.get(this.sceneId) : {}
    }

    get sourceList(){
        return this.hasSources ? this.executor.sources.map(t => t.name).join(', ') : '&nbsp;'//game.i18n.localize("DANGERZONE.executor-form.source.none.label")
    }

    get targetList(){
        return this.hasTargets ? this.executor.targets.map(t => t.name).join(', ') : '&nbsp;'//game.i18n.localize("DANGERZONE.executor-form.targets.none.label")
    }

    get triggerZones(){
       return this.zones.filter(z => z.danger && z.hasEvents && (z.enabled || z.hasAutomatedEvent) && !z.scene.isPseudoZone).sort((a, b) => { return a.title < b.title ? -1 : (a.title > b.title ? 1 : 0)})
    }

    get userTargets(){
        return Array.from(game.user.targets.map(t=> t.document))
    }

    get worldZoneOps(){
        return this.zones.filter(z => z.danger.hasGlobalZone && !z.scene.isPseudoZone && z.scene.dangerId).reduce((obj, a) => {obj[a.id] = a.title; return obj;}, {})
    }

    get visible(){
        return CONTROLTRIGGERS.visible
    }

    get zoneOps(){
        return this.zones.filter(z => !z.scene.dangerId).reduce((obj, a) => {obj[a.id] = a.title; return obj;}, {})
    }

    get zone(){
        return this.zoneId ? this.zones.find(z => z.id === this.zoneId) : {}
    }

    /**         STATIC PRIVATE METHODS         **/
    /**v13
     * trigger a zone .
     * @this {ApplicationV2}
     * @param {SubmitEvent} event         The pointer event.
    */
    static async #triggerZone(event) {
        event.preventDefault();
        const data = getEventData(event)
        await triggerManager.manualTrigger({scene: this.sceneId, dangerId: data.targetId, zone: data.parentId, event: event, force: data.target.type === 'button' ? false : true});
    }

   /************ PRIVATE METHODS  ***************/
   _getExecutable(event){
        const data = getEventData(event)
        data['executable'] = data.parentId ? this.executor.executable[data.parentId] : {}
        return data
    }

    _getEventIds(event){
        if(this.sceneId !== canvas.scene?.id || !canvas.scene?.grid?.type) return false
        const data = getEventData(event)
        const obj = {
            zoneId: data.parentId ?? this.zoneId,
            dangerId: data.parentId ? data.targetId : this.worldId
        }
        return (!obj.zoneId || obj.zoneId === 'random') ? false : obj
    }
        
    /**v13
     * 
     */
    static #boundaryClear(event){
        this.executor.clearBoundary({clearTargets: !this.locked.target, clearLocation: !this.locked.boundary})
        this.refreshBoundary();  
    }
    
    /**v13
     * 
     */
    static #boundaryHighlight(event){
        this.executor.highlightBoundary(true);   
    }
    
    /**v13
     * 
     */
    static async #boundaryPrompt(event){
        await this.executor.promptBoundary({clearTargets: !this.locked.target, clearLocation: !this.locked.boundary, highlight: true})
        this.refreshBoundary(); 
    }    
    
    /**v13
     * 
     */
    static async #boundaryRandom(event){
        await this.executor.randomBoundary({clearTargets: !this.locked.target, clearLocation: !this.locked.boundary, highlight: true})
        this.refreshBoundary();
    }    
    
    /**v13
     * 
     */
    static async #boundaryTarget(event){
        await this.executor.updateLocation(this.userTargets?.[0], {clearTargets: !this.locked.target, highlight: true});
        this.refreshBoundary();  
    }    

    /**v13
     * 
    */
    static #boundaryEligibleFail(event){
        this.executor.insertSaveFailed(this.executor.eligibleTargets);
        this.executor.updateSaveSucceeded(this.executor.saveSucceeded.filter(s => !this.executor.eligibleTargets.find(f => f.id === s.id)));
        this.drawSaves();
    }

    /**v13
     * 
     */
    static #boundaryEligibleHighlight(event){
        canvas.tokens.setTargets(this.executor.eligibleTargets.map(t => t.id), {mode: 'replace'});    
    }

    /**v13
     * 
    */
    static #boundaryEligibleSucceed(event){
        this.executor.insertSaveSucceeded(this.executor.eligibleTargets);
        this.executor.updateSaveFailed(this.executor.saveFailed.filter(s => !this.executor.eligibleTargets.find(f => f.id === s.id)));
        this.drawSaves();
    }

    /**v13
     * 
    */
    static async #boundaryEligibleRefresh(event){
        await this.refreshZone();
        this.drawSaves();
    }

    /**v13
     * 
     */
    static #editDanger(event){
        new DangerForm(this.zone.dangerId, this).render(true);    
    }

    /**v13
     * 
    */
    static #editZone(event){
       new ZoneForm(this, this.zoneId, this.sceneId, this.worldId).render(true);   
    }


    /**v13
     * context menu launch zone form
     * @this {ApplicationV2}
     * @param {SubmitEvent} event         The pointer event.
    */
    #handleRightClick(event){
        const data = this._getEventIds(event)
        if(!data) return
        new ZoneForm(this, data.zoneId, this.sceneId, data.dangerId).render(true);
    }

    /**v13
     * remove highlight from a zone
     * @this {ApplicationV2}
     * @param {SubmitEvent} event         The pointer event.
    */
    #hideZoneHighlight(event){
        const data = this._getEventIds(event)
        if(!data) return
        dangerZoneDimensions.destroyHighlightZone(data.zoneId, '', data.dangerId);
    }

    /**v13
     * 
     */
    static async #play(event){
        const data = this._getExecutable(event)
        await data.executable.play()
        if(data.parentId==='save') this.drawSaves();
    }

    /**v13
     * 
    */
    static async #playZone(event){
        this.executor.newPlan();
        await this.executor.play();
        this.drawBoundary();
    }

    /**v13
     * 
    */
    static #saveAddFail(event){
        this.executor.insertSaveFailed(this.userTargets);
        this.executor.updateSaveSucceeded(this.executor.saveSucceeded.filter(s => !this.userTargets.find(f => f.id === s.id)));
        this.drawSaves();
    }

    /**v13
     * 
    */
    static #saveAddSuccess(event){
        this.executor.insertSaveSucceeded(this.userTargets);
        this.executor.updateSaveFailed(this.executor.saveFailed.filter(s => !this.userTargets.find(f => f.id === s.id)));
        this.drawSaves();
    }

    /**v13
     * 
    */
    static #saveClear(event){
        this.executor.clearSaveFailed();
        this.executor.clearSaveSucceeded();
        this.drawSaves();
    }

    /**v13
     * 
     */
    static #saveHighlight(event){
        canvas.tokens.setTargets(this.executor.saveSucceeded.map(t => t.id).concat(this.executor.saveFailed.map(t => t.id)));
    }

    /**v13
     * highlight a zone
     * @this {ApplicationV2}
     * @param {SubmitEvent} event         The pointer event.
    */
    #showZoneHighlight(event){
        const data = this._getEventIds(event)
        if(!data) return
        dangerZoneDimensions.addHighlightZone(data.zoneId, this.sceneId, '', data.dangerId);
    } 

    /**v13
     * 
    */
    static #sourceAdd(event){
        this.executor.insertSources(this.userTargets);
        this.drawSources();
    }

    /**v13
     * 
    */
    static #sourceClear(event){
        this.executor.clearSources();
        this.drawSources();
    }
    
    /**v13
     * 
    */
    static #sourceFail(event){
        this.executor.insertSaveFailed(this.executor.sources);
        this.executor.updateSaveSucceeded(this.executor.saveSucceeded.filter(s => !this.executor.sources.find(f => f.id === s.id)));
        this.drawSources();
    }

    /**v13
     * 
     */
    static #sourceHighlight(event){
        canvas.tokens.setTargets(this.executor.sources.map(t => t.id))
    }

    /**v13
     * 
    */
    static #sourceReplace(event){
        this.executor.updateSources(this.userTargets);
        this.drawSources();
    }

    /**v13
     * 
    */
    static #sourceSucceed(event){
        this.executor.insertSaveSucceeded(this.executor.sources);
        this.executor.updateSaveFailed(this.executor.saveFailed.filter(s => !this.executor.sources.find(f => f.id === s.id)));
        this.drawSources();
    }

    /**v13
     * 
     */
    static async #stop(event){        
        const data = this._getExecutable(event)
         await data.executable.stop()
    }

    /**v13
     * 
     */
    static #targetAdd(event){
        this.executor.insertTargets(this.userTargets);
        this.drawTargets();
    }

    /**v13
     * 
     */
    static #targetBoundaryEligible(event){
        this.executor.insertTargets(this.executor.eligibleTargets);
        this.drawTargets();
    }
    /**v13
     * 
     */
    static #targetClear(event){
        this.executor.clearTargets();
        this.drawTargets();
    }

    /**v13
     * 
     */
    static #targetFail(event){
        this.executor.insertSaveFailed(this.executor.targets);
        this.executor.updateSaveSucceeded(this.executor.saveSucceeded.filter(s => !this.executor.targets.find(f => f.id === s.id)));
        this.drawTargets();
    }

    /**v13
     * 
     */
    static #targetHighlight(event){
        canvas.tokens.setTargets(this.executor.targets.map(t => t.id));
    }

    /**v13
     * 
     */
    static #targetRandom(event){
        this.executor.randomTarget();
        this.drawTargets();
    }

    /**v13
     * 
     */
    static #targetReplace(event){
        this.executor.updateTargets(this.userTargets);
        this.drawTargets();
    }

    /**v13
     * 
     */
    static #targetSucceed(event){
        this.executor.insertSaveSucceeded(this.executor.targets);
        this.executor.updateSaveFailed(this.executor.saveFailed.filter(s => !this.executor.targets.find(f => f.id === s.id)));
        this.drawTargets();
    }

    /**v13
     * 
     */
    static #targetZone(event){
        this.executor.insertTargets(this.executor.zoneEligibleTokens);
        this.drawTargets();
    }

    /**v13
     * 
    */
    static #toggleLock(event){
        const data = getEventData(event)
        const icon = data.target.firstChild
        if(this.locked[data.targetId]){
            icon.classList.add('fa-unlock')
            icon.classList.remove('fa-lock')
        } else {
            icon.classList.remove('fa-unlock')
            icon.classList.add('fa-lock')
        }
        this.locked[data.targetId] = !this.locked[data.targetId]
    }

    /**v13
     * 
    */
    static async #wipe(event){
        const data = this._getExecutable(event)
        await data.executable.wipeType()
    }

    /**v13
     * 
    */
    static #zoneFail(event){
        this.executor.insertSaveFailed(this.executor.zoneEligibleTokens);
        this.executor.updateSaveSucceeded(this.executor.saveSucceeded.filter(s => !this.executor.zoneEligibleTokens.find(f => f.id === s.id)));
        this.drawSaves();
    }


    /**v13
     * 
    */
    static #zoneHighlight(event){
        if(this.zoneId) this.zone.highlightZone();
    }

    /**v13
     * 
    */
    static async #zoneRefresh(event){
        await this.refreshZone();
    }

    /**v13
     * 
    */
    static #zoneSucceed(event){
        this.executor.insertSaveSucceeded(this.executor.zoneEligibleTokens);
        this.executor.updateSaveFailed(this.executor.saveFailed.filter(s => !this.executor.zoneEligibleTokens.find(f => f.id === s.id)));
        this.drawSaves();
    }

    /**v13
     * 
     */
    async #zoneUpdateRefresh(event){
        this.zoneId = this.element.querySelector(`[data-action="zone"]`).value;
        await this.refresh({full:true, force: false})
    }

    /**         METHODS         **/

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        this.element.querySelector(`[data-action="zone"]`).addEventListener("change", (event => {this.#zoneUpdateRefresh(event)}))
        this.element.querySelectorAll(`[data-action="trigger"]`).forEach((el) => {
            el.addEventListener("mouseenter", (event => {this.#showZoneHighlight(event)}))
            el.addEventListener("mouseleave", (event => {this.#hideZoneHighlight(event)}))
            el.addEventListener("contextmenu", (event => {this.#handleRightClick(event)}))
        })
    }

    draw(elementId, obj, setPosition = false){
        const html = document.getElementById(elementId)
        if(html) {
            html.innerHTML = obj;
            if(setPosition) this.setPosition()
        }
    }

    drawBoundary(){
        this.draw(`dz-boundary`, this.boundaryInfo, false);
        this.drawTargets();
    }

    drawBoundaryEligible(){
        this.draw(`dz-eligible-target-list`, this.eligibleTargetList, true);
    }

    drawSaves(){
        this.draw(`dz-save-list`, this.saveList, true);
        this._handleSuppress()
    }

    drawSources(){
        this.draw(`dz-source-list`, this.sourceList, true);
        this._handleSuppress()
    }

    drawTargets(){
        this.draw(`dz-targets-list`, this.targetList, false);
        this.drawSaves();
    }

    drawZoneEligible(){
        this.draw(`dz-eligible-zone-list`, this.eligibleZoneList, true);
    }

    /**v13
     * sets the color for the icons on each executable to red or non-red
     */
    _handleSuppress(){
        function color(obj, cl, red = false){
            obj.querySelectorAll(cl).forEach((el) =>{
                red ? el.classList.add('warning') : el.classList.remove('warning')
            })
        }

        this.element.querySelectorAll('.dz-executable-list > li').forEach((ex) => {
            let play = true;
            const tu = ex.querySelector('i.fa-thumbs-up'); 
            const td = ex.querySelector('i.fa-thumbs-down');
            if(ex.querySelector('.dzex-or-source') && !this.hasSources ){
                if(!this.hasTargets ){
                    play = false; 
                    color(ex,'i.fa-crosshairs', true); 
                    color(ex,'i.fa-dragon', true)
                } else{
                    play = false; 
                    color(ex,'i.fa-crosshairs'); 
                    color(ex,'i.fa-dragon', true)
                }
            } else if (ex.querySelector('i.fa-crosshairs') && !this.hasTargets){
                play = false; 
                color(ex,'i.fa-crosshairs', true); 
                color(ex,'i.fa-dragon')
            } 
            else {
                color(ex,'i.fa-crosshairs'); 
                color(ex,'i.fa-dragon');
            }
            
            if(!this.boundary && ex.querySelector('i.fa-expand')){
                play = false; 
                color(ex,'i.fa-expand', true)
            } else {
                color(ex,'i.fa-expand')
            } 
            
            if((tu && td && !this.hasSaveFails && !this.hasSaveSuccesses) || (td && !tu && !this.hasSaveFails) || (tu && !td && !this.hasSaveSuccesses)) play = false; 
            (td && !this.hasSaveFails) ? color(ex,'i.fa-thumbs-down', true) : color(ex,'i.fa-thumbs-down', false);
            (tu && !this.hasSaveSuccesses) ? color(ex,'i.fa-thumbs-up', true) : color(ex,'i.fa-thumbs-up', false);

            if(ex.id !== 'dz-zoneId'){
                if(play){
                    ex.querySelector('.no-play').classList.add('dz-hidden') 
                    ex.querySelector('[data-action="play"]').classList.remove('dz-hidden') 
                } else {
                    ex.querySelector('.no-play').classList.remove('dz-hidden') 
                    ex.querySelector('[data-action="play"]').classList.add('dz-hidden') 
                } 
            }
        });
    }

    /**v13
     * Called when executor is intended to be opened on scene
     * @param {string} sceneId 
     * @param {string} zoneId
     * @param {Boolean} forceRender     renders executor on scene if not already rendered.
     */
    async renderOnScene(sceneId = canvas.scene.id, zoneId, forceRender = false){
        if(!forceRender && !this.rendered) return
        this.sceneId = sceneId;
        this.zoneId = zoneId;
        if(game.user.isActiveGM && this.scene.active && this.scene.grid.type){
            this.zones = dangerZone.getExtendedZones(this.sceneId);
            if(this.hasZones){
                if(!this.zoneId) this.zoneId = this.firstZone.id;
                this.setVisible(true);
                await this.refresh({force: forceRender, full:true});
            }
        }
    }

    /**v13
     * 
     * @param {object} options    
     *         full: runs the _setExecutor method
     *         force: renders executor if not already rendered  
     */
    async refresh(options = {}){
        const tab = this.currentTab
        if(options.full) await this._setExecutor()
        await this.render(options.force);
        if(tab) this.changeTab(tab, "sheet", {force: true})
    }

    refreshBoundary(){
        this.drawSaves();
        this.drawBoundary();
        this.drawBoundaryEligible();
    }

    async refreshZone(){
        await this.executor.setZone();
        if(this.rendered){
            this.drawZoneEligible();
            this.drawBoundaryEligible();
        }
    }

    async _setExecutor(){
        this.executor = this.zoneId ? await this.zone.executor(this.executorOptions): {}
        await this.refreshZone();
    }

    setVisible(isVisible = true){
        CONTROLTRIGGERS.visible = isVisible
        this.control.active = CONTROLTRIGGERS.visible
    }
    
}