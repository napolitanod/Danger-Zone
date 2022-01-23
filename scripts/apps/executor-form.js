import {dangerZone} from "../danger-zone.js";
import {dangerZoneDimensions} from "./dimensions.js";
import {DangerForm} from './danger-form.js';

export class ExecutorForm extends FormApplication {
    constructor(sceneId, executor = {}, zones, ...args) {
      super(...args);
      this.sceneId = sceneId,
      this.zoneId = executor?.zone?.id ? executor.zone.id : '',
      this.zones = zones ? zones : dangerZone.getExecutorZones(sceneId),
      this.executor = executor,
      this.boundaryDrawSaves = true,
      this.boundaryRefreshZone = true;

      this._setHook()
    }

    get hasExecutor(){
        return Object.keys(this.executor).length ? true : false
    }

    get boundary(){
        return this.executor.boundary
    }

    get boundaryInfo(){
        return this.boundary ? `START x: ${this.boundary.A.x} y: ${this.boundary.A.y} bottom: ${this.boundary.A.z}<br>END&nbsp;&nbsp;&nbsp;&nbsp;x: ${this.boundary.B.x} y: ${this.boundary.B.y} top: ${this.boundary.B.z}` : game.i18n.localize("DANGERZONE.executor-form.boundary.none.label")
    }

    get worldId(){
        return this.zone.scene.dangerId ? this.zone.scene.dangerId : ''
    }

    get eligibleTargetList(){
        return (this.hasExecutor && this.executor.eligibleTargets.length) ? this.executor.eligibleTargets.map(t => t.data.name).join(', ') : game.i18n.localize("DANGERZONE.executor-form.eligible.none.label")
    }

    get eligibleZoneList(){
        return (this.hasExecutor && this.executor.zoneEligibleTokens.length) ? this.executor.zoneEligibleTokens.map(t => t.data.name).join(', ') : game.i18n.localize("DANGERZONE.executor-form.zone.none.label")
    }

    get hasSave(){
        return (this.hasExecutor && this.executor.executable.save) ? true : false
    }

    get hasSourcing(){
        return (this.hasExecutor && this.executor.hasSourcing) ? true : false
    }

    get hasTargeting(){
        return (this.hasExecutor && (this.hasSave || this.executor.executables.find(e => e.hasTokenScope))) ? true : false
    }

    get saveList(){
        return (this.hasExecutor && (this.executor.data.hasFails || this.executor.data.hasSuccesses)) ? this.executor.saveSucceeded.map(t => t.data.name + ' <i class="fas fa-thumbs-up"></i>').concat(this.executor.saveFailed.map(t => t.data.name + ' <i class="fas fa-thumbs-down"></i>' )).concat(this.executor.targets.filter(t=> !this.executor.saveFailed.find(s=>s.id === t.id) && !this.executor.saveSucceeded.find(s=>s.id === t.id) ).map(t => t.data.name + ' <i class="fas fa-question"></i>')).join(', ') : game.i18n.localize("DANGERZONE.executor-form.save.none.label")
    }

    get scene(){
        return this.sceneId ? game.scenes.get(this.sceneId) : {}
    }

    get sourceList(){
        return (this.hasExecutor && this.executor.sources.length) ? this.executor.sources.map(t => t.data.name).join(', ') : game.i18n.localize("DANGERZONE.executor-form.source.none.label")
    }

    get targetList(){
        return (this.hasExecutor && this.executor.targets.length) ? this.executor.targets.map(t => t.data.name).join(', ') : game.i18n.localize("DANGERZONE.executor-form.targets.none.label")
    }

    get userTargets(){
        return Array.from(game.user.targets)
    }

    get zoneOps(){
        return this.zones.reduce((obj, a) => {obj[a.id] = a.title; return obj;}, {})
    }

    get zone(){
        return this.zoneId ? this.zones.find(z => z.id === this.zoneId) : {}
    }

    static get defaultOptions(){    
        return foundry.utils.mergeObject(super.defaultOptions, {
            title : game.i18n.localize("DANGERZONE.executor-form.form-name"),
            id : "danger-zone-executor",
            classes: ["sheet","danger-zone-executor"],
            template : dangerZone.TEMPLATES.DANGERZONEEXECUTOR,
            width : 305,
            height : "auto",
            closeOnSubmit: false
            })
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.on('click', "[data-action]", this._handleButtonClick.bind(this));
        html.on('change', "[data-action]", this._handleChange.bind(this));
        html.on('mouseenter', "#dz-zoneId", this._showZoneHighlight.bind(this));
        html.on('mouseleave', "#dz-zoneId", this._hideZoneHighlight.bind(this));
    }

