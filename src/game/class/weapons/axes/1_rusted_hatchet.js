import { Weapon } from "../base_weapon.js";
import { CONSTANTS } from "../../constants.js";

export class RustedHatchet extends Weapon {
    constructor() {
        super({
            name: "Rusted Hatchet",
            startDamage: 6,
            endDamage: 11,
            attackSpeed: 1.5,
            damageType: CONSTANTS.damageTypes.physical,
            range: 1,
            type: CONSTANTS.weaponTypes.axes,
            oneHanded: true,
            critChance: 0.05,
            required: {
                level: 1,
                strength: 12,
                dexterity: 6,
                intelligence: 0,
            }
        });
    }
}