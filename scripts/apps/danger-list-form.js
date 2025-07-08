import {dangerZone} from "../danger-zone.js";
import {dangerZoneType} from './zone-type.js';
import {DangerForm} from './danger-form.js';
import {DANGERZONECONFIG} from './constants.js';
import {getEventData} from './helpers.js';

export class DangerListForm extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    classes: [],
    id : DANGERZONECONFIG.ID.FORM.DANGERS,
    actions: {
      'active': DangerListForm.#worldZoneToggle,
      'add': DangerListForm.#add,
      'copy': DangerListForm.#copy,
      'searchClear': DangerListForm.#clearFilter,
      'delete': DangerListForm.#delete,
      'edit': DangerListForm.#edit,
      'export': DangerListForm.#export,
      'exportAll': DangerListForm.#exportToJSON,
      'import': DangerListForm.#importFromJSONDialog
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: true
    },
    position: {
      width : 600
    },
    tag: "form",
    window: {
      contentClasses: ["danger-zone-types"],
      title : "DANGERZONE.types-form.header.name",
      icon: DANGERZONECONFIG.ICON.DANGER
    }
  };
  
  /** @override */
  static PARTS = {
    header: {
      template: DANGERZONECONFIG.TEMPLATE.DANGERSLISTHEADER
    },
    body: {
      template: DANGERZONECONFIG.TEMPLATE.DANGERSLIST, 
      scrollable: [""]
    },
    footer: {
      template: DANGERZONECONFIG.TEMPLATE.DANGERSLISTFOOTER
    }
  };

  /** @override */
  static TABS = {};

  /** @override */
  async _prepareContext() {
      return {
          dangerZoneTypes: dangerZoneType.allDangers.sort((a, b) => a.name.localeCompare(b.name)),
          lastSearch: dangerZone.LASTSEARCH
      }
  }

  /** @override */
  _onRender(context, options) {
      super._onRender(context, options);
      this.element.querySelector(`#danger-zone-type-search-input`).addEventListener("input", (async event => {
        this.#preFilter(event)})
      );
  }

  /******* custom form actions ********/
  static async #add(event){
    const newType = await dangerZoneType.addZoneType();
    new DangerForm(newType.id, this).render(true);
    this.refresh();
  }

  static #clearFilter(event){
    event.preventDefault();
    document.getElementById("danger-zone-type-search-input").value = '';
    dangerZone.updateLastSearch('');
    this.filter();
  }

  static async #copy(event){
    const data = getEventData(event)
    const copied = await dangerZoneType.copyDanger(data.parentId)
    this.refresh();
    new DangerForm(copied, this).render(true);
  }

  static async #delete(event){
    const data = getEventData(event)
    const choice = await foundry.applications.api.DialogV2.confirm({
        content: `${game.i18n.localize("DANGERZONE.delete")} ${data.label}?`,
        rejectClose: false,
        modal: true
      });
      if(choice){
        await dangerZoneType.deleteZoneType(data.parentId);
        this.refresh();
      }
  }

  static async #edit(event){
    const data = getEventData(event)
    new DangerForm(data.parentId, this).render(true);
  }

  static async #export(event){
    const data = getEventData(event)
    await this._export(data.parentId)
  }

  static async #exportToJSON(event, id = '') {
    await this._export();  
  }

  static async #importFromJSONDialog() {
    //generate the import dialog content
    const options = {
      name: "Danger Zone",
      entity: dangerZone.ID
    }
    const content = await foundry.applications.handlebars.renderTemplate("templates/apps/import-data.hbs", options);
    
    //invoke dialog to collect the import file, then process on submit
    let choice;
    try{
        choice = await foundry.applications.api.DialogV2.prompt({
          window: {title: game.i18n.localize("DANGERZONE.import.title")},
          content: content,
          ok: {
            icon: '<i class="fas fa-file-import"></i>',
            label: game.i18n.localize("DANGERZONE.import.short-title"),
            callback: (event, button, dialog) => {
              const form = event.currentTarget.querySelector("form");
              if ( !form.data.files.length ) return ui.notifications?.error(game.i18n.localize("DANGERZONE.import.noFile"));
              foundry.utils.readTextFromFile(form.data.files[0]).then(json => this._importFromJSON(json));
            }
          }
      });  
    } catch {
      dangerZone.log(false, `No value entered.`)
    }
  }

  #preFilter(event) {
    dangerZone.updateLastSearch(event.target.value);
    this.filter();
  }

  static async #worldZoneToggle(event){
    const data = getEventData(event)
    const danger = dangerZoneType.getDanger(data.parentId);
    Object.keys(danger.options.globalZone).length ? await danger.toggleWorldZone() : await danger.activateWorldZone();
    this.refresh();
  }

  async _export(id = ''){
    foundry.utils.saveDataToFile(
      JSON.stringify(id ? {[id]: dangerZoneType._allDangers[id]} : dangerZoneType._allDangers, null, 2), 
      "text/json", 
      id ? `fvtt-danger-zone-danger-${id}.json`: `fvtt-danger-zone-dangers.json`
    );  
  }

  filter() {
    const clear = this.element.querySelector(`#danger-zone-type-search-clear`);
    const searchBox = this.element.querySelector(`#danger-zone-type-search-input`);

    if(dangerZone.LASTSEARCH != ''){
      clear.classList.remove('dz-hidden');
      searchBox.classList.add('outline');
    } else {
      clear.classList.add('dz-hidden');
      searchBox.classList.remove('outline');
    }
    this.element.querySelectorAll(".name").forEach((item) => {
      let label = item.innerText.toLowerCase();
      if (label.search(dangerZone.lastSearchLower) > -1) {
        $(item).closest('.type-record').show();
      } else {
        $(item).closest('.type-record').hide();
      }
    });
  }

  async _importFromJSON(json) {
    const data = JSON.parse(json);
    dangerZone.log(false, 'JSON Import Parse Complete ', data);
    let response = await dangerZoneType.importFromJSON(data); 
    dangerZone.log(false, 'Dangers Import Complete ', response);
    this.refresh();
    if(response) {
      ui.notifications?.info(
        game.i18n.localize("DANGERZONE.import.complete") 
        + ': ' + response.added.length + ' ' + game.i18n.localize("DANGERZONE.import.success") 
        + ', ' + response.error.length + ' ' + game.i18n.localize("DANGERZONE.import.error") 
        + ', ' + response.skipped.length + ' ' + game.i18n.localize("DANGERZONE.import.skipped")
      )
    }
    return response
  }

  refresh() {
    this.render(true);
  }

}