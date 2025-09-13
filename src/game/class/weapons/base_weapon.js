export class Weapon {
    // Returns true if a critical hit occurs based on critChance
    checkCritical() {
        return Math.random() < this.critChance;
    }
    constructor(config)  {
        this.name = config.name;
        this.startDamage = config.startDamage;
        this.endDamage = config.endDamage;
        this.attackSpeed = config.attackSpeed; // how many per second e.g., 1.0 = 1 per second
        this.damageType = config.damageType; // e.g., physical, magical
        this.range = config.range;
        this.type = config.type; // e.g., axes, swords, bows
        this.oneHanded = config.oneHanded; // boolean
        this.critChance = config.critChance || 0.0; // default 5% crit chance

        this.required = {
            level: config.required?.level || 1,
            strength: config.required?.strength || 0,
            dexterity: config.required?.dexterity || 0,
            intelligence: config.required?.intelligence || 0,
        }
    }

    // calculate damage within the weapon's damage range
    calculateDamage() {
        return Math.random() * (this.endDamage - this.startDamage) + this.startDamage;
    }

    generateTooltip() {
        return `${this.name}
Damage: ${this.startDamage} - ${this.endDamage}
Attack Speed: ${this.attackSpeed.toFixed(2)}
Damage Type: ${this.damageType}
Range: ${this.range === -1 ? 'Melee' : this.range}
Type: ${this.type}
${this.oneHanded ? 'One-Handed' : 'Two-Handed'}
Crit Chance: ${(this.critChance * 100).toFixed(1)}%
Required Level: ${this.required.level}
Required Strength: ${this.required.strength}
Required Dexterity: ${this.required.dexterity}
Required Intelligence: ${this.required.intelligence}`;
    }
}