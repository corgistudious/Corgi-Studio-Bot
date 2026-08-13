const path = require("node:path");

const {
  createCanvas,
  loadImage
} = require("@napi-rs/canvas");

async function safeLoadImage(filePath) {
  try {
    return await loadImage(filePath);
  } catch (error) {
    console.warn(
      `⚠️ Không load được image: ${filePath}`
    );

    return null;
  }
}

function drawRoundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {
  ctx.beginPath();
  ctx.roundRect(
    x,
    y,
    width,
    height,
    radius
  );
}

function drawGlowText(
  ctx,
  text,
  x,
  y,
  options = {}
) {
  const {
    font = "bold 30px Arial",
    color = "#ffffff",
    glow = "#a855f7",
    blur = 15,
    align = "left"
  } = options;

  ctx.save();

  ctx.font = font;
  ctx.textAlign = align;
  ctx.fillStyle = color;

  ctx.shadowColor = glow;
  ctx.shadowBlur = blur;

  ctx.fillText(
    text,
    x,
    y
  );

  ctx.restore();
}

async function createLevelCard({
  user,
  level,
  xp,
  requiredXp
}) {
  const width = 800;
  const height = 450;

  const canvas =
    createCanvas(
      width,
      height
    );

  const ctx =
    canvas.getContext("2d");

  // =========================================
  // ASSET PATHS
  // =========================================

  const bgPath =
    path.join(
      __dirname,
      "../assets/levelup/level-bg.png"
    );

  const mascotPath =
    path.join(
      __dirname,
      "../assets/levelup/corgi-mascot.png"
    );

  // =========================================
  // BACKGROUND
  // =========================================

  const background =
    await safeLoadImage(
      bgPath
    );

  if (background) {
    ctx.drawImage(
      background,
      0,
      0,
      width,
      height
    );
  } else {
    const gradient =
      ctx.createLinearGradient(
        0,
        0,
        width,
        height
      );

    gradient.addColorStop(
      0,
      "#070b24"
    );

    gradient.addColorStop(
      0.5,
      "#312e81"
    );

    gradient.addColorStop(
      1,
      "#09090b"
    );

    ctx.fillStyle =
      gradient;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );
  }

  // =========================================
  // DARK OVERLAY CHO TEXT DỄ ĐỌC
  // =========================================

  const overlay =
    ctx.createLinearGradient(
      0,
      0,
      width,
      0
    );

  overlay.addColorStop(
    0,
    "rgba(0,0,0,0.05)"
  );

  overlay.addColorStop(
    0.4,
    "rgba(0,0,0,0.15)"
  );

  overlay.addColorStop(
    1,
    "rgba(0,0,0,0.58)"
  );

  ctx.fillStyle =
    overlay;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  // =========================================
  // OUTER BORDER
  // =========================================

  ctx.save();

  ctx.strokeStyle =
    "#d946ef";

  ctx.lineWidth = 4;

  ctx.shadowColor =
    "#a855f7";

  ctx.shadowBlur = 18;

  drawRoundedRect(
    ctx,
    8,
    8,
    width - 16,
    height - 16,
    28
  );

  ctx.stroke();

  ctx.restore();

  // =========================================
  // CORGI MASCOT
  // =========================================

  const mascot =
    await safeLoadImage(
      mascotPath
    );

  if (mascot) {
    const mascotWidth = 300;
    const mascotHeight = 300;

    ctx.save();

    ctx.shadowColor =
      "#f59e0b";

    ctx.shadowBlur = 24;

    ctx.drawImage(
      mascot,
      20,
      125,
      mascotWidth,
      mascotHeight
    );

    ctx.restore();
  }

  // =========================================
  // TITLE PANEL
  // =========================================

  ctx.save();

  ctx.fillStyle =
    "rgba(48, 18, 92, 0.90)";

  ctx.strokeStyle =
    "#d946ef";

  ctx.lineWidth = 3;

  ctx.shadowColor =
    "#a855f7";

  ctx.shadowBlur = 16;

  drawRoundedRect(
    ctx,
    335,
    30,
    425,
    62,
    20
  );

  ctx.fill();
  ctx.stroke();

  ctx.restore();

  drawGlowText(
    ctx,
    "★ CHÚC MỪNG ★",
    548,
    72,
    {
      font:
        "bold 28px Arial",
      color:
        "#ffffff",
      glow:
        "#ec4899",
      blur:
        14,
      align:
        "center"
    }
  );

  // =========================================
  // USERNAME
  // =========================================

  let username =
    user.globalName ||
    user.username;

  if (
    username.length > 20
  ) {
    username =
      username.slice(
        0,
        20
      ) + "...";
  }

  drawGlowText(
    ctx,
    `@${username}`,
    548,
    127,
    {
      font:
        "bold 24px Arial",
      color:
        "#22d3ee",
      glow:
        "#06b6d4",
      blur:
        12,
      align:
        "center"
    }
  );

  // =========================================
  // LEVEL TEXT
  // =========================================

  drawGlowText(
    ctx,
    `LEVEL ${level}!`,
    548,
    205,
    {
      font:
        "bold 62px Arial",
      color:
        "#fbbf24",
      glow:
        "#f97316",
      blur:
        22,
      align:
        "center"
    }
  );

  // =========================================
  // XP PANEL
  // =========================================

  ctx.save();

  ctx.fillStyle =
    "rgba(7, 10, 30, 0.88)";

  ctx.strokeStyle =
    "#8b5cf6";

  ctx.lineWidth = 3;

  ctx.shadowColor =
    "#8b5cf6";

  ctx.shadowBlur = 14;

  drawRoundedRect(
    ctx,
    340,
    225,
    420,
    145,
    24
  );

  ctx.fill();
  ctx.stroke();

  ctx.restore();

  drawGlowText(
    ctx,
    "XP HIỆN TẠI",
    550,
    262,
    {
      font:
        "bold 21px Arial",
      color:
        "#22d3ee",
      glow:
        "#06b6d4",
      blur:
        10,
      align:
        "center"
    }
  );

  drawGlowText(
    ctx,
    `${xp} / ${requiredXp}`,
    550,
    310,
    {
      font:
        "bold 38px Arial",
      color:
        "#ffffff",
      glow:
        "#6366f1",
      blur:
        10,
      align:
        "center"
    }
  );

  // =========================================
  // PROGRESS BAR
  // =========================================

  const barX = 395;
  const barY = 330;
  const barWidth = 315;
  const barHeight = 20;

  let progress =
    requiredXp > 0
      ? xp / requiredXp
      : 0;

  progress =
    Math.max(
      0,
      Math.min(
        progress,
        1
      )
    );

  ctx.save();

  ctx.fillStyle =
    "rgba(0,0,0,0.70)";

  drawRoundedRect(
    ctx,
    barX,
    barY,
    barWidth,
    barHeight,
    10
  );

  ctx.fill();

  ctx.restore();

  if (progress > 0) {
    const barGradient =
      ctx.createLinearGradient(
        barX,
        barY,
        barX + barWidth,
        barY
      );

    barGradient.addColorStop(
      0,
      "#22d3ee"
    );

    barGradient.addColorStop(
      0.5,
      "#8b5cf6"
    );

    barGradient.addColorStop(
      1,
      "#ec4899"
    );

    ctx.save();

    ctx.fillStyle =
      barGradient;

    ctx.shadowColor =
      "#8b5cf6";

    ctx.shadowBlur = 16;

    drawRoundedRect(
      ctx,
      barX,
      barY,
      Math.max(
        14,
        barWidth * progress
      ),
      barHeight,
      10
    );

    ctx.fill();

    ctx.restore();
  }

  ctx.save();

  ctx.strokeStyle =
    "#c084fc";

  ctx.lineWidth = 2;

  drawRoundedRect(
    ctx,
    barX,
    barY,
    barWidth,
    barHeight,
    10
  );

  ctx.stroke();

  ctx.restore();

  // =========================================
  // AVATAR
  // =========================================

  try {
    const avatarURL =
      user.displayAvatarURL({
        extension:
          "png",
        size:
          256
      });

    const avatar =
      await loadImage(
        avatarURL
      );

    const avatarSize = 78;
    const avatarX = 285;
    const avatarY = 245;

    ctx.save();

    ctx.beginPath();

    ctx.arc(
      avatarX +
        avatarSize / 2,
      avatarY +
        avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );

    ctx.clip();

    ctx.drawImage(
      avatar,
      avatarX,
      avatarY,
      avatarSize,
      avatarSize
    );

    ctx.restore();

    ctx.save();

    ctx.strokeStyle =
      "#facc15";

    ctx.lineWidth = 4;

    ctx.shadowColor =
      "#f59e0b";

    ctx.shadowBlur = 12;

    ctx.beginPath();

    ctx.arc(
      avatarX +
        avatarSize / 2,
      avatarY +
        avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2
    );

    ctx.stroke();

    ctx.restore();
  } catch (error) {
    console.warn(
      "⚠️ Không load được avatar user."
    );
  }

  // =========================================
  // FOOTER BOXES
  // =========================================

  ctx.save();

  ctx.fillStyle =
    "rgba(8, 10, 28, 0.88)";

  ctx.strokeStyle =
    "#6366f1";

  ctx.lineWidth = 2;

  drawRoundedRect(
    ctx,
    335,
    385,
    195,
    44,
    14
  );

  ctx.fill();
  ctx.stroke();

  drawRoundedRect(
    ctx,
    540,
    385,
    220,
    44,
    14
  );

  ctx.fill();
  ctx.stroke();

  ctx.restore();

  ctx.textAlign =
    "center";

  ctx.font =
    "bold 17px Arial";

  ctx.fillStyle =
    "#facc15";

  ctx.fillText(
    "⭐ LEVEL MỚI!",
    432,
    413
  );

  ctx.fillStyle =
    "#84cc16";

  ctx.fillText(
    "⚡ TIẾP TỤC CỐ GẮNG!",
    650,
    413
  );

  // =========================================
  // BRAND
  // =========================================

  ctx.textAlign =
    "left";

  ctx.font =
    "13px Arial";

  ctx.fillStyle =
    "#d1d5db";

  ctx.fillText(
    "Corgi Studio • XP & Level",
    25,
    428
  );

  // =========================================
  // EXPORT
  // =========================================

  return canvas.toBuffer(
    "image/png"
  );
}

module.exports = {
  createLevelCard
};