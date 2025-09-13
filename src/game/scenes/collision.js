// Handles collision logic for BattleScene
export function setupCollisions(scene) {
    // Projectile vs Enemy
    scene.physics.add.overlap(scene.projectiles, scene.enemies, (projectile, enemy) => {
        projectile.destroy();
        scene.applyDamageToEnemy(enemy);
    });

    // Player vs Enemy
    scene.physics.add.overlap(scene.player, scene.enemies, (player, enemy) => {
        if (scene.playerHealth > 0) {
            scene.playerHealth -= 10;
            enemy.destroy();
        }
    });
}