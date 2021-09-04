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

### 1. Create a Zone Type
The zone type is the lava bubble or vent of poisonous gas released from a lava field. It defines an effect that executes within a zone.

<img src="https://user-images.githubusercontent.com/22696153/131511482-314d13d4-aaeb-4ef6-9ef9-8be9a2c4f8a9.png"  height="300">

Add zone types by going to Foundry's 'Configure Settings' > 'Module Settings', locating Danger Zone, and selecting the 'Configure Danger Zone Types' button. See [Zone Types](../../wiki/Zone-Types) for more info.

### 2. Add Zone to Scene
The zone is the lava field. Within the zone's boundary tokens may be targetted and zone type effects generated. 

<img src="https://user-images.githubusercontent.com/22696153/131511349-1c85213c-46cf-4a2a-87db-345989b10603.png"  height="400">

Access the Danger Zone section from within scene configuration in order to create new zones. See [Zones](../../wiki/Zones) for more info.

### 3. Trigger Zone
The trigger causes the lava bubble to erupt from the lava field. A trigger can be invoked either manually or as part of a Foundary event.

![image](https://user-images.githubusercontent.com/22696153/131510995-6ca6cee0-9a8a-4ff4-ad82-561c76090cdc.png)

See [Triggers](../../wiki/Triggers) for more info.

## Module Integration
Danger Zone integrates with a series of other Foundary modules in order to provide enhanced effects and token targetting. See the [Module Integration](../../wiki/Module-Integration) page for details on which modules extend Danger Zone base functionality if installed.

## Future Enhancements
See the [Future Enhancements](../../projects/1) board for a list of upcoming enhancements to this module.
