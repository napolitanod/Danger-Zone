![all versions](https://img.shields.io/github/downloads/napolitanod/Danger-Zone/total) 
![Latest Release Download Count](https://img.shields.io/github/downloads/napolitanod/Danger-Zone/latest/module.zip)
[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fdanger-zone&colorB=4aa94a)](https://forge-vtt.com/bazaar#package=danger-zone)
[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fdanger-zone%2Fshield%2Fendorsements)](https://www.foundryvtt-hub.com/package/danger-zone/)


Bring danger, personality and life to your scenes. Danger Zone is a Foundary VTT module that provides GMs the ability to easily invoke localized effects within a scene. Examples of what you can do with this module:
* A storm where the danger of being struck by lightning is a deadly possibility.
* A crumbling building where the collapsing ceiling can injure or trap occupants.
* A twisted field of magic with portals that blink in and out of existance.
* A blessed glade offering healing to those who walk through.

<img src="https://user-images.githubusercontent.com/22696153/131688065-208aedc4-8c3c-4a3f-acab-bed0f103046e.gif" height="400">


## What's in the module
Danger Zone effectively turns your scene into an actor, adding defined zones to the scene where effects that you specify can be triggered while adding effect trigger buttons to the scene's navbar that give you the ability to generate effects with the click of a button. Zone effects can be associated with game events, such as combat turn change, and can be triggered automatically when such events occur. Danger Zone also provides easy to use forms within which you can define what happens when a given effect triggers, such as adding visual and audio components, macros, tiles, and chat messaging and includes workflow functionality that completes the effect in sequence. Finally, Danger Zone has a token targeting component, which gives you the ability to add active effects or generate macro code on tokens targetted by a zone effect. Danger Zone functionality can be expanded through other Foundry modules - see the Module Integration section below.

## What's not in the module
Danger Zone does not include any video, image or audio components. When another module can do something well, such as summoning a token (Warpgate), shaking the screen canvas (Kandashi's Fluid Canvas), or teleporting tokens (Monk's Active Tiles) then Danger Zone will integrate with that module to provide those effects rather than include them in the module itself.

## Getting Started

### 1. Create a Danger
The danger is the lava bubble that bursts to the surface or the vent of poisonous gas that releases from a lava field. It defines an effect that executes within a zone.

<img src="https://user-images.githubusercontent.com/22696153/132788292-b46c4a20-8266-4fa7-aafd-133f92235094.png"  height="300">

Add dangers by going to Foundry's 'Configure Settings' > 'Module Settings', locating Danger Zone, and selecting the 'Configure Dangers' button. See [Dangers](../../wiki/Dangers) for more info.

### 2. Add Zone to Scene
The zone is the lava field. Within the zone's boundary the dangers are generated. 

<img src="https://user-images.githubusercontent.com/22696153/131511349-1c85213c-46cf-4a2a-87db-345989b10603.png"  height="400">

Access the Danger Zone section from within scene configuration in order to create new zones. See [Zones](../../wiki/Zones) for more info.

### 3. Trigger Zone
The trigger causes the lava bubble to erupt from the lava field. A trigger can be invoked either manually or as part of a Foundary event.

See [Triggers](../../wiki/Triggers) for more info.

## Added to Foundry

### Danger Zone Trigger Buttons
<img src="https://user-images.githubusercontent.com/22696153/132107140-2fb0f79d-ab56-425f-8733-c01677602ad5.png" height="70px">
When a scene is activated, if you are a GM and viewing that scene, you will see an array of buttons located to the right of that scene in the scene top navigation. Each button is a zone in that scene and displays the icon for the danger held within. The buttons function as follows:

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

### Dangers Button
Aside from accessing dangers from the Danger Zone Configuration area in the Foundry Module Configurations, you can also add these by selecting the button located in the footer of the scenes sidebar. This button can be suppressed as an option within the Danger Zone Configurations.

![image](https://user-images.githubusercontent.com/22696153/132788217-c98c6ac9-6a57-48cb-95d2-f7885322c698.png)


## Module Integration
Danger Zone integrates with a series of other Foundary modules in order to provide enhanced effects and token targetting. See the [Module Integration](../../wiki/Module-Integration) page for details on which modules extend Danger Zone base functionality if installed.

## Future Enhancements
See the [Future Enhancements](../../projects/1) board for a list of upcoming enhancements to this module.
