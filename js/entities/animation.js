/**
 * VOVINAM: HUYET CHIEN GIA TOC
 * js/entities/animation.js - Entry point cua procedural skeletal animation.
 *
 * Thu tu load bat buoc:
 *   js/entities/animation/animationData.js
 *   js/entities/animation/animationBase.js
 *   js/entities/animation/animationPose.js
 *   js/entities/animation/animationRenderBase.js
 *   js/entities/animation/animationWeapon.js
 *   js/entities/animation/animationBody.js
 *   js/entities/animation.js  (file nay)
 */

class SkeletalRenderer extends window.SkeletalRendererBody {}

const skeletalRenderer = new SkeletalRenderer();
window.skeletalRenderer = skeletalRenderer;
window.SkeletalRenderer = SkeletalRenderer;
