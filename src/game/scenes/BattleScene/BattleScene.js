import { Scene } from 'phaser';
import { CharacterPanel } from '../../ui/CharacterPanel';
import { SkillTreePanel } from '../../ui/SkillTreePanel';
import { InventoryPanel } from '../../ui/InventoryPanel';
import { SkillPanel } from '../../ui/SkillPanel';
import { setupCollisions } from './collision';
import { CONSTANTS } from '../../class/constants';
import { updatePlayerHealth, updateHealthBar, updatePlayerMana, updateManaBar } from './health';
import { handlePlayerMovement, characterStats } from './player';
import { handleEnemySpawn, updateEnemyVelocity, handleEnemyDeath } from './enemy';
import { handleWaveLogic, handleBossSpawn } from './wave';

export class BattleScene extends Scene {
    constructor() {
        super('BattleScene');
        // Wave system
        this.wave = 1;
        this.waveEnemies = 0;
        this.waveBossSpawned = false;
        // Player level and kill count
        this.playerLevel = 1;
        this.playerKills = 0;
        this.playerExp = 0;
        this.playerExpToLevel = 5;
        this.baseExp = 5;
        // Configurable properties (responsive)
        this.enemyCount = 8;
        this.enemySpeed = 100;
        // Player health and mana will be initialized in create() based on selected class
        this.playerMaxHealth = 100; // Default, will be updated
        this.playerHealth = this.playerMaxHealth;
        this.playerMaxMana = 50; // Default, will be updated  
        this.playerMana = this.playerMaxMana;
        // Store CONSTANTS for module access
        this.CONSTANTS = CONSTANTS;
    }

    preload() {
        // Generate projectile texture
        const projGfx = this.make.graphics({x:0, y:0, add:false});
        projGfx.fillStyle(0xffff00, 1);
        projGfx.fillCircle(10, 10, 5);
        projGfx.generateTexture('projectile', 20, 20);
        projGfx.destroy();

        // Generate enemy texture
        const enemyGfx = this.make.graphics({x:0, y:0, add:false});
        enemyGfx.fillStyle(0xff0000, 1);
        enemyGfx.fillCircle(15, 15, 15);
        enemyGfx.generateTexture('enemy', 30, 30);
        enemyGfx.destroy();

        // Generate player texture
        const playerGfx = this.make.graphics({x:0, y:0, add:false});
        playerGfx.fillStyle(0x00ff00, 1);
        playerGfx.fillCircle(20, 20, 20);
        playerGfx.generateTexture('player', 40, 40);
        playerGfx.destroy();
    }

