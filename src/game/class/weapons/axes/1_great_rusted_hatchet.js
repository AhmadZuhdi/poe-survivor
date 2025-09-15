import { Weapon } from "../base_weapon.js";
import { CONSTANTS } from "../../constants.js";

export class GreatRustedHatchet extends Weapon {
    constructor() {
        super({
            name: "Great Rusted Hatchet",
            startDamage: 9,
            endDamage: 15,
            attackSpeed: 1.0,
            damageType: CONSTANTS.damageTypes.physical,
            range: 1,
            type: CONSTANTS.weaponTypes.axes,
            oneHanded: false,
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