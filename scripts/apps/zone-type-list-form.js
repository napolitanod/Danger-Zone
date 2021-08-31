import {dangerZone} from "../danger-zone.js";
import {dangerZoneType} from './zone-type.js';
import {DangerZoneTypeForm} from './zone-type-form.js'

export var lastSearch = '';

export class DangerZoneTypesForm extends FormApplication {

  static get defaultOptions(){
    const defaults = super.defaultOptions;

    const overrides = {
      title : game.i18n.localize("DANGERZONE.types-form.header.name"),
      id : "danger-zone-types",
      template : dangerZone.TEMPLATES.DANGERZONETYPESCONFIG,
      width : 600,
      height : "auto",
      closeOnSubmit: false,
      submitOnChange: true, 
      tabs:[]
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

    return mergedOptions;
  }

  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;
    const zoneTypeId = clickedElement.parents('[data-id]')?.data()?.id;
    dangerZone.log(false, 'Zone Type Button Clicked!', {action, zoneTypeId});

    switch (action) {
      case 'add-zone-type': {
          const newType = await dangerZoneType.addZoneType();
          new DangerZoneTypeForm(newType.id).render(true);
          this.refresh();
          break;
      }
      case 'edit': {
        new DangerZoneTypeForm(zoneTypeId).render(true);
        break;
      }
      case 'delete': {
        await dangerZoneType.deleteZoneType(zoneTypeId);
        this.refresh();
        break;
      }
      default:
        dangerZone.log(false, 'Invalid action detected', action);
    }
  }

  refresh() {
    this.render(true);
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    html.on('click',"#danger-zone-type-search-clear", this._clearFilter.bind(this))
    html.on('input', '#danger-zone-type-search-input', this._preFilter.bind(this))
    html.on('click', "#danger-zone-type-export-config", this.exportToJSON.bind(this))
    html.on('click', "#danger-zone-type-import-config", this.importFromJSONDialog.bind(this))
  }

  getData(options){
      return {
          dangerZoneTypes: Object.values(dangerZoneType.allDangerZoneTypes).sort((a, b) => a.name.localeCompare(b.name)),
          lastSearch: lastSearch
      }
  }

  async _updateObject(event, formData) {
    return
  }

  _preFilter(event) {
    lastSearch = event.target.value;
    this._filter();
  }

  _filter() {
    const clear = document.getElementById("danger-zone-type-search-clear");
    const searchBox = document.getElementById("danger-zone-type-search-input");

    if(lastSearch != ''){
      clear.classList.remove('hidden');
      searchBox.classList.add('outline');
    } else {
      clear.classList.add('hidden');
      searchBox.classList.remove('outline');
    }

    $("form.danger-zone-types").find(".name").each(function() {
      let label = this.innerText.toLowerCase();
      if (label.search(lastSearch.toLowerCase()) > -1) {
        $(this).closest('.type-record').show();
      } else {
        $(this).closest('.type-record').hide();
      }
    });
  }

  _clearFilter(event){
    event.preventDefault();
    document.getElementById("danger-zone-type-search-input").value = '';
    lastSearch = '';
    this._filter();
  }

  async exportToJSON() {
    saveDataToFile(JSON.stringify(dangerZoneType.allDangerZoneTypes, null, 2), "text/json", `fvtt-danger-zone-types.json`);  
  }

  async importFromJSON(json) {
    const data = JSON.parse(json);
    dangerZone.log(false, 'JSON Import Parse Complete ', data);
    let response = await dangerZoneType.importFromJSON(data); 
    dangerZone.log(false, 'Zone Types Import Complete ', response);
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

  async importFromJSONDialog() {
    const options = {
      name: "Danger Zone",
      entity: dangerZone.ID
    }
    const content = await renderTemplate("templates/apps/import-data.html", options);
    new Dialog({
      title: game.i18n.localize("DANGERZONE.import.title"),
      content: content,
      buttons: {
        import: {
          icon: '<i class="fas fa-file-import"></i>',
          label: game.i18n.localize("DANGERZONE.import.short-title"),
          callback: html => {
            const form = html.find("form")[0];
            if ( !form.data.files.length ) return ui.notifications?.error(game.i18n.localize("DANGERZONE.import.noFile"));
            readTextFromFile(form.data.files[0]).then(json => this.importFromJSON(json));
          }
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("DANGERZONE.cancel")
        }
      },
      default: "import"
    }, {
      width: 400
    }).render(true);
  }
}