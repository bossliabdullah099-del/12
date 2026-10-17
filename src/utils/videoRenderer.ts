// Boss AI Google Flow 5-Second Video Rendering Engine (Canvas 60fps + MediaStream Recorder)

import { VideoScene, VideoPromptAnalysis } from '../types';

export interface RenderOptions {
  prompt: string;
  style: string;
  aspectRatio: '16:10' | '3:2' | '4:3' | '19.5:9' | '18:9' | '16:9' | '9:16' | '1:1';
  scenes: VideoScene[];
  analysis?: VideoPromptAnalysis;
  cameraTrajectory?: string;
  flowSpeed?: number; // 1 to 10
  showFlowVectors?: boolean;
  onProgress?: (progressPercent: number, currentSecond: number) => void;
}

export class VideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 1280;
  private height: number = 720;
  private particles: Array<{ x: number; y: number; z: number; size: number; speed: number; color: string }> = [];
  private loadedImages: Map<number, HTMLImageElement> = new Map();

  constructor(width = 1280, height = 720) {
    this.canvas = document.createElement('canvas');
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;
    this.initParticles();
  }

  public async preloadSceneImages(scenes: VideoScene[]): Promise<void> {
    const promises = scenes.map((scene, idx) => {
      if (!scene.imageUrl) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.loadedImages.set(idx, img);
          resolve();
        };
        img.onerror = () => {
          resolve(); // gracefully fallback if offline
        };
        img.src = scene.imageUrl!;
        setTimeout(resolve, 3000); // 3-second safeguard
      });
    });
    await Promise.all(promises);
  }

  private initParticles() {
    this.particles = [];
    for (let i = 0; i < 240; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * this.width * 2,
        y: (Math.random() - 0.5) * this.height * 2,
        z: Math.random() * 1000 + 1,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 6 + 4,
        color: ['#00f0ff', '#ff007f', '#7000ff', '#ffffff', '#ffd700'][Math.floor(Math.random() * 5)],
      });
    }
  }

  // Render a specific frame at time `t` (0 to 5 seconds)
  public renderFrame(t: number, options: RenderOptions) {
    const { width, height, ctx } = this;
    const progress = Math.min(Math.max(t / 5, 0), 1);
    const speedMult = Math.max(0.3, Math.min(2.5, ((options.flowSpeed ?? 5) / 5)));

    // Google Flow 5s Arc: 2 temporal keyframes (0.0s - 2.5s and 2.5s - 5.0s)
    const sceneIndex = t < 2.5 ? 0 : 1;
    const scene: VideoScene = options.scenes[sceneIndex] || options.scenes[0] || {
      index: sceneIndex + 1,
      timeRange: sceneIndex === 0 ? '0.0s - 2.5s' : '2.5s - 5.0s',
      title: sceneIndex === 0 ? 'Flow Genesis' : 'Flow Apex',
      visualDesc: options.prompt,
      caption: options.prompt,
      colorMood: '#0a84ff',
      cameraMotion: options.cameraTrajectory || '35mm Tracking Dolly Push',
    };

    const sceneImg0 = this.loadedImages.get(0);
    const sceneImg1 = this.loadedImages.get(1);

    // Camera Motion Trajectory Evaluation
    const globalProgress = t / 5; // 0.0 to 1.0
    let scale = 1.05 + globalProgress * 0.25 * speedMult;
    let panX = 0;
    let panY = 0;
    let rot = 0;

    const motion = (options.cameraTrajectory || options.analysis?.camera || scene.cameraMotion || '').toLowerCase();
    if (motion.includes('pan left') || motion.includes('left')) {
      panX = -globalProgress * 90 * speedMult;
    } else if (motion.includes('pan right') || motion.includes('right')) {
      panX = globalProgress * 90 * speedMult;
    } else if (motion.includes('orbit') || motion.includes('360') || motion.includes('arc')) {
      panX = Math.sin(globalProgress * Math.PI) * 75 * speedMult;
      rot = Math.sin(globalProgress * Math.PI) * 0.035 * speedMult;
    } else if (motion.includes('drone') || motion.includes('dive') || motion.includes('fpv')) {
      scale = 1.0 + globalProgress * 0.45 * speedMult;
      panY = -globalProgress * 60 * speedMult;
      rot = (globalProgress - 0.5) * 0.03 * speedMult;
    } else if (motion.includes('crane') || motion.includes('pedestal') || motion.includes('up')) {
      scale = 1.05 + globalProgress * 0.15;
      panY = globalProgress * 65 * speedMult;
    } else if (motion.includes('out') || motion.includes('pull')) {
      scale = 1.35 - globalProgress * 0.25 * speedMult;
      panY = globalProgress * 20;
    } else if (motion.includes('static')) {
      scale = 1.02;
    } else {
      // Standard smooth Anamorphic Dolly In
      scale = 1.02 + globalProgress * 0.3 * speedMult;
    }

    // Action Kinetics Evaluation (Dance, Run, Fly, etc.)
    const fullPromptText = `${options.prompt} ${options.analysis?.action || ''} ${options.analysis?.subject || ''}`.toLowerCase();
    const isDance = /danc|groov|disco|salsa|party|boogie|waltz|ballet|hip\s*hop|tap/i.test(fullPromptText);
    const isRun = /run|sprint|dash|chase|speed|fast|race/i.test(fullPromptText);
    const isFly = /fly|soar|glide|drone|aerial|wing/i.test(fullPromptText);

    if (isDance) {
      // 124 BPM Synchronized Dance Choreography: Rhythmic beat bounce, hip sway & head tilts
      const bpm = 124;
      const beat = t * (bpm / 60);
      const beatFraction = beat % 1;
      const bounce = -Math.abs(Math.sin(beatFraction * Math.PI)) * 26 * speedMult;
      const sway = Math.sin(beat * Math.PI * 0.5) * 32 * speedMult;
      const tilt = Math.sin(beat * Math.PI * 0.5) * 0.05 * speedMult;
      const pulse = 1.0 + (beatFraction < 0.2 ? 0.038 : 0);

      panY += bounce;
      panX += sway;
      rot += tilt;
      scale *= pulse;
    } else if (isRun) {
      // Running / sprinting stride bounce
      const runBounce = -Math.abs(Math.sin(t * 14)) * 18 * speedMult;
      panY += runBounce;
      rot += Math.sin(t * 7) * 0.025;
    } else if (isFly) {
      // Flying / soaring smooth altitude glide
      panY += Math.sin(t * 2.2) * 25 * speedMult;
      rot += Math.sin(t * 1.5) * 0.03;
    }

    // Draw background and keyframes
    if (sceneImg0 && sceneImg0.complete && sceneImg0.naturalWidth > 0) {
      // Draw Base Keyframe (Keyframe 0)
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(rot);
      ctx.scale(scale, scale);

      const drawCoverImage = (img: HTMLImageElement, alpha = 1) => {
        ctx.globalAlpha = alpha;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = width / height;
        let drawW = width;
        let drawH = height;
        if (imgRatio > canvasRatio) {
          drawW = height * imgRatio;
        } else {
          drawH = width / imgRatio;
        }
        ctx.drawImage(img, -drawW / 2 + panX, -drawH / 2 + panY, drawW, drawH);
      };

      drawCoverImage(sceneImg0, 1);

      // If Keyframe 1 exists, cross-dissolve seamlessly during the 2nd half (1.8s to 3.5s)
      if (sceneImg1 && sceneImg1.complete && sceneImg1.naturalWidth > 0 && t > 1.8) {
        const blend = Math.min(Math.max((t - 1.8) / 1.4, 0), 1);
        drawCoverImage(sceneImg1, blend);
      }

      ctx.restore();
      ctx.globalAlpha = 1;

      // Draw dynamic stage lights & dance floor pulse if dancing
      if (isDance) {
        this.drawDanceStageEffects(t, speedMult);
      }
    } else {
      // Fallback procedural background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      if (options.style.includes('Cyberpunk') || options.prompt.toLowerCase().includes('cyber')) {
        grad.addColorStop(0, '#0d0221');
        grad.addColorStop(0.5, '#0f084b');
        grad.addColorStop(1, '#26081c');
      } else if (options.style.includes('Anime') || options.prompt.toLowerCase().includes('anime')) {
        grad.addColorStop(0, '#1a103c');
        grad.addColorStop(0.5, '#2b1b54');
        grad.addColorStop(1, '#ff6b8b');
      } else if (options.style.includes('Sci-Fi') || options.prompt.toLowerCase().includes('space')) {
        grad.addColorStop(0, '#000814');
        grad.addColorStop(0.5, '#001d3d');
        grad.addColorStop(1, '#003566');
      } else {
        grad.addColorStop(0, '#090a0f');
        grad.addColorStop(0.5, '#121626');
        grad.addColorStop(1, '#1b2238');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Core glow
      const horizon = height * 0.25;
      const coreGrad = ctx.createRadialGradient(width / 2, horizon, 10, width / 2, horizon, 280);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGrad.addColorStop(0.3, 'rgba(255, 100, 150, 0.55)');
      coreGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.35)');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(width / 2, horizon, 280, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Atmospheric Particle System matching the prompt
    const isRain = /rain|storm|wet|cyberpunk|water/i.test(options.prompt);
    const isEmber = /fire|flame|lava|sunset|sun|golden/i.test(options.prompt);

    for (const p of this.particles) {
      if (isRain) {
        // Falling rain streaks
        p.y += p.speed * 3 * speedMult;
        p.x -= 1.8;
        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width * 1.2;
        }
        ctx.strokeStyle = 'rgba(180, 230, 255, 0.45)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 3, p.y + p.size * 6);
        ctx.stroke();
      } else if (isEmber) {
        // Floating ember sparks
        p.y -= p.speed * 1.0 * speedMult;
        p.x += Math.sin(t * 2 + p.z) * 2;
        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 180, 0, 0.8)' : 'rgba(255, 70, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.9, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Stardust & ambient volumetric motes
        p.z -= p.speed * 2.2 * speedMult;
        if (p.z <= 1) {
          p.z = 1000;
          p.x = (Math.random() - 0.5) * width * 2;
          p.y = (Math.random() - 0.5) * height * 2;
        }
        const k = 400 / p.z;
        const px = width / 2 + p.x * k;
        const py = height / 2 + p.y * k;
        const pSize = Math.max(p.size * k * 0.55, 0.8);

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 3. Google Flow Anamorphic Streak at Keyframe Apex (around 2.0s - 3.2s)
    if (t >= 2.0 && t <= 3.2) {
      const flareProgress = Math.sin(((t - 2.0) / 1.2) * Math.PI);
      const flareY = height * 0.45;
      const flareGrad = ctx.createLinearGradient(0, flareY, width, flareY);
      flareGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      flareGrad.addColorStop(0.3, `rgba(0, 240, 255, ${flareProgress * 0.25})`);
      flareGrad.addColorStop(0.5, `rgba(255, 255, 255, ${flareProgress * 0.7})`);
      flareGrad.addColorStop(0.7, `rgba(255, 0, 128, ${flareProgress * 0.25})`);
      flareGrad.addColorStop(1, 'rgba(255, 0, 128, 0)');

      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, flareY - 1.5, width, 3);

      const centerGlow = ctx.createRadialGradient(width / 2, flareY, 2, width / 2, flareY, 80);
      centerGlow.addColorStop(0, `rgba(255, 255, 255, ${flareProgress * 0.8})`);
      centerGlow.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = centerGlow;
      ctx.beginPath();
      ctx.arc(width / 2, flareY, 80, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Optical Flow Vectors Overlay (Google Flow Latent Motion Field)
    if (options.showFlowVectors) {
      this.drawOpticalFlowVectors(t, motion, speedMult);
    }

    // 5. Cinematic Vignette Overlay
    const vigGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.28,
      width / 2,
      height / 2,
      width * 0.72
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.62)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);

    // 6. Google Flow Director HUD
    // Top Bar: Google Flow Brand & Identified Subject
    ctx.fillStyle = 'rgba(4, 6, 14, 0.72)';
    ctx.fillRect(0, 0, width, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('AI VIDEO 5s', 24, 32);

    // Identified Subject Pill
    const subjectText = options.analysis?.subject || options.prompt;
    ctx.fillStyle = 'rgba(255, 75, 110, 0.25)';
    ctx.strokeStyle = 'rgba(255, 75, 110, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(220, 14, Math.min(width - 450, 500), 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff7597';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`PROMPT: ${subjectText.slice(0, 52)}${subjectText.length > 52 ? '...' : ''}`, 230, 31);

    // Optical Flow indicator badge if active
    if (options.showFlowVectors) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect?.(width - 400, 14, 150, 26, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.font = '700 10px monospace';
      ctx.fillText('FLOW VECTORS: ON', width - 388, 31);
    }

    // Timecode: 00:00.00 - 00:05.00
    const secStr = Math.floor(t).toString().padStart(2, '0');
    const msStr = Math.floor((t % 1) * 100).toString().padStart(2, '0');
    ctx.fillStyle = '#00f0ff';
    ctx.font = '600 13px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`REC [${secStr}:${msStr} / 05:00]`, width - 24, 32);
    ctx.textAlign = 'left';

    // Bottom Lower Third: Scene Name, Visual Action & Camera Motion
    ctx.fillStyle = 'rgba(8, 12, 22, 0.88)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect?.(24, height - 88, width - 48, 60, 12);
    ctx.fill();
    ctx.stroke();

    // Google Flow Badge
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.roundRect?.(38, height - 74, 94, 32, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`FLOW ${sceneIndex === 0 ? 'GENESIS' : 'APEX'}`, 44, height - 54);

    // Scene Title & Caption
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(scene.title || (sceneIndex === 0 ? 'Flow Vector Initiation' : 'Culmination & Hero Lock'), 144, height - 58);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '400 11px "Plus Jakarta Sans", sans-serif';
    const displayCaption = scene.caption || scene.visualDesc || options.prompt;
    ctx.fillText(
      displayCaption.length > 75 ? displayCaption.slice(0, 75) + '...' : displayCaption,
      144,
      height - 42
    );

    // Camera Motion Tag on right
    const camTag = options.cameraTrajectory || options.analysis?.camera || scene.cameraMotion || '35mm Dolly In';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect?.(width - 230, height - 74, 190, 32, 6);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CAM: ${camTag.slice(0, 20)}`, width - 135, height - 54);
    ctx.textAlign = 'left';

    // 5s Progress timeline bar at bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(0, height - 5, width, 5);

    const barGrad = ctx.createLinearGradient(0, 0, width * progress, 0);
    barGrad.addColorStop(0, '#f43f5e');
    barGrad.addColorStop(0.5, '#a855f7');
    barGrad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, height - 5, width * progress, 5);
  }

  // Draw authentic Google Flow optical flow motion vector needles across the canvas
  private drawOpticalFlowVectors(t: number, motion: string, speedMult: number) {
    const { width, height, ctx } = this;
    const cols = 12;
    const rows = 7;
    const stepX = width / cols;
    const stepY = height / rows;
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.save();
    for (let c = 1; c < cols; c++) {
      for (let r = 1; r < rows; r++) {
        const x = c * stepX;
        const y = r * stepY;

        // Skip area behind HUD
        if (y < 65 || y > height - 95) continue;

        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let vx = 0;
        let vy = 0;

        if (motion.includes('pan left') || motion.includes('left')) {
          vx = 14 * speedMult;
          vy = Math.sin(t * 3 + c) * 1.5;
        } else if (motion.includes('pan right') || motion.includes('right')) {
          vx = -14 * speedMult;
          vy = Math.sin(t * 3 + c) * 1.5;
        } else if (motion.includes('orbit') || motion.includes('360')) {
          // Tangential circular vector
          vx = (-dy / (dist || 1)) * 12 * speedMult;
          vy = (dx / (dist || 1)) * 12 * speedMult;
        } else if (motion.includes('crane') || motion.includes('up')) {
          vx = 0;
          vy = 12 * speedMult;
        } else if (motion.includes('out') || motion.includes('pull')) {
          // Inward vector
          vx = (-dx / (dist || 1)) * 14 * speedMult;
          vy = (-dy / (dist || 1)) * 14 * speedMult;
        } else {
          // Standard Dolly In: Outward radial vector
          vx = (dx / (dist || 1)) * 14 * speedMult;
          vy = (dy / (dist || 1)) * 14 * speedMult;
        }

        // Draw dot at origin
        ctx.fillStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Draw vector needle
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + vx, y + vy);
        ctx.stroke();

        // Draw arrow head
        const angle = Math.atan2(vy, vx);
        const headLen = 4;
        ctx.strokeStyle = 'rgba(255, 0, 128, 0.7)';
        ctx.beginPath();
        ctx.moveTo(x + vx, y + vy);
        ctx.lineTo(x + vx - headLen * Math.cos(angle - Math.PI / 6), y + vy - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x + vx, y + vy);
        ctx.lineTo(x + vx - headLen * Math.cos(angle + Math.PI / 6), y + vy - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Draw dynamic disco stage lights, sweeps, and music notes for dance actions
  private drawDanceStageEffects(t: number, speedMult: number) {
    const { width, height, ctx } = this;
    const bpm = 124;
    const beat = t * (bpm / 60);
    const beatFraction = beat % 1;

    ctx.save();

    // 1. Dual Sweeping Stage Spotlights
    const spotAngleLeft = Math.PI * 0.25 + Math.sin(t * 3.0) * 0.22;
    const spotAngleRight = Math.PI * 0.75 - Math.sin(t * 3.0) * 0.22;

    const drawSpotlight = (startX: number, startY: number, angle: number, color: string) => {
      const length = height * 1.3;
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      const beamW = 120 + Math.sin(t * 4) * 20;

      const grad = ctx.createLinearGradient(startX, startY, endX, endY);
      grad.addColorStop(0, color);
      grad.addColorStop(0.6, color.replace(/[\d.]+\)$/, '0.12)'));
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX - beamW, endY);
      ctx.lineTo(endX + beamW, endY);
      ctx.closePath();
      ctx.fill();
    };

    drawSpotlight(width * 0.15, -10, spotAngleLeft, 'rgba(255, 215, 0, 0.22)');
    drawSpotlight(width * 0.85, -10, spotAngleRight, 'rgba(236, 72, 153, 0.22)');

    // 2. Pulsing Dance Floor Ring under the dancing character
    const floorY = height * 0.78;
    const pulseRadius = 140 + (1 - beatFraction) * 45;
    const floorAlpha = Math.max(0.15, (1 - beatFraction) * 0.45);
    const floorGrad = ctx.createRadialGradient(width / 2, floorY, 10, width / 2, floorY, pulseRadius);
    floorGrad.addColorStop(0, `rgba(255, 215, 0, ${floorAlpha})`);
    floorGrad.addColorStop(0.5, `rgba(236, 72, 153, ${floorAlpha * 0.6})`);
    floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.scale(1, 0.35);
    ctx.fillStyle = floorGrad;
    ctx.beginPath();
    ctx.arc(width / 2, floorY / 0.35, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Floating Musical Notes & Golden Sparks
    const notes = ['♪', '♫', '♬', '♩', '✦'];
    ctx.font = '700 22px sans-serif';
    for (let i = 0; i < 6; i++) {
      const noteProgress = ((t * 0.6 + i * 0.18) % 1);
      const noteX = width / 2 + Math.sin(t * 2 + i * 1.5) * 180 + (i - 2.5) * 40;
      const noteY = height * 0.75 - noteProgress * height * 0.55;
      const noteAlpha = Math.sin(noteProgress * Math.PI) * 0.85;

      ctx.fillStyle = i % 2 === 0 ? `rgba(255, 215, 0, ${noteAlpha})` : `rgba(236, 72, 153, ${noteAlpha})`;
      ctx.fillText(notes[i % notes.length], noteX, noteY);
    }

    ctx.restore();
  }

  // Generate 5-second video blob via MediaRecorder
  public async generateVideoBlob(options: RenderOptions): Promise<Blob> {
    // Ensure images are preloaded before recording
    await this.preloadSceneImages(options.scenes);

    // Ensure frame 0 is rendered first so canvas has initial frame
    this.renderFrame(0, options);

    const getStream = () => {
      if (typeof this.canvas.captureStream === 'function') {
        return this.canvas.captureStream(30);
      }
      if (typeof (this.canvas as any).mozCaptureStream === 'function') {
        return (this.canvas as any).mozCaptureStream(30);
      }
      return null;
    };

    const stream = getStream();
    if (!stream || typeof MediaRecorder === 'undefined') {
      console.warn('Canvas captureStream or MediaRecorder not available, returning procedural fallback blob.');
      return new Blob([], { type: 'video/webm' });
    }

    // Create synthesized audio track for the video
    let combinedStream = stream;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      try {
        const audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume().catch(() => {});
        }
        const dest = audioCtx.createMediaStreamDestination();
        const now = audioCtx.currentTime;

        const isDance = /danc|groov|disco|salsa|party|boogie|waltz|ballet|hip\s*hop|tap/i.test(
          `${options.prompt} ${options.analysis?.action || ''}`
        );

        if (isDance) {
          // 124 BPM 4-on-the-floor kick drum + clap + bass groove
          const bpm = 124;
          const beatDuration = 60 / bpm; // ~0.484s
          const totalBeats = Math.floor(5.0 / beatDuration);

          for (let b = 0; b < totalBeats; b++) {
            const beatT = now + b * beatDuration;
            // Kick drum
            const kickOsc = audioCtx.createOscillator();
            const kickGain = audioCtx.createGain();
            kickOsc.frequency.setValueAtTime(140, beatT);
            kickOsc.frequency.exponentialRampToValueAtTime(42, beatT + 0.12);
            kickGain.gain.setValueAtTime(0.45, beatT);
            kickGain.gain.exponentialRampToValueAtTime(0.001, beatT + 0.18);
            kickOsc.connect(kickGain);
            kickGain.connect(dest);
            kickOsc.start(beatT);
            kickOsc.stop(beatT + 0.2);

            // Snare / clap on even beats
            if (b % 2 === 1) {
              const clapOsc = audioCtx.createOscillator();
              const clapGain = audioCtx.createGain();
              clapOsc.type = 'triangle';
              clapOsc.frequency.setValueAtTime(320, beatT);
              clapOsc.frequency.exponentialRampToValueAtTime(120, beatT + 0.14);
              clapGain.gain.setValueAtTime(0.25, beatT);
              clapGain.gain.exponentialRampToValueAtTime(0.001, beatT + 0.15);
              clapOsc.connect(clapGain);
              clapGain.connect(dest);
              clapOsc.start(beatT);
              clapOsc.stop(beatT + 0.16);
            }

            // Funky bass note
            const bassOsc = audioCtx.createOscillator();
            const bassGain = audioCtx.createGain();
            const bassNotes = [110, 110, 130.8, 146.8, 164.8, 146.8];
            bassOsc.type = 'sawtooth';
            bassOsc.frequency.setValueAtTime(bassNotes[b % bassNotes.length], beatT);
            bassGain.gain.setValueAtTime(0.18, beatT);
            bassGain.gain.exponentialRampToValueAtTime(0.001, beatT + beatDuration * 0.85);
            bassOsc.connect(bassGain);
            bassGain.connect(dest);
            bassOsc.start(beatT);
            bassOsc.stop(beatT + beatDuration);
          }
        } else {
          // 1. Sub-bass foundation (55 Hz to 75 Hz)
          const subOsc = audioCtx.createOscillator();
          const subGain = audioCtx.createGain();
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(55, now);
          subOsc.frequency.exponentialRampToValueAtTime(75, now + 2.5);
          subOsc.frequency.exponentialRampToValueAtTime(50, now + 5.0);
          subGain.gain.setValueAtTime(0.01, now);
          subGain.gain.linearRampToValueAtTime(0.24, now + 0.5);
          subGain.gain.linearRampToValueAtTime(0.3, now + 2.5);
          subGain.gain.linearRampToValueAtTime(0.001, now + 5.0);
          subOsc.connect(subGain);
          subGain.connect(dest);
          subOsc.start(now);
          subOsc.stop(now + 5.1);

          // 2. Mid harmonic saw with low-pass filter sweep
          const midOsc = audioCtx.createOscillator();
          const filter = audioCtx.createBiquadFilter();
          const midGain = audioCtx.createGain();
          midOsc.type = 'sawtooth';
          midOsc.frequency.setValueAtTime(110, now);
          midOsc.frequency.linearRampToValueAtTime(130, now + 2.5);
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(300, now);
          filter.frequency.exponentialRampToValueAtTime(1800, now + 2.5);
          filter.frequency.exponentialRampToValueAtTime(400, now + 5.0);
          filter.Q.setValueAtTime(3.5, now);
          midGain.gain.setValueAtTime(0.01, now);
          midGain.gain.linearRampToValueAtTime(0.14, now + 1.0);
          midGain.gain.linearRampToValueAtTime(0.18, now + 2.5);
          midGain.gain.linearRampToValueAtTime(0.001, now + 5.0);
          midOsc.connect(filter);
          filter.connect(midGain);
          midGain.connect(dest);
          midOsc.start(now);
          midOsc.stop(now + 5.1);

          // 3. High shimmer / cinematic rise
          const highOsc = audioCtx.createOscillator();
          const highGain = audioCtx.createGain();
          highOsc.type = 'triangle';
          highOsc.frequency.setValueAtTime(220, now);
          highOsc.frequency.linearRampToValueAtTime(440, now + 2.5);
          highGain.gain.setValueAtTime(0.001, now);
          highGain.gain.linearRampToValueAtTime(0.08, now + 2.5);
          highGain.gain.linearRampToValueAtTime(0.001, now + 4.9);
          highOsc.connect(highGain);
          highGain.connect(dest);
          highOsc.start(now);
          highOsc.stop(now + 5.1);
        }

        const audioTrack = dest.stream.getAudioTracks()[0];
        if (audioTrack) {
          combinedStream = new MediaStream([
            ...stream.getVideoTracks(),
            audioTrack,
          ]);
        }
      } catch (e) {
        console.warn('Audio track merge skipped:', e);
      }
    }

    const candidateTypes = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm',
      'video/mp4;codecs=avc1',
      'video/mp4',
    ];
    let selectedMime = '';
    for (const type of candidateTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMime = type;
        break;
      }
    }

    let recorder: MediaRecorder;
    try {
      recorder = selectedMime
        ? new MediaRecorder(combinedStream, { mimeType: selectedMime, videoBitsPerSecond: 3500000 })
        : new MediaRecorder(combinedStream);
    } catch (e1) {
      console.warn('Failed recording combinedStream, trying video stream only:', e1);
      try {
        recorder = selectedMime
          ? new MediaRecorder(stream, { mimeType: selectedMime, videoBitsPerSecond: 3500000 })
          : new MediaRecorder(stream);
      } catch (e2) {
        console.warn('Failed with selectedMime, using default MediaRecorder:', e2);
        recorder = new MediaRecorder(stream);
      }
    }

    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onerror = (e) => {
      console.warn('MediaRecorder error:', e);
    };

    return new Promise((resolve) => {
      recorder.onstop = () => {
        try {
          const finalMime = selectedMime || recorder.mimeType || 'video/webm';
          const blob = new Blob(chunks, { type: finalMime });
          resolve(blob);
        } catch (e) {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        }
      };

      try {
        recorder.start(100);
      } catch (startErr) {
        console.warn('recorder.start(100) failed, trying default recorder.start():', startErr);
        try {
          recorder.start();
        } catch (fatalStart) {
          console.warn('recorder.start fatal error:', fatalStart);
          resolve(new Blob([], { type: 'video/webm' }));
          return;
        }
      }

      const startTime = performance.now();
      const totalDurationMs = 5000; // Exactly 5 seconds!

      const animate = () => {
        const elapsed = performance.now() - startTime;
        const currentSecond = Math.min(elapsed / 1000, 5);

        this.renderFrame(currentSecond, options);

        if (options.onProgress) {
          options.onProgress(Math.min((currentSecond / 5) * 100, 100), currentSecond);
        }

        if (elapsed < totalDurationMs) {
          requestAnimationFrame(animate);
        } else {
          this.renderFrame(5, options);
          try {
            if (recorder.state !== 'inactive') {
              if (typeof recorder.requestData === 'function') {
                recorder.requestData();
              }
              recorder.stop();
            }
          } catch (stopErr) {
            console.warn('recorder.stop error:', stopErr);
            const blob = new Blob(chunks, { type: selectedMime || 'video/webm' });
            resolve(blob);
          }
        }
      };

      requestAnimationFrame(animate);
    });
  }

  public renderToCanvas(targetCanvas: HTMLCanvasElement, t: number, options: RenderOptions) {
    this.renderFrame(t, options);
    if (targetCanvas.width !== this.width || targetCanvas.height !== this.height) {
      targetCanvas.width = this.width;
      targetCanvas.height = this.height;
    }
    const tCtx = targetCanvas.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(this.canvas, 0, 0);
    }
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}

