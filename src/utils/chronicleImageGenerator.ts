import { JournalEntry, JournalStats } from '../types/world';
import { getMilestoneInfo } from '../components/MilestoneBadge';

export interface WorldChronicleCardOptions {
  planetName: string;
  dayCount: number;
  season: string;
  timeOfDayLabel?: string;
  entries: JournalEntry[];
  stats: JournalStats;
  sceneSnapshotDataUrl?: string | null;
}

export interface GeneratedChronicleCard {
  dataUrl: string;
  blob: Blob;
  filename: string;
  topMilestones: JournalEntry[];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) {
        let lastLine = '';
        const remaining = words.slice(i);
        for (const rw of remaining) {
          const lTest = lastLine ? `${lastLine} ${rw}` : rw;
          if (ctx.measureText(lTest + '...').width > maxWidth) break;
          lastLine = lTest;
        }
        lines.push(lastLine ? `${lastLine}...` : '...');
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Extracts the top 3 most significant milestones from the chronicle.
 */
export function getTopRecentMilestones(entries: JournalEntry[]): JournalEntry[] {
  // Sort entries newest first
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);

  // First priority: items specifically designated as milestones or with numeric records
  const milestones = sorted.filter((e) => {
    const info = getMilestoneInfo(e);
    return (
      info.isMilestone ||
      e.tags?.includes('Milestone') ||
      e.category === 'milestone' ||
      e.numericRecord != null
    );
  });

  if (milestones.length >= 3) {
    return milestones.slice(0, 3);
  }

  // If fewer than 3, backfill with discoveries and key events
  const chosenIds = new Set(milestones.map((m) => m.id));
  const remaining = sorted.filter((e) => !chosenIds.has(e.id));
  return [...milestones, ...remaining].slice(0, 3);
}

/**
 * Procedurally draws a stylized terrarium planet fallback illustration
 * if no 3D canvas snapshot is provided.
 */
function drawTerrariumFallback(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  planetName: string,
) {
  ctx.save();
  ctx.translate(x, y);

  // Background gradient
  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w / 2);
  bgGrad.addColorStop(0, '#2d1f3b');
  bgGrad.addColorStop(0.7, '#1b1424');
  bgGrad.addColorStop(1, '#0f0a14');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Glass bell dome outline
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 - 20, w / 2 - 30, Math.PI, 0, false);
  ctx.stroke();

  // Planet sphere
  const pGrad = ctx.createRadialGradient(
    w / 2 - 25,
    h / 2 - 40,
    10,
    w / 2,
    h / 2 - 20,
    w / 3,
  );
  pGrad.addColorStop(0, '#6ee7b7');
  pGrad.addColorStop(0.5, '#10b981');
  pGrad.addColorStop(0.85, '#047857');
  pGrad.addColorStop(1, '#064e3b');

  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 - 20, w / 3, 0, Math.PI * 2);
  ctx.fill();

  // Continental patches
  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(w / 2 - 25, h / 2 - 35, 30, 0, Math.PI * 2);
  ctx.arc(w / 2 + 20, h / 2 - 10, 22, 0, Math.PI * 2);
  ctx.arc(w / 2 - 10, h / 2 + 15, 26, 0, Math.PI * 2);
  ctx.fill();

  // Atmosphere rim glow
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2 - 20, w / 3 + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Window base pedestal
  ctx.fillStyle = '#78350f';
  ctx.fillRect(w / 2 - 70, h / 2 + 65, 140, 16);
  ctx.fillStyle = '#451a03';
  ctx.fillRect(w / 2 - 80, h / 2 + 81, 160, 12);

  // Tiny label
  ctx.font = '600 13px Fraunces, Georgia, serif';
  ctx.fillStyle = '#fef3c7';
  ctx.textAlign = 'center';
  ctx.fillText(planetName, w / 2, h - 25);

  ctx.restore();
}

/**
 * Generates an ultra-crisp 1200x800 social card featuring the 3D snapshot
 * and the top 3 recent milestones with elegant naturalist typography.
 */
