# Danger-Zone


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
Danger Zone integrates with a series of other Foundary modules in order to provide enhanced effects and token targetting. Below is a list of the module integrations. It is not required to have these modules installed in order for Danger Zone to work. Module-specific settings will not appear in the applicable forms and will not invoke unless that module is installed and active in the world.

### Advanced Macros
If installed, macros generated by a zone type will have arguments passed into them. These are accessible within the 'args' variable (add console.log(args) to your macro to see the arguments that are passed into the macro within your console). See the [Macros Arguments](../../wiki/Macros-Arguments) page for more information on the arguments provided.

### Kandashi's Fluid Canvas
![image](https://user-images.githubusercontent.com/22696153/131542485-3eb6c663-586a-45d6-95e2-665c9a03c5da.png)
If installed, most of the effects available within Kandashi's Fluid Canvas are made available to select from in the zone type form. Parameter options influence the effect following that module's [API](https://github.com/kandashi/kandashis-fluid-canvas/blob/master/API.md) rules.
* Delay: pause the fluid canvas effect from triggering after the zone triggers for the entered amount of milliseconds.

### Dynamic Effects Using Active Effects
At the current time the active effect on the Zone Type uses the base active effect form. However, if DAE is installed you will gain any benefits from using DAE when the zone type effect is applied to a token.

### Monk's Active Tiles
![image](https://user-images.githubusercontent.com/22696153/131545430-00864295-b4e9-48c4-a4af-a7e51db301e1.png)
In the event that the zone type creates a lasting effect, if installed, Monk's Active Tiles actions can be added to that tile. The tile triggers will be set to active, without restriction to token, control or amount of triggers per token, and will trigger on enter 100% of the time. Currently there are 2 options:

#### Macros
* Add the selected macro to the lasting effect's tile actions. Other options provided here follow this module's definitions for this action type.

### Sequencer 
![image](https://user-images.githubusercontent.com/22696153/131546705-20c9ac83-8795-4b61-886a-2bcf30e49864.png)
If sequencer is installed, you have access to add temporary effects to the zone type. These begin execution asynchronously before the lasting effect is created and add the selected animations to enhance the visual effect when the zone is triggered. Effects are located at the center of the targetted area. Both the primary and secondary effects have the same settings, but the primary appears above the tokens on the scene and the secondary will appear under the tokens on the scene.
* File: the given file to play. See other available modules, such as JB2A, for ready available animations to use. The primary or secondary effect will not generate unless this is populated.
* Scale: increases or decreases the scale of the animation from that file's default (in decimal multiplier form with 1.0 being the file's default size).
* Repeats: uses the sequencer .repeats() method in order to generate the animation an additional number of times (as a count of repeats).
* Duration: uses the sequencer .duration() method in order to cap the duration of the animation and end it (in milliseconds).

#### Teleport
* Embed the teleport action into the lasting effect's tile. The location teleported to will be a second random location within the zone. Options provided follow this module's definitions for this action type with the following additions:
     * Twin: Creates a second tile at the teleport location that carries the same lasting effect settings as the first, but with a teleport location that points back to the first lasting effect. In  other words, the two new tiles will be paired and will teleport between each other.

### Token Says
![image](https://user-images.githubusercontent.com/22696153/131543713-193c3cd2-9283-4dd5-85cd-86e1f67c87c4.png)
If installed, Token Says functionality is available for use utilizing that module's .saysDirect() method in the [API](https://github.com/napolitanod/Token-Says/blob/main/README.md). Any token targetted by a zone using a zone type with Token Says parameters set will invoke that token to say something.

### Warp Gate
![image](https://user-images.githubusercontent.com/22696153/131544351-5b8836d1-e3b0-4d7c-950b-43c7a8106818.png)
If installed, Warp Gate will summon the given actor as a token to the location targetted by the zone that uses a zone type with this configured. You can summon either a specific actor each time or point to a rollable table in order to randomize the actor summoned.
* Delay: pause executing Warpgate for the amount of stated milliseconds after the zone triggers.
* Duplicates: Set the number of tokens to spawn to the targetted location, with the default being 1.
