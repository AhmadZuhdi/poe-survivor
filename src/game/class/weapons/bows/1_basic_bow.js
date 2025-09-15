import { Weapon } from "../base_weapon.js";
import { CONSTANTS } from "../../constants.js";

export class BasicBow extends Weapon {
    constructor() {
        super({
            name: "Basic Bow",
            startDamage: 4,
            endDamage: 8,
            attackSpeed: 1.7,
            damageType: CONSTANTS.damageTypes.physical,
            range: 5,
            type: CONSTANTS.weaponTypes.bows,
            oneHanded: true,
            critChance: 0.05,
            required: {
                level: 1,
                strength: 3,
                dexterity: 12,
                intelligence: 0,
            }
        });
    }
}