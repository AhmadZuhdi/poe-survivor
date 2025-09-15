// Player logic for BattleScene

export function handlePlayerMovement(scene) {
    const speed = 300;
    let vx = 0, vy = 0;
    if (scene.cursors.left.isDown) {
        vx = -speed;
    } else if (scene.cursors.right.isDown) {
        vx = speed;
    }
    if (scene.cursors.up.isDown) {
        vy = -speed;
    } else if (scene.cursors.down.isDown) {
        vy = speed;
    }
    scene.player.body.setVelocity(vx, vy);
    if (vx !== 0 && vy !== 0) {
        scene.player.body.velocity.normalize().scale(speed);
    }
    // Clamp player position within screen bounds
    const halfWidth = scene.player.displayWidth / 2;
    const halfHeight = scene.player.displayHeight / 2;
    const minX = halfWidth;
    const maxX = scene.scale.width - halfWidth;
    const minY = halfHeight;
    const maxY = scene.scale.height - halfHeight;
    scene.player.x = Phaser.Math.Clamp(scene.player.x, minX, maxX);
    scene.player.y = Phaser.Math.Clamp(scene.player.y, minY, maxY);
}

export function characterStats(scene) {
    return {
        basePhysDamage: 10 + ((scene.selectedClass?.base_str || 0) * 0.5),
        baseMagicDamage: 10 + ((scene.selectedClass?.base_int || 0) * 0.5),
        baseAttackSpeed: 1.0 + ((scene.selectedClass?.base_dex || 0) * 0.1)
    };
}
