// Handles collision logic for BattleScene
import { handleMeleeCollision } from './enemy';

export function setupCollisions(scene) {
    // Projectile vs Enemy
    scene.physics.add.overlap(scene.projectiles, scene.enemies, (projectile, enemy) => {
        projectile.destroy();
        scene.applyDamageToEnemy(enemy);
    });

    // Player vs Enemy (melee collision)
    scene.physics.add.overlap(scene.player, scene.enemies, (player, enemy) => {
        if (scene.playerHealth > 0) {
            handleMeleeCollision(scene, player, enemy);
        }
    });

    // Note: Enemy projectile collisions are set up dynamically in BattleScene.js
    // when the enemyProjectiles group is first created
}