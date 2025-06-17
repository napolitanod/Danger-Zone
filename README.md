![all versions](https://img.shields.io/github/downloads/napolitanod/Danger-Zone/total) 
![Latest Release Download Count](https://img.shields.io/github/downloads/napolitanod/Danger-Zone/latest/module.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdanger-zone&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=danger-zone)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fdanger-zone%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/danger-zone/)

:biohazard: [Discussion and Danger Configuration Sharing on JB2A Discord server](https://discord.gg/gmd8MAPX4m) <br>
:biohazard: [Wiki and How to Use](../../wiki)  <br>
:biohazard: [Detailed Examples](../../wiki/Examples) <br>
:biohazard: [Tutorials](../../wiki/Video-Tutorials) <br>

## About
Add life to your scenes! With Danger Zone, GMs can invoke highly customizable localized effects across any region or scene, including:
* A storm where the danger of being struck by lightning is a deadly possibility.
* A crumbling building where the collapsing ceiling can injure or trap occupants.
* A twisted field of magic with portals that blink in and out of existance.
* A blessed glade offering healing to those who walk through.

<img src="https://github.com/napolitanod/Danger-Zone/blob/main/.gitImage/crumbling%20ceiling%20gif.gif" height="400">

> Here, a scene's zone is triggered at the start of the combat turn, causing the screen to shake and rubble to fall.

## What's in the module
* The ability to create dangers for use within zones.
* The ability to add zones to a scene and then associate them to a region, a danger and a trigger condition.
* The ability to activate and trigger zones through game events or with on-screen buttons. 
* The ability to sequence zone triggers so that one zone event can trigger another. 
* The ability to target tokens as part of a zone trigger so that the danger's effects interact with the targeted tokens, doing things like adding active effects, moving tokens, or add items to the token. 
* An API for accessing Danger Zone exposed functionality.
  
Fnctionality can be expanded through other Foundry modules - see the Module Integration section below.


## What's not in the module
* **!!!Does not include any video, image or audio components.!!!**
* **Gridless scenes not supported** The module currently does not extend to include gridless scenes.

## Getting Started
<img src="https://user-images.githubusercontent.com/22696153/147769650-1a095760-9c4e-4ef9-8cff-403abc049bb1.gif" height="400">

> Here, a zone is triggered by token movement using the zone aura trigger.

### 1. Create a Danger
Whether it be a lava bubble that bursts to the surface or a vent of poisonous gas, a danger defines the effect that executes within a zone. With Danger Zone, you have control over a vast array of configuration combinations for your dangers, including displaying effects, creating lights and walls, spawning tokens, executing macros, playing sounds and moving tokens.

<img src="https://github.com/napolitanod/Danger-Zone/blob/main/.gitImage/r9/dangerFilled4.JPG"  height="400">

Access the Dangers button from the Scenes right navigation area. See [Dangers](../../wiki/Dangers) for more info.

### 2. Add Zone to Scene
Like a wide lake of lava, a zone is the boundary within which dangers are generated. Each zone exists within a scene and is associated to a danger and a trigger condition. Zones may also be copied from one scene to another.

<img src="https://github.com/napolitanod/Danger-Zone/blob/main/.gitImage/r9/configureSceneZones.JPG"  height="300px">

Access zones by clicking the Danger Zone scene controls configure button. See "Danger Zone Scene Controls" below and [Zones](../../wiki/Zones) for more info.

### 3. Trigger Zone
The trigger defines the conditions under which lava bubble (danger) erupts from the lava field (zone). A trigger can be invoked either manually or as part of a defined event.

See [Triggers](../../wiki/Triggers) for more info.


## Added to Foundry

### Danger Zone Scene Controls
A Danger Zone button is added to the scene controls. Select this to access Danger Zone features for the scene, including adding, editing and triggering zones.

![image](https://github.com/user-attachments/assets/9ca06e93-ab0d-40da-8174-45e32f18db05)

Selecting the Danger Zone scene control button will launch the Zone Executor and present other scene actions. 

#### Zone Executor
**Trigger Zones Tab**: Each button is a zone in that scene and displays the icon for the danger held within. The buttons function as follows:
* Manually triggered zones
    * Zones that are active are listed individually here except for those which have the 'Randomize' enabled. 
    * All active randomized zones are grouped and only a single random button (using the Danger Zone radiation logo) is displayed for all of them. 
    * Inactive zones are not displayed.
    * Selecting a button triggers ths zone.
* Automatically triggered zones (e.g. combat turn start trigger)
  * Active zones are displayed with a blue highlight effect. Inactive are displayed without the highlight effect.
  * Selecting a button toggles it from active to inactive or vice versa.

**Executor Tab**: here all zones are availble, including world zones and all dangers. Use this tab for more control over zone targeting, triggering, and to selectively trigger parts of an overall danger.

**On Hover**
Hovering over any button, aside from the manual trigger grouping, will highlight it's area within the scene grid.

#### Configure Zones
Launches the scene's zone list form, where zones can be added to scene, editied, deleted, or copied from another scene.

#### Clear Danger Zone Placeables
Deletes all tiles, lights, regions, and walls that were created on the scene by a danger.

### Clear Danger Zone Lasting Effects
Selecting this will clear all lasting effects (tiles) on the scene created by Danger Zone. 

### Clear Danger Zone Ambient Lighting
Selecting this will clear all lighting on the scene created by Danger Zone. 

### Clear Danger Zone Regions
Selecting this will clear all regions on the scene created by Danger Zone. 

### Clear Danger Zone Ambient Sounds
Selecting this will clear all sounds on the scene created by Danger Zone. 

### Clear Danger Zone Walls
Selecting this will clear all walls on the scene created by Danger Zone. 

### Dangers Button
Aside from accessing dangers from the Danger Zone Configuration area in the Foundry Module Configurations, you can also add these by selecting the button located in the footer of the scenes sidebar. This button can be suppressed as an option within the Danger Zone Configurations.

![image](https://user-images.githubusercontent.com/22696153/132788217-c98c6ac9-6a57-48cb-95d2-f7885322c698.png)

## API
Trigger zones and access other Danger Zone features directly from the API
See [API](../../wiki/API) for more info.

## Module Integration
<img src="https://user-images.githubusercontent.com/22696153/147769508-3df0ad4c-88bf-4203-93ba-d3be997c6dde.gif" height="400">

> Installing other (free) Foundry VTT modules will increase the available danger possibilities.
> 

Danger Zone integrates with a series of other Foundary modules in order to provide enhanced effects and token targetting. See the [Module Integration](../../wiki/Module-Integration) page for details on which modules extend Danger Zone base functionality if installed.

## Future Enhancements
See the [Future Enhancements](../../projects/1) board for a list of upcoming enhancements to this module.