    drawBoundary(){
        document.getElementById(`dz-boundary`).innerHTML = this.boundaryInfo
        this.drawTargets();
    }

    drawBoundaryEligible(){
        document.getElementById(`dz-eligible-target-list`).innerHTML = this.eligibleTargetList
    }

    drawSaves(){
        document.getElementById(`dz-save-list`).innerHTML = this.saveList
    }

    drawSources(){
        document.getElementById(`dz-source-list`).innerHTML = this.sourceList
    }

    drawTargets(){
        document.getElementById(`dz-targets-list`).innerHTML = this.targetList
        this.drawSaves();
    }

    drawZoneEligible(){
        document.getElementById(`dz-eligible-zone-list`).innerHTML = this.eligibleZoneList
    }

    getData(){
        return {
            boundary: this.boundaryInfo,
            eligibleTargetList: this.eligibleTargetList,
            eligibleZoneList: this.eligibleZoneList,
            executor: this.executor,
            executables: this.executor.executables.sort((a, b) => { return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0)}),
            hasSave: this.hasSave,
            hasSourcing: this.hasSourcing,
            hasTargeting: this.hasTargeting,
            saveList: this.saveList,
            sceneId: this.sceneId,
            sourceList: this.sourceList,
            targetList: this.targetList,
            zoneId: this.zoneId,
            zoneOps: this.zoneOps
        }
    }

    async _handleButtonClick(event) {
        if(!this.hasExecutor) return
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;
        const executableId = clickedElement.parents('[data-id]')?.data()?.id;
        const executable = executableId ? this.executor.executable[executableId] : {}
        switch (action) {
            case 'edit-danger':
                new DangerForm(this.zone.type, this).render(true);
                break;
            case 'play':
                await executable.play()
                if(executableId==='save') this.drawSaves();
                break;
            case 'play-zone':
                this.executor.newPlan();
                await this.executor.play();
                this.drawBoundary();
                break;
            case 'stop':
                await executable.stop()
                break;
            case 'wipe':
                await executable.wipeType()
                break;
            case 'add-target':
            case 'clear-target':
            case 'random-target':
            case 'replace-target':
            case 'target-boundary-eligible':
            case 'target-zone':
                this._handleTarget(action)
                this.drawTargets();
                break;
            case 'add-source':
            case 'clear-source':
            case 'replace-source':
                this._handleSource(action);
                this.drawSources();
                break;
            case 'clear-boundary':
            case 'highlight-boundary':
            case 'prompt-boundary':
            case 'random-boundary':
            case 'target-boundary':
                await this._handleBoundary(action)
                this.refreshBoundary();
                this.executor.highlightBoundary(true);
                break;
            case 'add-save-success':
            case 'add-save-fail':
            case 'clear-saves':
            case 'fail-boundary-eligible':
            case 'succeed-boundary-eligible':
            case 'succeed-zone':
            case 'fail-zone':
            case 'succeed-zone':
                this._handleSaves(action)
                this.drawSaves();
                break;
            case 'refresh-boundary-eligible':
            case 'refresh-zone':
                await this.refreshZone();
                break;
            case 'highlight-zone':
                if(this.zoneId) this.zone.highlightZone();
                break;
            default: break
        }
        dangerZone.log(false, 'Executor Form Invoked', {executor: this, executableId: executableId})
    }

    async _handleChange(event) {
        const action = $(event.currentTarget).data().action, val = event.currentTarget.value, checked = event.currentTarget.checked;
        switch (action) {
          case 'zone': 
            this.zoneId = val;
            await this.setExecutor();
            await this.refresh(false);
            break;
        }
    }

    async _handleBoundary(action){
        if (action !== 'highlight-boundary' && this.boundaryRefreshZone) await this.refreshZone()
        switch(action){
            case 'clear-boundary':
                this.executor.clearBoundary({clearTargets: true});
                break;
            case 'prompt-boundary':
                await this.executor.promptBoundary({clearTargets: true, highlight: false});
                break;
            case 'random-boundary':
                await this.executor.randomBoundary({clearTargets: true, highlight: false});
                break;
            case 'target-boundary':
                await this.executor.updateLocation(this.userTargets.first()?.data, {clearTargets: true, highlight: false});
                break
        }
    }

    _handleSaves(action){
        switch(action){
            case 'add-save-fail':
                this.executor.insertSaveFailed(this.userTargets);
                this.executor.updateSaveSucceeded(this.executor.saveSucceeded.filter(s => !this.userTargets.find(f => f.id === s.id)));
                break;
            case 'add-save-success':
                this.executor.insertSaveSucceeded(this.userTargets);
                this.executor.updateSaveFailed(this.executor.saveFailed.filter(s => !this.userTargets.find(f => f.id === s.id)));
                break;
            case 'clear-saves':
                this.executor.clearSaveFailed();
                this.executor.clearSaveSucceeded();
                break;
            case 'fail-boundary-eligible':
                this.executor.insertSaveFailed(this.executor.eligibleTargets);
                this.executor.updateSaveSucceeded(this.executor.saveSucceeded.filter(s => !this.executor.eligibleTargets.find(f => f.id === s.id)));
                break;
            case 'succeed-boundary-eligible':
                this.executor.insertSaveSucceeded(this.executor.eligibleTargets);
                this.executor.updateSaveFailed(this.executor.saveFailed.filter(s => !this.executor.eligibleTargets.find(f => f.id === s.id)));
                break;
            case 'fail-zone':
                this.executor.insertSaveFailed(this.executor.zoneEligibleTokens);
                this.executor.updateSaveSucceeded(this.executor.saveSucceeded.filter(s => !this.executor.zoneEligibleTokens.find(f => f.id === s.id)));
                break;
            case 'succeed-zone':
                this.executor.insertSaveSucceeded(this.executor.zoneEligibleTokens);
                this.executor.updateSaveFailed(this.executor.saveFailed.filter(s => !this.executor.zoneEligibleTokens.find(f => f.id === s.id)));
                break;
        }
    }

    _handleSource(action){
        switch(action) {
            case 'add-source':
                this.executor.insertSources(this.userTargets);
                break;
            case 'clear-source':
                this.executor.clearSources();
                break;
            case 'replace-source':
                this.executor.updateSources(this.userTargets);
                break;
        } 
    }

    _handleTarget(action){
        switch(action) {
            case 'add-target':
                this.executor.insertTargets(this.userTargets);
                break;
            case 'clear-target':
                this.executor.clearTargets();
                break;
            case 'random-target':
                this.executor.randomTarget();
                break;
            case 'replace-target':
                this.executor.updateTargets(this.userTargets);
                break;
            case 'target-boundary-eligible':
                this.executor.insertTargets(this.executor.eligibleTargets);
                break;
            case 'target-zone':
                this.executor.insertTargets(this.executor.zoneEligibleTokens);
                break;
        } 
    }

    async refresh(full = true){
        if(full) await this.setExecutor()
        this.render();
    }

    refreshBoundary(){
        if (this.boundaryDrawSaves) this.drawSaves();
        this.drawBoundary();
        this.drawBoundaryEligible();
    }

    async refreshZone(){
        await this.executor.setZone();
        this.drawZoneEligible();
        this.drawBoundaryEligible();
    }

    async _setHook(){
        Hooks.once("canvasReady", async(app) => {
            console.log(app)
            if(this.rendered && app.scene?.id){
               const rendered = await this.renderOnScene(app.scene.id);
               if(!rendered) this.close();
            }
        });
    }

    _showZoneHighlight(){
        if(this.zoneId && this.sceneId === canvas.scene?.id && canvas.scene?.data?.gridType){
            dangerZoneDimensions.addHighlightZone(this.zoneId, this.sceneId, '', this.worldId);
        }
    } 
    
    _hideZoneHighlight(){
        if(this.zoneId && this.sceneId === canvas.scene?.id && canvas.scene?.data?.gridType){
            dangerZoneDimensions.destroyHighlightZone(this.zoneId, '', this.worldId);
        }
    }

    async setExecutor(){
        this.executor = this.zoneId ? await this.zone.executor(): {}
        await this.refreshZone();
    }
    
    async renderOnScene(sceneId, zoneId, zones){
        this.sceneId = sceneId ? sceneId : canvas.scene.id;
        if(game.user.isGM){
            this._setHook()
            if(this.scene.active && this.scene.data.gridType){
                this.zones = zones ? zones : dangerZone.getExecutorZones(this.sceneId);
                if(this.zones.length){
                    this.executor = zoneId ? await this.setExecutor() : await this.zones[0].executor();
                    this.zoneId = zoneId ? zoneId : this.executor.zone?.id;
                    this.render(true);
                    return true
                }
            } 
        }
    }
    
}