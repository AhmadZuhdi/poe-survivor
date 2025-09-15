// Enemy logic for BattleScene
import { MONSTERS } from "../../class/monster/monsters";

export function handleEnemySpawn(scene, time) {
    if (scene.waveEnemies > 0 && time > scene.lastEnemy + scene.enemyInterval) {
        scene.lastEnemy = time;
        const w = scene.scale.width;
        const h = scene.scale.height;
        let x, y;
        const edge = Phaser.Math.Between(0, 3);
        if (edge === 0) { x = Phaser.Math.Between(0, w); y = 0; }
        else if (edge === 1) { x = w; y = Phaser.Math.Between(0, h); }
        else if (edge === 2) { x = Phaser.Math.Between(0, w); y = h; }
        else { x = 0; y = Phaser.Math.Between(0, h); }
        
        // Randomly select a monster from MONSTERS
        const monsterKeys = Object.keys(MONSTERS);
        const randomMonsterKey = monsterKeys[Phaser.Math.Between(0, monsterKeys.length - 1)];
        const MonsterClass = MONSTERS[randomMonsterKey];
        const monsterInstance = new MonsterClass();
        
        // Generate the visual for this monster type if texture doesn't exist
        const textureKey = monsterInstance.getTextureKey();
        if (!scene.textures.exists(textureKey)) {
            monsterInstance.generateVisual(scene, 0, 0);
        }
        
        const enemy = scene.enemies.get(x, y, textureKey);
        if (enemy) {
            enemy.setActive(true).setVisible(true);
            enemy.setData('health', monsterInstance.health);
            enemy.setData('monster', monsterInstance);
            enemy.setData('range', monsterInstance.range);
            enemy.setData('lastAttack', 0);
            scene.waveEnemies--;
        }
    }
}

export function updateEnemyVelocity(scene) {
    scene.enemies.children.each((enemy) => {
        if (!enemy.active) return;
        
        const monsterRange = enemy.getData('range') || 1;
        const dx = scene.player.x - enemy.x;
        const dy = scene.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (monsterRange > 3) {
            // Ranged monsters - stop moving when in range and shoot projectiles
            const attackRange = 200; // pixels
            if (dist <= attackRange) {
                enemy.body.setVelocity(0, 0);
                handleRangedAttack(scene, enemy);
            } else {
                // Move closer until in range
                if (dist > 0) {
                    const vx = (dx / dist) * scene.enemySpeed * 0.5; // Slower movement for ranged
                    const vy = (dy / dist) * scene.enemySpeed * 0.5;
                    enemy.body.setVelocity(vx, vy);
                }
            }
        } else {
            // Melee monsters - move directly toward player
            if (dist > 0) {
                const vx = (dx / dist) * scene.enemySpeed;
                const vy = (dy / dist) * scene.enemySpeed;
                enemy.body.setVelocity(vx, vy);
            }
        }
    });
}

export function handleEnemyDeath(scene, enemy) {
    if (!enemy || !enemy.active) return;
    enemy.setActive(false);
    enemy.setVisible(false);
    enemy.destroy();
    scene.playerKills = (scene.playerKills || 0) + 1;
    scene.playerExp++;
    let leveledUp = false;
    if (scene.playerExp >= scene.playerExpToLevel) {
        scene.playerLevel++;
        scene.playerExp = 0;
        scene.playerExpToLevel = scene.baseExp * scene.playerLevel;
        scene.skillPoints++;
        leveledUp = true;
    }
    scene.levelText.setText('Level: ' + scene.playerLevel + ' | EXP: ' + scene.playerExp + '/' + scene.playerExpToLevel);
    if (leveledUp) {
        scene.skillTreePanel.updateSkillPoints(scene.skillPoints);
    }
}

export function handleRangedAttack(scene, enemy) {
    const currentTime = scene.time.now;
    const lastAttack = enemy.getData('lastAttack') || 0;
    const attackCooldown = 2000; // 2 seconds between attacks
    
    if (currentTime > lastAttack + attackCooldown) {
        enemy.setData('lastAttack', currentTime);
        
        // Create enemy projectile
        const dx = scene.player.x - enemy.x;
        const dy = scene.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            const projectileSpeed = 200;
            const vx = (dx / dist) * projectileSpeed;
            const vy = (dy / dist) * projectileSpeed;
            
            // Create enemy projectile (different from player projectiles)
            if (!scene.enemyProjectiles) {
                scene.enemyProjectiles = scene.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });
                // Set up collision detection for enemy projectiles when group is first created
                if (scene.setupEnemyProjectileCollisions) {
                    scene.setupEnemyProjectileCollisions();
                }
            }
            
            const projectile = scene.enemyProjectiles.get(enemy.x, enemy.y, 'projectile');
            if (projectile) {
                projectile.setActive(true).setVisible(true);
                projectile.setTint(0xff0000); // Red tint for enemy projectiles
                projectile.body.setVelocity(vx, vy);
                const damage = calculateEnemyDamage(enemy);
                projectile.setData('damage', damage);
                
                // Auto-destroy projectile after 3 seconds
                scene.time.delayedCall(3000, () => {
                    if (projectile && projectile.active) {
                        projectile.destroy();
                    }
                });
            }
        }
    }
}

export function handleMeleeCollision(scene, player, enemy) {
    const monsterRange = enemy.getData('range') || 1;
    
    if (monsterRange < 3) {
        // Deal damage to player
        const damage = calculateEnemyDamage(enemy);
        scene.playerHealth = Math.max(0, scene.playerHealth - damage);
        
        // Destroy the enemy after dealing damage
        enemy.setActive(false);
        enemy.setVisible(false);
        enemy.destroy();
        
        // Removed screen shake effect
    }
}

function calculateEnemyDamage(enemy) {
    const monster = enemy.getData('monster');
    if (monster && typeof monster.calculateDamage === 'function') {
        const damageResult = monster.calculateDamage();
        // Handle both object format {damage: number} and direct number
        return damageResult?.damage || damageResult || 15;
    }
    // Fallback damage if monster doesn't have calculateDamage
    return 0;
}
