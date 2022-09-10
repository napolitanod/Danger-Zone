![all versions](https://img.shields.io/github/downloads/napolitanod/Danger-Zone/total) 
![Latest Release Download Count](https://img.shields.io/github/downloads/napolitanod/Danger-Zone/latest/module.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdanger-zone&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=danger-zone)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fdanger-zone%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/danger-zone/)

:biohazard: [Discussion and Danger Configuration Sharing on JB2A Discord server](https://discord.gg/gmd8MAPX4m) <br>
:biohazard: [Wiki and How to Use](../../wiki)  <br>
:biohazard: [Detailed Examples](../../wiki/Examples) <br>
:biohazard: [Tutorials](../../wiki/Video-Tutorials) <br>

## About
Bring danger, personality and life to your scenes. Danger Zone is a Foundary VTT module that provides GMs the ability to easily invoke localized effects within a scene. Examples of what you can do with this module:
* A storm where the danger of being struck by lightning is a deadly possibility.
* A crumbling building where the collapsing ceiling can injure or trap occupants.
* A twisted field of magic with portals that blink in and out of existance.
* A blessed glade offering healing to those who walk through.

<img src="https://github.com/napolitanod/Danger-Zone/blob/main/.gitImage/crumbling%20ceiling%20gif.gif" height="400">

> A zone is triggered by the start of a new combat turn, and the resulting danger causes the screen to shake and shed rubble.

## What's in the module
* Add zones to a scene within which effects generate and tokens are affected.
* Activate and trigger zones with on-screen buttons. 
* Associate zone triggers to game events, such as combat turn change or token movement. 
* Sequence various effects and zone triggers to perfect the overall effect experience. 
* Target tokens within zone effects in order to do things like add active effects, update token data, or add items. 
* Target within a zone's width, height and depth dimensions, for square and hex grids.
* Easy to use forms for configuring dangers and zones.
* Functionality can be expanded through other Foundry modules - see the Module Integration section below.
* Accessible API for accessing Danger Zone functionality from another module or macro.

## What's not in the module
* **!!!Does not include any video, image or audio components.!!!**
* **Gridless scenes not supported** The module currently does not extend to include gridless scenes.

## Getting Started
<img src="https://user-images.githubusercontent.com/22696153/147769650-1a095760-9c4e-4ef9-8cff-403abc049bb1.gif" height="400">

> A danger zone is triggered by token movement within a zone using the zone aura trigger.

### 1. Create a Danger
The danger is the lava bubble that bursts to the surface or the vent of poisonous gas that releases from a lava field. It defines an effect that executes within a zone. With Danger Zone, you have control over a vast array of configuration combinations, including displaying effects, creating lights and walls, spawning tokens, executing macros, playing sounds and moving tokens.

<img src="https://github.com/napolitanod/Danger-Zone/blob/main/.gitImage/r9/dangerFilled4.JPG"  height="400">

Add dangers by going to Foundry's 'Configure Settings' > 'Module Settings', locating Danger Zone, and selecting the 'Configure Dangers' button. Or access the Dangers button from the Scenes right navigation area. See [Dangers](../../wiki/Dangers) for more info.

### 2. Add Zone to Scene
The zone is the lava field. Within the zone's boundary the dangers are generated. You associate one danger to each zone and a scene can have any number of zones. Zones may also be copied from one scene to another.

<img src="https://github.com/napolitanod/Danger-Zone/blob/main/.gitImage/r9/configureSceneZones.JPG"  height="300px">

Access the Danger Zone section from within scene configuration form's header or by right clicking on the scene in the navigation or within the side menu and selecting 'Configure Zones' from the context menu. This will present the form where you can create new zones or edit existing ones. See [Zones](../../wiki/Zones) for more info.

### 3. Trigger Zone
The trigger causes the lava bubble to erupt from the lava field. A trigger can be invoked either manually or as part of a Foundary event.

See [Triggers](../../wiki/Triggers) for more info.

## Added to Foundry

### Danger Zone Trigger Buttons
<img src="https://user-images.githubusercontent.com/22696153/132107140-2fb0f79d-ab56-425f-8733-c01677602ad5.png" height="70px">
When a scene is activated, if you are a GM and viewing that activated scene, you will see an array of buttons located to the right of that scene in the scene top navigation. Note, you may override this display location within the module configuration settings and instead choose to display the triggers adjacent to the macro bar.

Each button is a zone in that scene and displays the icon for the danger held within. The buttons function as follows:

#### Manually triggered zones
* Zones that are active are listed individually here except for those which have the 'Randomize' enabled. 
* All active randomized zones are grouped and only a single random button (using the Danger Zone radiation logo) is displayed for all of them. 
* Inactive zones are not displayed.
* Selecting a button triggers ths zone.

#### Automatically triggered zones (e.g. combat turn start trigger)
* All zones are listed individually here.
* Active zones are displayed with a blue highlight effect. Inactive are displayed without the highlight effect.
* Selecting a button toggles it from active to inactive or vice versa.

#### On Hover
Hovering over any button, aside from the manual trigger grouping, will highlight it's area within the scene grid.

### Danger Zone Lasting Effect Clear
<img src="https://user-images.githubusercontent.com/22696153/132107176-928adf83-cd37-47e4-a3b3-c792cbdb2151.png">
A button is added to the tile controls. Selecting this will clear all lasting effects (tiles) on the scene that were placed there by Danger Zone. You can suppress this button as an option within the module configurations.

### Danger Zone Ambient Light Clear
A button is added to the lighting controls with the same icon as the tile clear button shown in the above section. Selecting this will clear all ambient lights on the scene that were placed there by Danger Zone. You can suppress this button as an option within the module configurations.

### Danger Zone Wall Clear
A button is added to the walls controls with the same icon as the tile clear button shown in the above Danger Zone Lasting Effect Clear section. Selecting this will clear all walls on the scene that were placed there by Danger Zone. You can suppress this button as an option within the module configurations.

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
