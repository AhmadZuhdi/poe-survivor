// Health and regeneration logic for BattleScene

export function updatePlayerHealth(scene) {
    const multi = scene.calculateMultiplier();
    if (!multi[scene.CONSTANTS.multiplierTypes.lifeRegen]) {
        return;
    }
    const regenAmount = (scene.playerMaxHealth * multi[scene.CONSTANTS.multiplierTypes.lifeRegen]);
    scene.playerHealth = Math.min(scene.playerHealth + regenAmount, scene.playerMaxHealth);
}

export function updateHealthBar(scene) {
    if (!scene.player || !scene.healthBar || !scene.healthBarBg) return;
    const barWidth = 120;
    const barHeight = 16;
    const x = scene.player.x - barWidth / 2;
    const y = scene.player.y + 40;
    scene.healthBarBg.clear();
    scene.healthBarBg.fillStyle(0x222222, 1);
    scene.healthBarBg.fillRect(x, y, barWidth, barHeight);
    scene.healthBar.clear();
    // Health color: green to red
    const healthRatio = Math.max(scene.playerHealth / scene.playerMaxHealth, 0);
    // Use Phaser's color interpolation
    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        new Phaser.Display.Color(255, 0, 0),
        new Phaser.Display.Color(0, 255, 0),
        100,
        healthRatio * 100
    );
    const barColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    scene.healthBar.fillStyle(barColor, 1);
    scene.healthBar.fillRect(x + 2, y + 2, (barWidth - 4) * healthRatio, barHeight - 4);
    // Show health value above bar
    scene.healthValueText.setText(`HP: ${scene.playerHealth.toFixed(1)} / ${scene.playerMaxHealth}`);
    scene.healthValueText.setPosition(x + barWidth / 2 - scene.healthValueText.width / 2, y - 22);
}
