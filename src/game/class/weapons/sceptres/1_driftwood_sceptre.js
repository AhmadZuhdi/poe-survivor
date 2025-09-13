import { Weapon } from "../base_weapon.js";
import { CONSTANTS } from "../../constants.js";

export class DriftwoodSceptre extends Weapon {
    constructor() {
        super({
            name: "Driftwood Sceptre",
            startDamage: 8,
            endDamage: 11,
            attackSpeed: 1.2,
            damageType: CONSTANTS.damageTypes.magical,
            range: 4,
            type: CONSTANTS.weaponTypes.sceptres,
            oneHanded: false,
            critChance: 0.07,
            required: {
                level: 1,
                strength: 6,
                dexterity: 4,
                intelligence: 10,
            }
        });
    }
}