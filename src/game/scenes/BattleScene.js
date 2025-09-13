import { Scene } from 'phaser';
import { CharacterPanel } from '../ui/CharacterPanel';
import { SkillTreePanel } from '../ui/SkillTreePanel';
import { InventoryPanel } from '../ui/InventoryPanel';
import { setupCollisions } from './collision';
import { CONSTANTS } from '../class/constants';

export class BattleScene extends Scene {
    constructor() {
    // Wave system
    super('BattleScene');    
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
    // Player health
    this.playerMaxHealth = 100;
    this.playerHealth = this.playerMaxHealth;
    // Wave system
    this.wave = 1;
    this.waveEnemies = 0;
    this.waveBossSpawned = false;
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

    // Health bar graphics (create after player)
    this.healthBarBg = this.add.graphics();
    this.healthBarBg.setDepth(10);
    this.healthBar = this.add.graphics();
    this.healthBar.setDepth(11);
    this.updateHealthBar();

        // Setup collision logic
        setupCollisions(this);

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
        this.handleWaveLogic();
        this.handlePlayerMovement();
        // Call updatePlayerHealth only every second
        if (time > this.lastHealthRegen + 1000) {
            this.lastHealthRegen = time;
            this.updatePlayerHealth();
        }
        this.updateHealthBar();
        this.handleAutoAttack(time);
        this.handleEnemySpawn(time);
        this.handleBossSpawn();
        this.updateEnemyVelocity();
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
            this.isPaused = this.charPanel.visible || this.skillTreePanel.visible;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keySkillTree)) {
            this.skillTreePanel.toggle();
            // Always update skill points before opening
            this.skillTreePanel.updateSkillPoints(this.skillPoints);
            this.isPaused = this.charPanel.visible || this.skillTreePanel.visible;
        }
        if (Phaser.Input.Keyboard.JustDown(this.keyInventory)) {
            this.inventoryPanel.toggle();
            // Inventory panel does not pause the game by default
        }
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

    handleWaveLogic() {
        if (this.waveEnemies <= 0 && this.enemies.countActive(true) === 0) {
            this.wave++;
            this.waveText.setText('Wave: ' + this.wave);
            this.waveBossSpawned = false;
            this.waveEnemies = 5 + Math.floor(this.wave * 2.5);
            this.enemyInterval = Math.max(1000 - (this.wave * 40), 200);
        }
    }

    handlePlayerMovement() {
        const speed = 300;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown) {
            vx = -speed;
        } else if (this.cursors.right.isDown) {
            vx = speed;
        }
        if (this.cursors.up.isDown) {
            vy = -speed;
        } else if (this.cursors.down.isDown) {
            vy = speed;
        }
        this.player.body.setVelocity(vx, vy);
        if (vx !== 0 && vy !== 0) {
            this.player.body.velocity.normalize().scale(speed);
        }
    // Clamp player position within screen bounds
    const halfWidth = this.player.displayWidth / 2;
    const halfHeight = this.player.displayHeight / 2;
    const minX = halfWidth;
    const maxX = this.scale.width - halfWidth;
    const minY = halfHeight;
    const maxY = this.scale.height - halfHeight;
    this.player.x = Phaser.Math.Clamp(this.player.x, minX, maxX);
    this.player.y = Phaser.Math.Clamp(this.player.y, minY, maxY);
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
    // Handle enemy death (reusable)
    handleEnemyDeath(enemy) {
        if (!enemy || !enemy.active) return;
        enemy.setActive(false);
        enemy.setVisible(false);
        enemy.destroy();
        // You can add more logic here (e.g., drop loot, play animation, increment kill count)
        this.playerKills = (this.playerKills || 0) + 1;
        this.playerExp++;
        let leveledUp = false;
        if (this.playerExp >= this.playerExpToLevel) {
            this.playerLevel++;
            this.playerExp = 0;
            this.playerExpToLevel = this.baseExp * this.playerLevel;
            // Gain 1 skill point per level
            this.skillPoints++;
            leveledUp = true;
        }
        this.levelText.setText('Level: ' + this.playerLevel + ' | EXP: ' + this.playerExp + '/' + this.playerExpToLevel);
        // Always update skill points after level up
        if (leveledUp) {
            this.skillTreePanel.updateSkillPoints(this.skillPoints);
        }
    }

    handleEnemySpawn(time) {
        if (this.waveEnemies > 0 && time > this.lastEnemy + this.enemyInterval) {
            this.lastEnemy = time;
            const w = this.scale.width;
            const h = this.scale.height;
            let x, y;
            const edge = Phaser.Math.Between(0, 3);
            if (edge === 0) { x = Phaser.Math.Between(0, w); y = 0; }
            else if (edge === 1) { x = w; y = Phaser.Math.Between(0, h); }
            else if (edge === 2) { x = Phaser.Math.Between(0, w); y = h; }
            else { x = 0; y = Phaser.Math.Between(0, h); }
            const enemy = this.enemies.get(x, y, 'enemy');
            if (enemy) {
                enemy.setActive(true).setVisible(true);
                enemy.setData('health', 30);
                this.waveEnemies--;
            }
        }
    }

    handleBossSpawn() {
        const isBossWave = this.wave % 10 === 0;
        if (isBossWave && !this.waveBossSpawned && this.enemies.countActive(true) === 0) {
            this.waveBossSpawned = true;
            const w = this.scale.width;
            const h = this.scale.height;
            let x, y;
            const edge = Phaser.Math.Between(0, 3);
            if (edge === 0) { x = Phaser.Math.Between(0, w); y = 0; }
            else if (edge === 1) { x = w; y = Phaser.Math.Between(0, h); }
            else if (edge === 2) { x = Phaser.Math.Between(0, w); y = h; }
            else { x = 0; y = Phaser.Math.Between(0, h); }
            const boss = this.enemies.get(x, y, 'enemy');
            if (boss) {
                boss.setActive(true).setVisible(true);
                boss.setData('health', 300 + this.wave * 20);
                boss.setScale(2);
                boss.setTint(0xff00ff);
                boss.setData('isBoss', true);
            }
        }
    }

    updateEnemyVelocity() {
        this.enemies.children.each((enemy) => {
            if (!enemy.active) return;
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const vx = (dx / dist) * this.enemySpeed;
                const vy = (dy / dist) * this.enemySpeed;
                enemy.body.setVelocity(vx, vy);
            }
        });
    }

    cleanupProjectilesAndEnemies() {
        this.projectiles.children.each((proj) => {
            if (proj.y < -10) proj.destroy();
        });
        this.enemies.children.each((enemy) => {
            if (enemy.x < -50 || enemy.x > this.scale.width + 50 || enemy.y < -50 || enemy.y > this.scale.height + 50) enemy.destroy();
        });
    }

    handleGameOver() {
        if (this.playerHealth <= 0) {
            // You can add game over logic here
        }
    }

    // Draw/update health bar
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
            this.handleEnemyDeath(enemy);
        }
    }

    updatePlayerHealth() {
        const multi = this.calculateMultiplier();
        // console.log(multi);
        if (!multi[CONSTANTS.multiplierTypes.lifeRegen]) {
            return;
        }

        const regenAmount = (this.playerMaxHealth * multi[CONSTANTS.multiplierTypes.lifeRegen]);
        console.log('Regen Amount:', regenAmount);
        this.playerHealth = Math.min(this.playerHealth + regenAmount, this.playerMaxHealth);
    }

    updateHealthBar() {
        
        if (!this.player || !this.healthBar || !this.healthBarBg) return;

        const barWidth = 120;
        const barHeight = 16;
        const x = this.player.x - barWidth / 2;
        const y = this.player.y + 40;
        this.healthBarBg.clear();
        this.healthBarBg.fillStyle(0x222222, 1);
        this.healthBarBg.fillRect(x, y, barWidth, barHeight);
        this.healthBar.clear();
        // Health color: green to red
        const healthRatio = Math.max(this.playerHealth / this.playerMaxHealth, 0);
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
            new Phaser.Display.Color(255, 0, 0),
            new Phaser.Display.Color(0, 255, 0),
            100,
            healthRatio * 100
        );
        const barColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
        this.healthBar.fillStyle(barColor, 1);
        this.healthBar.fillRect(x + 2, y + 2, (barWidth - 4) * healthRatio, barHeight - 4);
        // Show health value above bar
        this.healthValueText.setText(`HP: ${this.playerHealth} / ${this.playerMaxHealth}`);
        this.healthValueText.setPosition(x + barWidth / 2 - this.healthValueText.width / 2, y - 22);
    }

    characterStats() {
        return {
            basePhysDamage: 10 + ((this.selectedClass?.base_str || 0) * 0.5),
            baseMagicDamage: 10 + ((this.selectedClass?.base_int || 0) * 0.5),
            baseAttackSpeed: 1.0 + ((this.selectedClass?.base_dex || 0) * 0.1)
        }
    }

    calculateMultiplier() {
        const stats = this.skillTreePanel.calculateStats();
        let multiplier = {};

        const skillMultipliers = {
            [CONSTANTS.damageTypes.physical]: [
                {
                    regex: /(\d+?)% increased attack physical damage/g,
                    handler: (match) => parseFloat(match[1]) / 100
                },
                {
                    regex: /(\d+?)% increased melee damage/g,
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
            const stats = this.characterStats();
            return { damage: stats.basePhysDamage, isCrit: false };
        }

        // Get base damage type
        const stats = this.characterStats();
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
        if (damageType === CONSTANTS.damageTypes.physical && multipliers[CONSTANTS.damageTypes.physical]) {
            totalMultiplier += multipliers[CONSTANTS.damageTypes.physical];
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