export async function generateWorldChronicleCard(
  options: WorldChronicleCardOptions,
): Promise<GeneratedChronicleCard> {
  const { planetName, dayCount, season, entries, stats, sceneSnapshotDataUrl } = options;

  const width = 1200;
  const height = 800;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Celestial Deep Twilight Background
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#15101a');
  bg.addColorStop(0.45, '#221727');
  bg.addColorStop(0.8, '#2a1a20');
  bg.addColorStop(1, '#181216');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Nebula warm glow on left
  const nebula = ctx.createRadialGradient(280, 400, 40, 280, 400, 360);
  nebula.addColorStop(0, 'rgba(245, 158, 11, 0.16)');
  nebula.addColorStop(0.5, 'rgba(217, 70, 239, 0.08)');
  nebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = nebula;
  ctx.fillRect(0, 0, 600, height);

  // Nebula cool glow on right
  const rightNebula = ctx.createRadialGradient(850, 300, 60, 850, 300, 450);
  rightNebula.addColorStop(0, 'rgba(56, 189, 248, 0.10)');
  rightNebula.addColorStop(0.7, 'rgba(168, 85, 247, 0.05)');
  rightNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rightNebula;
  ctx.fillRect(500, 0, 700, height);

  // 2. Starfield & Celestial Sparkles
  ctx.save();
  const starSeeds = [
    [45, 60, 1.2, 0.7],
    [120, 110, 1.8, 0.9],
    [240, 50, 1.0, 0.6],
    [310, 95, 1.5, 0.8],
    [480, 40, 1.2, 0.7],
    [650, 85, 1.6, 0.85],
    [780, 50, 1.0, 0.5],
    [920, 110, 1.5, 0.75],
    [1050, 65, 2.0, 0.9],
    [1140, 130, 1.3, 0.6],
    [1160, 450, 1.5, 0.7],
    [1120, 680, 1.2, 0.65],
    [70, 720, 1.4, 0.8],
    [480, 740, 1.1, 0.5],
    [980, 730, 1.7, 0.8],
    [520, 420, 0.9, 0.45],
    [620, 580, 1.1, 0.55],
    [40, 360, 1.3, 0.6],
  ];

  for (const [sx, sy, r, alpha] of starSeeds) {
    ctx.fillStyle = `rgba(254, 243, 199, ${alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();

    // 4-point cross for brighter stars
    if (r > 1.4) {
      ctx.strokeStyle = `rgba(253, 230, 138, ${alpha * 0.6})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(sx - 4, sy);
      ctx.lineTo(sx + 4, sy);
      ctx.moveTo(sx, sy - 4);
      ctx.lineTo(sx, sy + 4);
      ctx.stroke();
    }
  }
  ctx.restore();

  // 3. Dual Ornate Borders & Gold Corner Brackets
  ctx.save();
  // Outer border
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  // Inner border
  ctx.strokeStyle = 'rgba(253, 230, 138, 0.18)';
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  // Corner gold flourishes
  const cornerSize = 14;
  const corners = [
    [22, 22, 1, 1],
    [width - 22, 22, -1, 1],
    [22, height - 22, 1, -1],
    [width - 22, height - 22, -1, -1],
  ];

  ctx.fillStyle = '#f59e0b';
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * cornerSize);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + dx * cornerSize, cy);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Left Hero Frame: 3D Terrarium Snapshot Container
  const snapFrameX = 48;
  const snapFrameY = 56;
  const snapFrameW = 430;
  const snapFrameH = 672;

  // Outer container card
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  roundRect(ctx, snapFrameX, snapFrameY, snapFrameW, snapFrameH, 24);
  ctx.fillStyle = '#1e1624';
  ctx.fill();
  ctx.restore();

  roundRect(ctx, snapFrameX, snapFrameY, snapFrameW, snapFrameH, 24);
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner Viewport for 3D Canvas Photo
  const photoX = snapFrameX + 16;
  const photoY = snapFrameY + 16;
  const photoW = snapFrameW - 32;
  const photoH = 510;

  let snapshotLoaded = false;
  if (sceneSnapshotDataUrl) {
    try {
      const snapImg = await loadImage(sceneSnapshotDataUrl);
      ctx.save();
      roundRect(ctx, photoX, photoY, photoW, photoH, 18);
      ctx.clip();

      // Fit snapshot inside bounds preserving aspect ratio
      const imgAspect = snapImg.width / snapImg.height;
      const targetAspect = photoW / photoH;
      let drawW = photoW;
      let drawH = photoH;
      let drawX = photoX;
      let drawY = photoY;

      if (imgAspect > targetAspect) {
        drawW = photoH * imgAspect;
        drawX = photoX - (drawW - photoW) / 2;
      } else {
        drawH = photoW / imgAspect;
        drawY = photoY - (drawH - photoH) / 2;
      }

      ctx.drawImage(snapImg, drawX, drawY, drawW, drawH);

      // Soft vignette on snapshot edges
      const vig = ctx.createRadialGradient(
        photoX + photoW / 2,
        photoY + photoH / 2,
        photoW * 0.35,
        photoX + photoW / 2,
        photoY + photoH / 2,
        photoW * 0.75,
      );
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(10, 7, 14, 0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(photoX, photoY, photoW, photoH);

      ctx.restore();

      // Golden photo border
      roundRect(ctx, photoX, photoY, photoW, photoH, 18);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      snapshotLoaded = true;
    } catch (err) {
      console.warn('Failed to load snapshot for chronicle card:', err);
    }
  }

  if (!snapshotLoaded) {
    ctx.save();
    roundRect(ctx, photoX, photoY, photoW, photoH, 18);
    ctx.clip();
    drawTerrariumFallback(ctx, photoX, photoY, photoW, photoH, planetName);
    ctx.restore();

    roundRect(ctx, photoX, photoY, photoW, photoH, 18);
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Left card bottom stats strip
  const badgeY = snapFrameY + photoH + 28;

  // Day & Season Badge
  roundRect(ctx, photoX, badgeY, 190, 40, 10);
  ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#fde047';
  ctx.textAlign = 'left';
  ctx.fillText(`DAY ${dayCount} • ${season.toUpperCase()}`, photoX + 14, badgeY + 25);

  // Peak Population Badge
  roundRect(ctx, photoX + 202, badgeY, 196, 40, 10);
  ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.fillStyle = '#6ee7b7';
  ctx.fillText(`PEAK POP: ${stats.peakPopulation}`, photoX + 216, badgeY + 25);

  // Subtitle under badges
  ctx.font = 'italic 12px Fraunces, Georgia, serif';
  ctx.fillStyle = '#baa897';
  ctx.textAlign = 'center';
  ctx.fillText(
    `Miniature Glass Terrarium • Living Cosmos`,
    snapFrameX + snapFrameW / 2,
    badgeY + 74,
  );

  // 5. Right Panel: Chronicle Header
  const rightX = 512;
  const rightW = 640;

  // Eyebrow tag
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#d97706';
  ctx.textAlign = 'left';
  ctx.fillText(
    '✦  OFFICIAL FIELD CHRONICLE  ✦  POCKET WORLD',
    rightX,
    80,
  );

  // Main Planet Title
  ctx.font = '700 36px Fraunces, Georgia, serif';
  ctx.fillStyle = '#fdf8ee';
  ctx.fillText(planetName, rightX, 122);

  // Subtitle
  ctx.font = '500 14px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = '#d4c5b3';
  ctx.fillText('Top 3 Significant World Milestones & Breakthroughs', rightX, 146);

  // Ornate Gold Rule
  const ruleY = 162;
  const ruleGrad = ctx.createLinearGradient(rightX, ruleY, rightX + rightW, ruleY);
  ruleGrad.addColorStop(0, 'rgba(217, 119, 6, 0.8)');
  ruleGrad.addColorStop(0.5, 'rgba(253, 230, 138, 0.9)');
  ruleGrad.addColorStop(1, 'rgba(217, 119, 6, 0.1)');
  ctx.strokeStyle = ruleGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightX, ruleY);
  ctx.lineTo(rightX + rightW - 20, ruleY);
  ctx.stroke();

  // Diamond flourish on rule
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(rightX + 16, ruleY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 6. Top 3 Recent Milestones Cards
  const topMilestones = getTopRecentMilestones(entries);
  const milestoneStartY = 184;
  const cardHeight = 156;
  const cardGap = 16;

  topMilestones.forEach((entry, i) => {
    const cardY = milestoneStartY + i * (cardHeight + cardGap);
    const milestone = getMilestoneInfo(entry);

    // Card background
    ctx.save();
    roundRect(ctx, rightX, cardY, rightW - 20, cardHeight, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left accent pill bar
    const barColors = ['#f59e0b', '#38bdf8', '#34d399'];
    ctx.fillStyle = barColors[i % barColors.length];
    roundRect(ctx, rightX + 6, cardY + 12, 4, cardHeight - 24, 2);
    ctx.fill();
    ctx.restore();

    // Row 1: Rank Badge + Category Badge + Timestamp
    const contentX = rightX + 22;

    // Rank Pill
    roundRect(ctx, contentX, cardY + 14, 38, 22, 6);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#fde047';
    ctx.textAlign = 'center';
    ctx.fillText(`#0${i + 1}`, contentX + 19, cardY + 29);

    // Milestone Badge Label
    const badgeText = (entry.badge || milestone.label || 'MILESTONE').toUpperCase();
    ctx.font = '700 10px "JetBrains Mono", monospace';
    const badgeW = Math.max(ctx.measureText(badgeText).width + 16, 75);

    roundRect(ctx, contentX + 46, cardY + 14, badgeW, 22, 6);
    ctx.fillStyle = `${entry.accentColor}24`;
    ctx.fill();
    ctx.strokeStyle = `${entry.accentColor}55`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.fillText(badgeText, contentX + 46 + badgeW / 2, cardY + 29);

    // Timestamp on right
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#a89887';
    ctx.textAlign = 'right';
    ctx.fillText(
      `Day ${entry.dayCount} • ${entry.season.toUpperCase()} • ${entry.timeOfDayLabel}`,
      rightX + rightW - 36,
      cardY + 29,
    );

    // Row 2: Milestone Title
    ctx.font = '600 17px Fraunces, Georgia, serif';
    ctx.fillStyle = '#fffbeb';
    ctx.textAlign = 'left';

    const maxTitleW = rightW - 70;
    let titleStr = entry.title;
    if (ctx.measureText(titleStr).width > maxTitleW) {
      while (ctx.measureText(titleStr + '...').width > maxTitleW && titleStr.length > 5) {
        titleStr = titleStr.slice(0, -1);
      }
      titleStr += '...';
    }
    ctx.fillText(titleStr, contentX, cardY + 62);

    // Row 3: Narrative Description (wrapped)
    ctx.font = '400 12.5px "Inter", -apple-system, sans-serif';
    ctx.fillStyle = '#d1c2b0';
    const lines = wrapText(ctx, entry.description, rightW - 65, 2);
    lines.forEach((line, lIdx) => {
      ctx.fillText(line, contentX, cardY + 84 + lIdx * 17);
    });

    // Row 4: Numeric record tag or tags footer
    if (entry.numericRecord) {
      const metricY = cardY + 125;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#fcd34d';
      const recordText =
        entry.numericRecord.type === 'population'
          ? `★ Peak Population Achieved: ${entry.numericRecord.value} citizens`
          : `★ Sustained Longevity: ${entry.numericRecord.value} Solar Days`;
      ctx.fillText(recordText, contentX, metricY);
    } else if (entry.tags && entry.tags.length > 0) {
      const tagStr = entry.tags.map((t) => `#${t}`).join('   ');
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#9c8976';
      ctx.fillText(tagStr, contentX, cardY + 125);
    }
  });

  // 7. Footer Stamp & Watermark
  const footerY = height - 42;
  ctx.save();
  ctx.font = '500 11.5px "Inter", -apple-system, sans-serif';
  ctx.fillStyle = '#9e8c79';
  ctx.textAlign = 'left';
  ctx.fillText(
    '✦ Pocket World Terrarium • Living Planetary Chronicle • Windowsill Glass Edition',
    rightX,
    footerY,
  );

  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillStyle = '#d97706';
  ctx.textAlign = 'right';
  ctx.fillText(
    '#PocketWorld #LivingChronicle',
    rightX + rightW - 20,
    footerY,
  );
  ctx.restore();

  // Convert to PNG dataUrl and Blob
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
  });

  const cleanName = planetName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'pocket_world';
  const filename = `${cleanName}_world_chronicle_${Date.now()}.png`;

  return {
    dataUrl,
    blob,
    filename,
    topMilestones,
  };
}