    create() {
        // Health regen timer
        this.lastHealthRegen = 0;
        // Player health value text
        this.healthValueText = this.add.text(0, 0, '', {
            fontFamily: 'Arial', fontSize: 18, color: '#ff4444', stroke: '#000', strokeThickness: 2
        }).setDepth(12);
        // Player mana value text
        this.manaValueText = this.add.text(0, 0, '', {
            fontFamily: 'Arial', fontSize: 18, color: '#4444ff', stroke: '#000', strokeThickness: 2
        }).setDepth(12);
        // Get selected class from scene data
        this.selectedClass = this.sys.settings.data?.selectedClass || null;
        // Hide game UI until class is selected
        this.gameStarted = true;
        // Character panel (fullscreen)
        this.charPanel = new CharacterPanel(this);
        // Skill tree panel (draggable)
        this.skillTreePanel = new SkillTreePanel(this);
        // Skill points: 1 per level
        this.skillPoints = this.playerLevel;
        this.skillTreePanel.updateSkillPoints(this.skillPoints);
        // Inventory panel (fullscreen, pauses game when open)
        this.inventoryPanel = new InventoryPanel(this, (visible) => {
            this.isPaused = visible;
        });
        // Skill panel (shows active and available skills)
        this.skillPanel = new SkillPanel(this);
        // Add selected weapon to inventory if provided
        this.inventory = [];
        if (this.sys.settings.data?.selectedWeapon) {
            this.inventory.push(this.sys.settings.data.selectedWeapon);
            this.inventoryPanel.updateItems({
                weapon: this.sys.settings.data.selectedWeapon
            });
        }
        // Toggle panels with keys
        this.keyPanel = this.input.keyboard.addKey('C');
        this.keySkillTree = this.input.keyboard.addKey('T');
        this.keyInventory = this.input.keyboard.addKey('I');
        this.keySkills = this.input.keyboard.addKey('K');
        // Game pause state
        this.isPaused = false;
        // Wave text display
        this.waveText = this.add.text(20, 50, 'Wave: 1', {
            fontFamily: 'Arial', fontSize: 24, color: '#00ffff', stroke: '#000', strokeThickness: 3
        }).setDepth(100);
        // Level text display
        this.levelText = this.add.text(20, 20, 'Level: 1 | EXP: 0/5', {
            fontFamily: 'Arial', fontSize: 24, color: '#ffff00', stroke: '#000', strokeThickness: 3
        }).setDepth(100);
        // Controls instructions
        this.controlsText = this.add.text(this.scale.width - 20, 20, 'C: Character | T: Skills Tree | I: Inventory | K: Skills', {
            fontFamily: 'Arial', fontSize: 16, color: '#ffffff', stroke: '#000', strokeThickness: 2
        }).setOrigin(1, 0).setDepth(100);
        // Enable cursor input for player movement
        this.cursors = this.input.keyboard.createCursorKeys();
        // Responsive screen dimensions
        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;
        const minDim = Math.min(this.scale.width, this.scale.height);
        this.spawnRadius = minDim * 0.25; // 25% of min dimension

        // Basic background
        this.add.rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x222244);
        // Center player in the middle of the screen (responsive)
        this.player = this.physics.add.sprite(centerX, centerY, 'player');
        this.enemies = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });
        this.projectiles = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });

        // Initialize player stats from character stats
        const stats = characterStats(this);
        this.playerMaxHealth = stats.baseHealth;
        this.playerHealth = this.playerMaxHealth;
        this.playerMaxMana = stats.baseMana;
        this.playerMana = this.playerMaxMana;

        // Health bar graphics (create after player)
        this.healthBarBg = this.add.graphics();
        this.healthBarBg.setDepth(10);
        this.healthBar = this.add.graphics();
        this.healthBar.setDepth(11);
        updateHealthBar(this);

        // Mana bar graphics
        this.manaBarBg = this.add.graphics();
        this.manaBarBg.setDepth(10);
        this.manaBar = this.add.graphics();
        this.manaBar.setDepth(11);
        updateManaBar(this);

        // Setup collision logic
        setupCollisions(this);

        // Setup enemy projectile collisions (will be called when enemyProjectiles group is created)
        this.setupEnemyProjectileCollisions = () => {
            if (this.enemyProjectiles) {
                console.log('Setting up enemy projectile collisions');
                this.physics.add.overlap(this.player, this.enemyProjectiles, (player, projectile) => {
                    if (this.playerHealth > 0) {
                        const damage = projectile.getData('damage') || 15;
                        console.log('Enemy projectile hit player for damage:', damage);
                        this.playerHealth = Math.max(0, this.playerHealth - damage);
                        projectile.destroy();
                    }
                });
            }
        };

        // Timers for auto-attack and enemy spawn
        this.nextAttack = 0;
        this.nextEnemy = 0;
        this.attackInterval = 500; // ms
        this.enemyInterval = 1000; // ms
        this.lastAttack = 0;
        this.lastEnemy = 0;
    }

    update(time, delta) {
        // Wait for class selection before running game logic
        if (!this.gameStarted) return;

        this.handlePanelToggle();
        this.handlePanelStatsUpdate();
        if (this.isPaused) {
            this.pauseGameObjects();
            return;
        }
        handleWaveLogic(this);
        handlePlayerMovement(this);
        // Call updatePlayerHealth only every second
        if (time > this.lastHealthRegen + 1000) {
            this.lastHealthRegen = time;
            updatePlayerHealth(this);
            updatePlayerMana(this);
        }
        updateHealthBar(this);
        updateManaBar(this);
        this.handleAutoAttack(time);
        handleEnemySpawn(this, time);
        handleBossSpawn(this);
        updateEnemyVelocity(this);
        this.cleanupProjectilesAndEnemies();
        this.handleGameOver();
    }

    handlePanelToggle() {
        if (Phaser.Input.Keyboard.JustDown(this.keyPanel)) {
            this.charPanel.toggle({
                level: this.playerLevel,
                exp: this.playerExp,
                expToLevel: this.playerExpToLevel,
                kills: this.playerKills,
                health: this.playerHealth,
                maxHealth: this.playerMaxHealth,
                selectedClass: this.selectedClass
            });
            this.checkIsPaused();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keySkillTree)) {
            this.skillTreePanel.toggle();
            // Always update skill points before opening
            this.skillTreePanel.updateSkillPoints(this.skillPoints);
            this.checkIsPaused();
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyInventory)) {
            this.inventoryPanel.toggle();
            // Inventory panel does not pause the game by default
        }
        if (Phaser.Input.Keyboard.JustDown(this.keySkills)) {
            this.skillPanel.setVisible(!this.skillPanel.visible);
            this.checkIsPaused();
        }
    }

    checkIsPaused() {
        this.isPaused = this.charPanel.visible || this.skillTreePanel.visible || this.skillPanel.visible;
    }

    handlePanelStatsUpdate() {
        if (this.charPanel.visible) {
            this.charPanel.updateStats({
                level: this.playerLevel,
                exp: this.playerExp,
                expToLevel: this.playerExpToLevel,
                kills: this.playerKills,
                health: this.playerHealth,
                maxHealth: this.playerMaxHealth,
                selectedClass: this.selectedClass
            });
        }
    }

    pauseGameObjects() {
        this.player.body.setVelocity(0, 0);
        this.enemies.children.each((enemy) => {
            if (enemy.body) enemy.body.setVelocity(0, 0);
        });
    }

    handleAutoAttack(time) {
        if (time > this.lastAttack + this.attackInterval) {
            this.lastAttack = time;
            // Get equipped weapon
            const items = this.inventoryPanel.lastItems || {};
            const weapon = items.weapon;
            let weaponRange = weapon?.range ?? 1;

            if (weapon && weaponRange < 3) {
                // Area attack: damage all enemies within radius
                const coneRadius = 60 + (weaponRange * 30); // Range affects radius
                const playerX = this.player.x;
                const playerY = this.player.y;

                // Find nearest enemy
                let nearestEnemy = null;
                let minDist = Infinity;
                this.enemies.children.each((enemy) => {
                    if (!enemy.active) return;
                    const dx = enemy.x - playerX;
                    const dy = enemy.y - playerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearestEnemy = enemy;
                    }
                });

                // Default direction is up (270deg) if no enemy
                let coneDirection = 270;
                if (nearestEnemy) {
                    const dx = nearestEnemy.x - playerX;
                    const dy = nearestEnemy.y - playerY;
                    coneDirection = Phaser.Math.RadToDeg(Math.atan2(dy, dx));
                }

                // Damage all enemies in cone
                const coneAngle = 60 + (weaponRange * 10); // degrees
                this.enemies.children.each((enemy) => {
                    if (!enemy.active) return;
                    const dx = enemy.x - playerX;
                    const dy = enemy.y - playerY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > coneRadius) return;
                    // Angle between cone direction and enemy
                    const angleToEnemy = Phaser.Math.RadToDeg(Math.atan2(dy, dx));
                    let diff = Phaser.Math.Angle.WrapDegrees(angleToEnemy - coneDirection);
                    const isInCone = Math.abs(diff) <= coneAngle / 2;
                    if (isInCone) {
                        // Enemy is in cone, apply damage
                        this.applyDamageToEnemy(enemy);
                    }
                });
                // Show cone effect (visual)
                const areaEffect = this.add.graphics();
                areaEffect.setDepth(999);
                areaEffect.fillStyle(0x00ffff, 0.25);
                const startAngle = Phaser.Math.DegToRad(coneDirection - coneAngle / 2);
                const endAngle = Phaser.Math.DegToRad(coneDirection + coneAngle / 2);
                areaEffect.slice(playerX, playerY, coneRadius, startAngle, endAngle, false);
                areaEffect.fillPath();
                this.time.delayedCall(150, () => {
                    areaEffect.destroy();
                });
            } else {
                // Ranged attack (projectile)
                let targetEnemy = null;
                let minDist = Infinity;
                this.enemies.children.each((enemy) => {
                    if (!enemy.active) return;
                    const dx = enemy.x - this.player.x;
                    const dy = enemy.y - this.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < minDist) {
                        minDist = dist;
                        targetEnemy = enemy;
                    }
                });
                let vx = 0, vy = -400;
                if (targetEnemy) {
                    const dx = targetEnemy.x - this.player.x;
                    const dy = targetEnemy.y - this.player.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        vx = (dx / dist) * 400;
                        vy = (dy / dist) * 400;
                    }
                }
                const projectile = this.projectiles.get(this.player.x, this.player.y, 'projectile');
                if (projectile) {
                    projectile.setActive(true).setVisible(true);
                    projectile.body.setVelocity(vx, vy);
                }
            }
        }
    }

    cleanupProjectilesAndEnemies() {
        this.projectiles.children.each((proj) => {
            if (proj.y < -10) proj.destroy();
        });
        this.enemies.children.each((enemy) => {
            if (enemy.x < -50 || enemy.x > this.scale.width + 50 || enemy.y < -50 || enemy.y > this.scale.height + 50) enemy.destroy();
        });
        
        // Cleanup enemy projectiles
        if (this.enemyProjectiles) {
            this.enemyProjectiles.children.each((proj) => {
                if (proj.x < -50 || proj.x > this.scale.width + 50 || proj.y < -50 || proj.y > this.scale.height + 50) {
                    proj.destroy();
                }
            });
        }
    }

    handleGameOver() {
        if (this.playerHealth <= 0) {
            // You can add game over logic here
        }
    }

    // Apply damage to enemy and handle death/crit
    applyDamageToEnemy(enemy) {
        if (!enemy || !enemy.active) return;
        const dmgResult = this.calculateDamage();
        let enemyHealth = enemy.getData('health') || 0;
        enemyHealth -= dmgResult.damage;
        enemy.setData('health', enemyHealth);
        if (dmgResult.isCrit) {
            enemy.setTint(0xffff00);
        }
        if (enemyHealth <= 0) {
            handleEnemyDeath(this, enemy);
        }
    }

    calculateMultiplier() {
        const stats = this.skillTreePanel.calculateStats();
        let multiplier = {};

        const skillMultipliers = {

            [CONSTANTS.weaponRanges.melee]: [
                {
                    regex: /(\d+?)% increased melee damage/g,
                    handler: (match) => parseFloat(match[1]) / 100
                }
            ],

            [`${CONSTANTS.damageTypes.physical}-${CONSTANTS.weaponSubTypes.twoHanded}`]: [
                {
                    regex: /(\d+?)% increased physical Damage with two handed melee weapons/g,
                    handler: (match) => parseFloat(match[1]) / 100
                }
            ],

            [CONSTANTS.weaponSubTypes.twoHanded]: [
                {
                    regex: /(\d+?)% increased damage with two handed Weapons/g,
                    handler: (match) => parseFloat(match[1]) / 100
                },
            ],

            [CONSTANTS.damageTypes.physical]: [
                {
                    regex: /(\d+?)% increased attack physical damage/g,
                    handler: (match) => parseFloat(match[1]) / 100
                }
            ],
            
            [CONSTANTS.multiplierTypes.lifeRegen]: [
                {
                    regex: /regenerate (\d*\.?\d+)% of life per second/i,
                    handler: (match) => parseFloat(match[1]) / 100
                }
            ]
        }

        for (const stat in stats) {
            for (const [key, multiplierData] of Object.entries(skillMultipliers)) {

                multiplierData.forEach(m => {
                   const match = m.regex.exec(stat.toLowerCase().trim());
                   if (match) {
                       multiplier[key] = (multiplier[key] || 0) + m.handler(match);
                   }
               });
            }
        }

        return multiplier;
    }

    calculateDamage() {
        // Get equipped weapon from inventoryPanel
        const items = this.inventoryPanel.lastItems || {};
        const weapon = items.weapon;

        // TODO: implement unarmed damage if no weapon
        if (!weapon) {
            // No weapon equipped, use base physical damage
            const stats = characterStats(this);
            return { damage: stats.basePhysDamage, isCrit: false };
        }

        // Get base damage type
        const stats = characterStats(this);
        let baseDamage = 0;
        let damageType = weapon.damageType || CONSTANTS.damageTypes.physical;
        if (damageType === CONSTANTS.damageTypes.physical) {
            baseDamage = stats.basePhysDamage;
        } else if (damageType === CONSTANTS.damageTypes.magical) {
            baseDamage = stats.baseMagicDamage;
        } else {
            baseDamage = stats.basePhysDamage;
        }

        // Calculate weapon damage
        const weaponDamage = weapon.calculateDamage();
        baseDamage += weaponDamage;

        // Get multiplier from skill tree
        const multipliers = this.calculateMultiplier();
        let totalMultiplier = 1;

        const isWeaponPhys = damageType === CONSTANTS.damageTypes.physical;
        if (isWeaponPhys && multipliers[CONSTANTS.damageTypes.physical]) {
            totalMultiplier += multipliers[CONSTANTS.damageTypes.physical];
        }

        if (weapon.range === CONSTANTS.weaponRanges.melee && multipliers[CONSTANTS.weaponRanges.melee]) {
            totalMultiplier += multipliers[CONSTANTS.weaponRanges.melee];
        }

        if (weapon.oneHanded === false && multipliers[CONSTANTS.weaponSubTypes.twoHanded]) {
            totalMultiplier += multipliers[CONSTANTS.weaponSubTypes.twoHanded];
        }

        if (weapon.oneHanded === false && isWeaponPhys && multipliers[`${CONSTANTS.damageTypes.physical}-${CONSTANTS.weaponSubTypes.twoHanded}`]) {
            totalMultiplier += multipliers[`${CONSTANTS.damageTypes.physical}-${CONSTANTS.weaponSubTypes.twoHanded}`];
        }

        // You can add more multiplier types here if needed

        // Check for critical hit using weapon class
        let isCrit = false;
        let critMultiplier = 1;
        if (typeof weapon.checkCritical === 'function') {
            isCrit = weapon.checkCritical();
            if (isCrit && weapon.critMultiplier) {
                critMultiplier = weapon.critMultiplier;
            } else if (isCrit) {
                critMultiplier = 2; // Default crit multiplier
            }
        }

        // Final damage calculation
        const finalDamage = Math.floor(baseDamage * totalMultiplier * critMultiplier);
        return { damage: finalDamage, isCrit };
    }

    // Start the game after class selection
    startGame() {
        this.gameStarted = true;
        // You can use this.selectedClass for player setup, stats, etc.
    }
}