/**
 * VOVINAM: HUYẾT CHIẾN GIA TỘC
 * js/entities/player/playerUltimate.js - Ủy quyền thực thi Tuyệt kỹ & Finisher về module riêng của từng nhân vật.
 */

(function () {
class PlayerUltimate extends window.PlayerDamage {
  runUltimate(st, dt, enemies) {
    const p = window.AnimUtil ? AnimUtil.progress(this) : 0;
    this.invincibleTimer = Math.max(this.invincibleTimer, 0.12);

    const hitEnemy = (e, dmg, kb, knockdown) => {
      if (!e || e.isDead) return false;
      const allyBuff = (typeof this.allyDmgBuff === 'number' && this.allyDmgBuff > 0) ? this.allyDmgBuff : 1;
      const real = Math.round(dmg * (this.dmgMul || 1) * allyBuff);
      e.takeDamage(real, this.facing * kb, knockdown);
      if (window.audioManager) window.audioManager.playPunch();
      if (window.effectManager) window.effectManager.createHitSparks(e.x, e.y - 55, 7, true);
      if (window.combatSystem) window.combatSystem.registerHit(true, e, real, false);
      return true;
    };

    if (window.CharacterRegistry && window.CharacterRegistry.runUltimate(this, st, dt, enemies, { p, hitEnemy })) {
      return;
    }

    this.setState('idle');
  }

  // ==========================================================================
  // FINISHER riêng (kết thúc chuỗi combo khi đã nối đủ 2 đòn ở cự ly gần)
  // ==========================================================================
  doFinisher() {
    const cfg = window.CharacterRegistry
      ? window.CharacterRegistry.getFinisherConfig(this)
      : { state: 'kick_roundhouse', dur: 0.74, lunge: 170, shake: true };

    this._finisherState = cfg.state;
    if (cfg.state === 'flying_kick') {
      this.z = -0.5;
      this.vz = 70;
    }
    this.comboStep = 0;
    this.startAttack(cfg.state, cfg.dur, cfg.lunge);
    if (window.effectManager) window.effectManager.addGhostTrail(this, 'rgba(255, 255, 255, 0.45)');
    if (cfg.shake || this.finisher === 'bash' || this.finisher === 'heavy') {
      if (window.effectManager) window.effectManager.triggerScreenShake(6, 0.2);
      if (window.audioManager) window.audioManager.playWarning();
    }
  }

  finisherAttackData() {
    if (window.CharacterRegistry) {
      return window.CharacterRegistry.getFinisherAttackData(this);
    }
    return null;
  }
}

window.PlayerUltimate = PlayerUltimate;
})();
