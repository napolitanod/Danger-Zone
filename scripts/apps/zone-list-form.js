import {dangerZone} from '../danger-zone.js';
import {dangerZoneDimensions} from './dimensions.js';
import {DANGERZONECONFIG, sceneOps, regionOps} from './constants.js';
import {getEventData} from './helpers.js';
import {ZoneForm} from './zone-form.js';

export class ZoneListForm extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(app, sceneId, ...args) {
      super(...args);
      this.parent = app,
      this.sceneId = sceneId;
  }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: [],
    id : DANGERZONECONFIG.ID.FORM.ZONELIST,
    actions: {
      'add': ZoneListForm.#add,
      'copy': ZoneListForm.#copy,
      'delete': ZoneListForm.#delete,
      'edit': ZoneListForm.#edit
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    position: {
      width : 800
    },
    tag: "form",
    window: {
      contentClasses: ["danger-zone-type-form", "sheet"],
      title : DANGERZONECONFIG.LABEL.ZONELIST,
      icon: DANGERZONECONFIG.ICON.ZONELIST
    }
  };

  /** @override */
  static PARTS = {
    body: {
      classes: ["standard-form"],
      template: DANGERZONECONFIG.TEMPLATE.ZONELIST, 
      scrollable: [""]
    }
  };

    /** @override */
  async _prepareContext() {
    return {
          dangerZones: dangerZone.getAllZonesFromScene(this.sceneId, {enabled: false, typeRequired: false, triggerRequired: false}).sort((a, b) => a.title.localeCompare(b.title)),
          sceneId: this.sceneId,
          regions: regionOps(this.sceneId)
      }
  }

  /*******           custom            ********/

  /**         STATIC PRIVATE METHODS         **/

  /**v13
   * Adds a new zone to scene
   */
  static async #add(event){
    new ZoneForm(this, '', this.sceneId,'').render(true);
    this.render(true);
  }

  /**v13
   * Copys a zone to scene
   */
  static async #copy(event){
    new ZoneCopyForm(this, this.sceneId, '').render(true);
  }

  /**v13
   * Deletes a zone on scene
   */
  static async #delete(event){
    const data = getEventData(event)
    const choice = await foundry.applications.api.DialogV2.confirm({
      content: `${game.i18n.localize("DANGERZONE.delete")} ${data.parent.dataset.name}?`,
      rejectClose: false,
      modal: true
    });
    if(choice){
      await dangerZone.deleteZoneFromScene(data.parentId, this.sceneId)
      this.render(true);
    }
  }

   /**v13
   * Edits a zone on scene
   */
  static async #edit(event){
    const data = getEventData(event)
    new ZoneForm(this, data.parentId, this.sceneId, '').render(true);
  }

  
  /**         PRIVATE METHODS         **/

  /**v13
   * highlights the zone boundary for the hovered zone
   */
  #showZoneHighlight(event){
    const data = getEventData(event)
    const zoneId = data.parentId;
    if(zoneId && this.sceneId === canvas.scene?.id && canvas.scene?.grid?.type){
        dangerZoneDimensions.addHighlightZone(zoneId, this.sceneId);
    }
  } 

  
  /**v13
   * remove highlight of the zone boundary for the hovered zone
   */
  #hideZoneHighlight(event){
    const data = getEventData(event)
    const zoneId = data.parentId;
    if(zoneId && this.sceneId === canvas.scene?.id && canvas.scene?.grid?.type){
        dangerZoneDimensions.destroyHighlightZone(zoneId);
    }
  }
  
  /**         METHODS         **/
    /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelectorAll(`[data-action="hover"]`).forEach((item) => {
        item.addEventListener("mouseenter", (event => {this.#showZoneHighlight(event)}))
        item.addEventListener("mouseleave", (event => {this.#hideZoneHighlight(event)}))
    })}

}

export class ZoneCopyForm extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {
  constructor(app, sceneId, sourceSceneId, ...args) {
    super(...args);
    this.sceneId = sceneId,
    this.sourceSceneId = sourceSceneId,
    this.parent = app;
    }

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: [],
    id : DANGERZONECONFIG.ID.FORM.ZONECOPY,
    form: {
      submitOnChange: false,
      closeOnSubmit: true,
      handler: ZoneCopyForm.#onSubmit
    },
    position: {
      width: 425
    },
    tag: "form",
    window: {
      contentClasses: ["danger-zone-record", "sheet"],
      title : DANGERZONECONFIG.LABEL.ZONECOPY,
      icon: DANGERZONECONFIG.ICON.ZONECOPY
    }
  }

  /** @override */
  static PARTS = {
    body: {
      classes: ["standard-form"],
      template: DANGERZONECONFIG.TEMPLATE.ZONECOPY, 
      scrollable: [""]
    },
    footer: {
      template: DANGERZONECONFIG.TEMPLATE.FOOTER
    }
  };

  /** @override */
  async _prepareContext() {
    return {
      sceneId: this.sceneId,
      sourceSceneId: this.sourceSceneId,
      sceneOps: sceneOps(),
      zoneOps: dangerZone.getZoneList(this.sourceSceneId),
      buttons: [{ type: "submit", icon: "fa-solid fa-floppy-disk", label: "DANGERZONE.save.label" }]
    }
  }

  /**         STATIC PRIVATE METHODS         **/

   /**v13
   * Save the copied zone.
   * @this {ApplicationV2}
   * @param {SubmitEvent} _event         The form submission event.
   * @param {HTMLFormElement} _form      The form element that was submitted.
   * @param {FormDataExtended} submitData  Processed data for the submitted form.
   */
  static async #onSubmit(_event, _form, submitData) {
    const expandedData = foundry.utils.expandObject(submitData.object);
     if(expandedData.targetSceneId && expandedData.sceneId && expandedData.zoneId){
        await dangerZone.copyZone(expandedData.sceneId, expandedData.zoneId, expandedData.targetSceneId)
      }
      if(this.parent){this.parent.render(true)}
  }

  /**v13
   * Dynamic form handling for updating zone list on scene drop down selection
   * @param {event} event 
  */
  #sceneChange(event){
    this.sourceSceneId = this.element.querySelector(`#danger-zone-copy-source-scene`).value;
    this.render(true);
  }

  /**         METHODS         **/
    /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.element.querySelector(`#danger-zone-copy-source-scene`).addEventListener("change", (event => {this.#sceneChange(event)}))
    }
}