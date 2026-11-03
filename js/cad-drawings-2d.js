/**
 * Glass Wings Studio — Synchronized 2D Engineering Drawings Generator
 * 1. 2D CAD Elevation & Section View (AutoCAD Drawing #700029 Style)
 * 2. 2D Glass Panel Fabrication & CNC Hole Drilling Cut-Sheet
 * 3. 2D Site Installation Detail & Bill of Quantities (BOQ)
 */

export function computeEngineeringMetrics(state) {
  const {
    stairType,
    numSteps,
    tread,
    riser,
    stairWidth,
    railHeight,
    glassThick,
    pipeDia,
    studProj,
    studHoleDia,
    stepsPerPanel,
    curveRadius,
    curveAngle
  } = state;

  const isRounded = stairType === "rounded";
  const isDuplexU = stairType === "duplex_u";
  const isMallAtrium = stairType === "mall_atrium";

  const flightMultiplier = isDuplexU ? 2 : isMallAtrium ? 2 : 1;
  const effectiveRun = isRounded
    ? Math.round((curveAngle / 360) * 2 * Math.PI * (curveRadius + stairWidth * 0.5))
    : numSteps * tread;
  const totalRise = numSteps * riser;
  const slopeAngleDeg = (Math.atan2(riser, tread) * 180) / Math.PI;
  const pitchLengthPerFlight = Math.hypot(effectiveRun, totalRise);

  // Total Running Feet (Rft) including landings/balcony extensions
  const landingExtMm = isMallAtrium ? 4800 : isDuplexU ? 2400 : 1800;
  const totalRunningMm = pitchLengthPerFlight * flightMultiplier + landingExtMm;
  const totalRft = (totalRunningMm / 304.8).toFixed(1);

  // Panel breakdown
  const panelsPerFlight = Math.ceil(numSteps / stepsPerPanel);
  const totalGlassPanels = panelsPerFlight * flightMultiplier + (isMallAtrium ? 4 : isDuplexU ? 2 : 1);

  const panels = [];
  for (let i = 0; i < panelsPerFlight; i++) {
    const pStart = i * stepsPerPanel;
    const pEnd = Math.min(pStart + stepsPerPanel - 1, numSteps - 1);
    const stepCountInPanel = pEnd - pStart + 1;
    const widthMm = stepCountInPanel * tread - 8;
    const slopedTopMm = Math.round(widthMm / Math.cos((slopeAngleDeg * Math.PI) / 180));
    const leftHeightMm = Math.round(railHeight - 55 + riser - 12);
    const rightHeightMm = Math.round(railHeight - 55 + stepCountInPanel * riser - 12);
    const areaSqM = ((widthMm * (railHeight + riser * 0.5)) / 1e6);
    const areaSqFt = areaSqM * 10.7639;
    // Toughened glass density = 2.5 kg per m² per mm thickness
    const weightKg = areaSqM * glassThick * 2.5;

    // CNC Hole coordinates relative to panel left edge (X) and step bottom (Y)
    const holes = [
      {
        id: "H1 (Top-Step Stud 1)",
        type: `Ø${studHoleDia}mm Counterbore`,
        x: Math.round(tread * 0.30 - 4),
        yFromStep: Math.round(riser * 0.55 - 12)
      },
      {
        id: "H2 (Top-Step Stud 2)",
        type: `Ø${studHoleDia}mm Counterbore`,
        x: Math.round(tread * 0.72 - 4),
        yFromStep: Math.round(riser * 0.55 - 12)
      },
      {
        id: "H3 (Bot-Step Stud 1)",
        type: `Ø${studHoleDia}mm Counterbore`,
        x: Math.round((stepCountInPanel - 1) * tread + tread * 0.30 - 4),
        yFromStep: Math.round(riser * 0.55 - 12)
      },
      {
        id: "H4 (Bot-Step Stud 2)",
        type: `Ø${studHoleDia}mm Counterbore`,
        x: Math.round((stepCountInPanel - 1) * tread + tread * 0.72 - 4),
        yFromStep: Math.round(riser * 0.55 - 12)
      },
      {
        id: "H5 (Top Pipe Holder L)",
        type: "Ø16mm Through-Hole",
        x: Math.round(widthMm * 0.22),
        yFromTop: 50
      },
      {
        id: "H6 (Top Pipe Holder R)",
        type: "Ø16mm Through-Hole",
        x: Math.round(widthMm * 0.78),
        yFromTop: 50
      }
    ];

    panels.push({
      code: `G-0${i + 1}`,
      stepRange: `Step ${pStart + 1} to ${pEnd + 1}`,
      stepCount: stepCountInPanel,
      widthMm,
      slopedTopMm,
      leftHeightMm,
      rightHeightMm,
      rakeAngleDeg: slopeAngleDeg.toFixed(1),
      areaSqFt: areaSqFt.toFixed(2),
      areaSqM: areaSqM.toFixed(2),
      weightKg: weightKg.toFixed(1),
      isCurved: isRounded,
      curveRadiusMm: isRounded ? curveRadius + stairWidth * 0.5 + studProj : 0,
      holes
    });
  }

  const totalStuds = totalGlassPanels * 4;
  const totalPipeHolders = totalGlassPanels * 2;
  const totalGlassAreaSqFt = (
    panels.reduce((acc, p) => acc + parseFloat(p.areaSqFt), 0) * flightMultiplier +
    (landingExtMm * railHeight * 10.7639) / 1e6
  ).toFixed(1);

  return {
    effectiveRun,
    totalRise,
    slopeAngleDeg: slopeAngleDeg.toFixed(1),
    totalRunningMm: Math.round(totalRunningMm),
    totalRft,
    totalGlassPanels,
    totalStuds,
    totalPipeHolders,
    totalGlassAreaSqFt,
    panels
  };
}

/**
 * Renders the exact AutoCAD-style Elevation & Section Drawing (#700029) onto a Canvas
 */
export function renderElevationCanvas(canvas, state, theme = "dark") {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const isLight = theme === "light";
  ctx.fillStyle = isLight ? "#ffffff" : "#000000";
  ctx.fillRect(0, 0, W, H);

  const {
    stairType,
    numSteps,
    tread,
    riser,
    railHeight,
    glassThick,
    pipeDia,
    studProj,
    stepsPerPanel,
    clientName,
    projectLocation,
    drawingNo
  } = state;

  const metrics = computeEngineeringMetrics(state);
  const fg = isLight ? "#0f172a" : "#ffffff";
  const cyan = isLight ? "#0284c7" : "#38bdf8";
  const brown = isLight ? "#92400e" : "#b46924";
  const blueLeader = isLight ? "#1d4ed8" : "#2563eb";
  const greenDim = isLight ? "#15803d" : "#22c55e";

  // Outer CAD Border
  ctx.strokeStyle = fg;
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, W - 28, H - 28);

  // Top-Right Logo ("glass decors - success with flying colours")
  const logoX = W - 165;
  const logoY = 65;
  ctx.save();
  ctx.translate(logoX, logoY);
  // Diamond Stripes
  for (let i = -24; i <= 24; i += 6) {
    const halfW = 28 - Math.abs(i);
    ctx.fillStyle = i < 0 ? "#2dd4bf" : "#0ea5e9";
    ctx.fillRect(-halfW, i - 2, halfW * 2, 3.5);
  }
  ctx.fillStyle = "#000";
  ctx.fillRect(-3, -26, 6, 52);
  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(-2, -26, 4, 52);
  ctx.restore();

  ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = isLight ? "#334155" : "#94a3b8";
  ctx.textAlign = "center";
  ctx.fillText("glass decors", logoX, logoY + 48);
  ctx.font = "10px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = greenDim;
  ctx.fillText("success with flying colours", logoX + 18, logoY + 61);

  // Coordinate Transform for Staircase Elevation
  const totalRun = numSteps * tread;
  const totalRise = numSteps * riser;
  const drawAreaW = W * 0.62;
  const drawAreaH = H * 0.62;
  const scale = Math.min(drawAreaW / (totalRun + 1400), drawAreaH / (totalRise + railHeight + 600));

  const originX = 210; // X=0 (top step nosing)
  const originY = H - 205; // Y=0 (bottom floor level)
  const toX = (mmX) => originX + mmX * scale;
  const toY = (mmY) => originY - mmY * scale;

  // 1. Draw Concrete Waist Slab & Landings (Hatched)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(toX(-850), toY(totalRise));
  ctx.lineTo(toX(0), toY(totalRise));
  for (let s = 0; s < numSteps; s++) {
    const sx = s * tread;
    const syBot = (numSteps - 1 - s) * riser;
    ctx.lineTo(toX(sx), toY(syBot));
    ctx.lineTo(toX(sx + tread), toY(syBot));
  }
  ctx.lineTo(toX(totalRun), toY(-220));
  ctx.lineTo(toX(-850), toY(-220));
  ctx.lineTo(toX(-850), toY(totalRise - 220));
  ctx.lineTo(toX(-120), toY(totalRise - 220));
  ctx.lineTo(toX(totalRun - 550), toY(0));
  ctx.lineTo(toX(-850), toY(0));
  ctx.closePath();
  ctx.fillStyle = isLight ? "#fef3c7" : "#291d12";
  ctx.fill();
  ctx.strokeStyle = brown;
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Dashed concrete texture lines inside waist & bottom slab
  ctx.clip();
  ctx.strokeStyle = isLight ? "#d97706" : "#854d0e";
  ctx.lineWidth = 0.8;
  ctx.setLineDash([6, 4]);
  for (let d = -2000; d < totalRun + 2000; d += 38) {
    ctx.beginPath();
    ctx.moveTo(toX(d), toY(totalRise + 200));
    ctx.lineTo(toX(d + 1600), toY(-300));
    ctx.stroke();
  }
  ctx.restore();

  // 2. Draw Golden-Brown L-Shaped Stair Treads & Risers
  ctx.fillStyle = brown;
  for (let s = 0; s < numSteps; s++) {
    const sx = s * tread;
    const syTop = (numSteps - s) * riser;
    const syBot = (numSteps - 1 - s) * riser;

    // Vertical riser bar
    ctx.fillRect(toX(sx), toY(syTop), 30 * scale, riser * scale);
    // Horizontal tread bar
    ctx.fillRect(toX(sx), toY(syBot + 30), (tread + 25) * scale, 30 * scale);
  }
  // Top Landing tread bar
  ctx.fillRect(toX(-220), toY(totalRise), 245 * scale, 30 * scale);

  // 3. Draw Stepped 10mm Toughened Glass Panels (Cyan Outline + Glass Reflection Streaks)
  const slope = riser / tread;
  const topClearance = railHeight - 40;

  for (let pStart = 0; pStart < numSteps; pStart += stepsPerPanel) {
    const pEnd = Math.min(pStart + stepsPerPanel - 1, numSteps - 1);
    const xStart = pStart * tread;
    const xEnd = (pEnd + 1) * tread;
    const yTopL = totalRise + topClearance - xStart * slope;
    const yTopR = totalRise + topClearance - xEnd * slope;

    ctx.beginPath();
    ctx.moveTo(toX(xStart), toY(yTopL));
    ctx.lineTo(toX(xEnd), toY(yTopR));

    for (let s = pEnd; s >= pStart; s--) {
      const sxR = (s + 1) * tread;
      const sxL = s * tread;
      const syStep = (numSteps - 1 - s) * riser;
      ctx.lineTo(toX(sxR), toY(syStep));
      ctx.lineTo(toX(sxL), toY(syStep));
    }
    ctx.closePath();

    ctx.fillStyle = isLight ? "rgba(56, 189, 248, 0.12)" : "rgba(56, 189, 248, 0.07)";
    ctx.fill();
    ctx.strokeStyle = cyan;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Diagonal glass reflection symbol in center of panel
    const midX = toX((xStart + xEnd) * 0.5);
    const midY = toY((yTopL + yTopR) * 0.5 - 380);
    ctx.beginPath();
    ctx.moveTo(midX - 8, midY - 8);
    ctx.lineTo(midX + 8, midY + 8);
    ctx.moveTo(midX - 4, midY - 11);
    ctx.lineTo(midX + 11, midY + 4);
    ctx.stroke();

    // Dual 1" Projection Studs on anchor steps
    [pStart, pEnd].forEach((aStep) => {
      const studY = (numSteps - 1 - aStep) * riser + 15;
      const studX1 = aStep * tread + tread * 0.32;
      const studX2 = aStep * tread + tread * 0.72;
      [studX1, studX2].forEach((sx) => {
        ctx.beginPath();
        ctx.arc(toX(sx), toY(studY), Math.max(2.5, 16 * scale), 0, Math.PI * 2);
        ctx.strokeStyle = fg;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });
    });

    // Top Pipe-to-Glass Holder vertical stems
    const hX1 = xStart + (xEnd - xStart) * 0.18;
    const hX2 = xStart + (xEnd - xStart) * 0.82;
    [hX1, hX2].forEach((hx) => {
      const py = totalRise + railHeight - hx * slope;
      const gy = totalRise + topClearance - hx * slope;
      ctx.beginPath();
      ctx.moveTo(toX(hx), toY(py - pipeDia * 0.5));
      ctx.lineTo(toX(hx), toY(gy - 20));
      ctx.strokeStyle = cyan;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  // 4. Draw Ø50 mm SS Pipe Top Handrail
  ctx.beginPath();
  ctx.moveTo(toX(-120), toY(totalRise + railHeight + 120 * slope + pipeDia * 0.5));
  ctx.lineTo(toX(totalRun), toY(railHeight + pipeDia * 0.5));
  ctx.moveTo(toX(-120), toY(totalRise + railHeight + 120 * slope - pipeDia * 0.5));
  ctx.lineTo(toX(totalRun), toY(railHeight - pipeDia * 0.5));
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // 5. Draw Left Vertical Dimension (915 mm) & "Extension... Rft" Callout
  const dimX = toX(-180);
  const dimTopY = toY(totalRise + railHeight);
  const dimBotY = toY(totalRise);
  ctx.strokeStyle = cyan;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(dimX - 10, dimTopY);
  ctx.lineTo(toX(0), dimTopY);
  ctx.moveTo(dimX - 10, dimBotY);
  ctx.lineTo(toX(-220), dimBotY);
  ctx.moveTo(dimX, dimTopY);
  ctx.lineTo(dimX, dimBotY);
  ctx.stroke();

  // Green "915" vertical text
  ctx.save();
  ctx.translate(dimX + 15, (dimTopY + dimBotY) * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = greenDim;
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(railHeight), 0, 0);
  ctx.restore();

  // "Extension... 53 Rft"
  ctx.fillStyle = fg;
  ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`Extension... ${metrics.totalRft} Rft`, dimX - 24, (dimTopY + dimBotY) * 0.5 - 8);
  ctx.strokeStyle = blueLeader;
  ctx.beginPath();
  ctx.moveTo(dimX - 140, (dimTopY + dimBotY) * 0.5 - 3);
  ctx.lineTo(dimX - 14, (dimTopY + dimBotY) * 0.5 - 3);
  ctx.stroke();

  // Helper for Blue Callout Leaders matching Drawing #700029
  function drawLeader(targetX, targetY, elbowX, elbowY, label) {
    ctx.strokeStyle = blueLeader;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(elbowX, elbowY);
    ctx.lineTo(elbowX + 125, elbowY);
    ctx.stroke();

    // Arrowhead
    const ang = Math.atan2(targetY - elbowY, targetX - elbowX);
    ctx.beginPath();
    ctx.moveTo(targetX, targetY);
    ctx.lineTo(targetX - 9 * Math.cos(ang - 0.35), targetY - 9 * Math.sin(ang - 0.35));
    ctx.lineTo(targetX - 9 * Math.cos(ang + 0.35), targetY - 9 * Math.sin(ang + 0.35));
    ctx.closePath();
    ctx.fillStyle = blueLeader;
    ctx.fill();

    ctx.fillStyle = fg;
    ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(label, elbowX + 6, elbowY - 6);
  }

  // Callout 1: Ø50 mm SS Pipe
  const c1X = totalRun * 0.22;
  const c1Y = totalRise + railHeight - c1X * slope;
  drawLeader(toX(c1X), toY(c1Y), toX(c1X) + 18, toY(c1Y) - 34, `Ø${pipeDia} mm SS Pipe`);

  // Callout 2: 10 mm Toughened Glass
  const c2X = totalRun * 0.45;
  const c2Y = totalRise + railHeight * 0.58 - c2X * slope;
  drawLeader(toX(c2X), toY(c2Y), toX(c2X) + 22, toY(c2Y) - 48, `${glassThick} mm Toughened Glass`);

  // Callout 3: Pipe to Glass Holder
  const c3X = totalRun * 0.72;
  const c3Y = totalRise + railHeight - 50 - c3X * slope;
  drawLeader(toX(c3X), toY(c3Y), toX(c3X) + 24, toY(c3Y) - 42, "Pipe to Glass Holder");

  // Callout 4: 1" Projection Stud
  const c4Step = Math.min(numSteps - 3, Math.floor(numSteps * 0.66));
  const c4X = c4Step * tread + tread * 0.72;
  const c4Y = (numSteps - 1 - c4Step) * riser + 15;
  drawLeader(toX(c4X), toY(c4Y), toX(c4X) + 24, toY(c4Y) - 34, `1" (${studProj}mm) Projection Stud`);

  // 6. Draw Right-Side SECTION VIEW (Matching Drawing #700029)
  const secX = W - 235;
  const secBotY = H - 220;
  const secTopY = secBotY - 195;

  // Concrete step block in Section View
  ctx.fillStyle = brown;
  ctx.beginPath();
  ctx.moveTo(secX + 10, secBotY);
  ctx.lineTo(secX + 58, secBotY);
  ctx.lineTo(secX + 48, secBotY - 30);
  ctx.lineTo(secX + 10, secBotY - 30);
  ctx.closePath();
  ctx.fill();

  // 1" Projection Stud in Section View
  ctx.strokeStyle = cyan;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(secX + 10, secBotY - 15);
  ctx.lineTo(secX - 4, secBotY - 15);
  ctx.stroke();

  // Vertical 10mm Toughened Glass in Section View
  ctx.strokeRect(secX - 2, secTopY + 12, 4, secBotY - secTopY - 22);

  // Ø50mm SS Tube Circle at Top of Section View
  ctx.strokeStyle = fg;
  ctx.beginPath();
  ctx.arc(secX, secTopY, 6, 0, Math.PI * 2);
  ctx.stroke();

  // Section View Callouts
  drawLeader(secX, secTopY - 6, secX + 5, secTopY - 32, `Ø${pipeDia} mm SS Tube`);
  drawLeader(secX + 2, (secTopY + secBotY) * 0.5, secX + 18, (secTopY + secBotY) * 0.5, `${glassThick} mm Toughened Glass`);
  drawLeader(secX + 4, secBotY - 15, secX + 14, secBotY - 42, `1" Projection Stud`);

  ctx.fillStyle = fg;
  ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SECTION VIEW", secX + 22, secBotY + 26);
  ctx.fillText(`LOCATION - STAIRCASE (${stairType.toUpperCase()})`, W * 0.42, H - 142);
  ctx.textAlign = "right";
  ctx.fillText('All Dimension in " mm"', W - 30, H - 142);

  // 7. Draw Bottom CAD Title Block Table
  const tbY = H - 130;
  const tbH = 116;
  ctx.strokeStyle = fg;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(14, tbY, W - 28, tbH);

  // Vertical dividers
  const cols = [0.35, 0.52, 0.67, 0.83].map((r) => 14 + (W - 28) * r);
  cols.forEach((cx) => {
    ctx.beginPath();
    ctx.moveTo(cx, tbY);
    ctx.lineTo(cx, tbY + tbH);
    ctx.stroke();
  });

  // Horizontal header line in columns 2,3,4
  ctx.beginPath();
  ctx.moveTo(cols[0], tbY + 22);
  ctx.lineTo(cols[3], tbY + 22);
  ctx.moveTo(cols[3], tbY + tbH * 0.5);
  ctx.lineTo(W - 14, tbY + tbH * 0.5);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.font = "bold 13px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Contact Address :", 24, tbY + 24);
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("M/s.glass decors pvt ltd / Glass Wings Studio", 150, tbY + 24);
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("No-10, 1st Floor, 200 Feet Service Road", 150, tbY + 44);
  ctx.fillText("Vanagaram, Near Porur Toll Plaza", 150, tbY + 62);
  ctx.fillText("Chennai - 95 | Contact No : 044 - 24664484", 150, tbY + 80);

  // Column 2: GLASS DETAILS
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("GLASS DETAILS", cols[0] + 45, tbY + 16);
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`Thickness     : ${glassThick} mm`, cols[0] + 8, tbY + 42);
  ctx.fillText(`Colour           : SS 304 Grade`, cols[0] + 8, tbY + 62);
  ctx.fillText(`Nature           : Toughened Glass`, cols[0] + 8, tbY + 82);
  ctx.fillText(`Measurement : ${metrics.totalRft} Rft (Approximate)`, cols[0] + 8, tbY + 102);

  // Column 3: CLIENT NAME & ADDRESS
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("CLIENT NAME & ADDRESS", cols[1] + 14, tbY + 16);
  ctx.font = "bold 12px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(clientName || "Mr. Sundar", cols[1] + 35, tbY + 58);
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(projectLocation || "Chennai / Kovilancherry", cols[1] + 25, tbY + 80);

  // Column 4: DRAWING DETAILS
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("DRAWING DETAILS", cols[2] + 32, tbY + 16);
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`Sheet No       : 1/2`, cols[2] + 10, tbY + 42);
  ctx.fillText(`Drawing        : ${drawingNo || "700029"}`, cols[2] + 10, tbY + 62);
  ctx.fillText(`Drawing Date : ${new Date().toLocaleDateString("en-GB")}`, cols[2] + 10, tbY + 82);
  ctx.fillText(`Location       : ${projectLocation || "Kovilancherry"}`, cols[2] + 10, tbY + 102);

  // Column 5: PREPARED BY / REVIEWED BY
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("PREPARED BY:", cols[3] + 12, tbY + 20);
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Mr. Aravind Kumar", cols[3] + 45, tbY + 44);
  ctx.font = "bold 11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("REVIEWED BY:", cols[3] + 12, tbY + 78);
  ctx.font = "11px 'Segoe UI', Arial, sans-serif";
  ctx.fillText("Mr. Prabakaran", cols[3] + 45, tbY + 102);
}

/**
 * Renders the 2D Glass Panel Fabrication & CNC Hole Drilling Cut-Sheet
 */
export function renderFabricationCanvas(canvas, state, selectedPanelIdx = 0) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = "#080f1a";
  ctx.fillRect(0, 0, W, H);

  // Blueprint Grid
  ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const metrics = computeEngineeringMetrics(state);
  const panel = metrics.panels[Math.min(selectedPanelIdx, metrics.panels.length - 1)] || metrics.panels[0];
  const { tread, riser, railHeight, glassThick, studHoleDia } = state;

  // Header
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `2D CNC GLASS FABRICATION SHEET — PANEL ${panel.code} (${panel.stepRange})`,
    28,
    38
  );
  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillText(
    `Material: ${glassThick} mm Clear Toughened Glass (Flat Polished Edges + 1.5mm Arris) | Rake Angle: ${panel.rakeAngleDeg}° | Weight: ${panel.weightKg} kg | Area: ${panel.areaSqFt} Sq.Ft`,
    28,
    62
  );

  // Draw the Single Stepped Glass Panel in Large Scale with CNC Hole Coordinates
  const stepsInPanel = panel.stepCount;
  const pWidth = panel.widthMm;
  const totalStepDrop = (stepsInPanel - 1) * riser;
  const topClearance = railHeight - 55;
  const maxPanelH = topClearance + totalStepDrop + riser;

  const scale = Math.min((W * 0.52) / (pWidth + 300), (H - 180) / (maxPanelH + 250));
  const ox = 110;
  const oy = 120; // Top-Left corner of glass panel

  const slope = riser / tread;
  const px = (mmX) => ox + mmX * scale;
  const py = (mmYFromTopLeft) => oy + mmYFromTopLeft * scale;

  ctx.beginPath();
  // Top-Left (0,0) to Top-Right (pWidth, pWidth * slope)
  ctx.moveTo(px(0), py(0));
  ctx.lineTo(px(pWidth), py(pWidth * slope));

  // Stepped bottom profile from right to left
  for (let s = stepsInPanel - 1; s >= 0; s--) {
    const sxR = s === stepsInPanel - 1 ? pWidth : (s + 1) * tread - 4;
    const sxL = s === 0 ? 0 : s * tread - 4;
    const syDrop = s * riser + topClearance + riser - 12;
    ctx.lineTo(px(sxR), py(syDrop));
    ctx.lineTo(px(sxL), py(syDrop));
  }
  ctx.closePath();

  ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
  ctx.fill();
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Draw CNC Drill Holes (4 Counterbore Holes at Bottom Steps + 2 Top Pipe Holder Holes)
  const holePoints = [
    { label: "H1", x: tread * 0.30 - 4, y: topClearance + riser * 0.45, dia: studHoleDia },
    { label: "H2", x: tread * 0.72 - 4, y: topClearance + riser * 0.45, dia: studHoleDia },
    {
      label: "H3",
      x: (stepsInPanel - 1) * tread + tread * 0.30 - 4,
      y: (stepsInPanel - 1) * riser + topClearance + riser * 0.45,
      dia: studHoleDia
    },
    {
      label: "H4",
      x: (stepsInPanel - 1) * tread + tread * 0.72 - 4,
      y: (stepsInPanel - 1) * riser + topClearance + riser * 0.45,
      dia: studHoleDia
    },
    { label: "H5", x: pWidth * 0.22, y: pWidth * 0.22 * slope + 50, dia: 16 },
    { label: "H6", x: pWidth * 0.78, y: pWidth * 0.78 * slope + 50, dia: 16 }
  ];

  holePoints.forEach((h) => {
    const hx = px(h.x);
    const hy = py(h.y);
    // Crosshair
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx - 12, hy);
    ctx.lineTo(hx + 12, hy);
    ctx.moveTo(hx, hy - 12);
    ctx.lineTo(hx, hy + 12);
    ctx.stroke();

    // Hole Circle
    ctx.beginPath();
    ctx.arc(hx, hy, Math.max(5, h.dia * 0.45 * scale), 0, Math.PI * 2);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`${h.label} (Ø${h.dia}mm)`, hx + 10, hy - 6);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`X:${Math.round(h.x)}mm`, hx + 10, hy + 8);
  });

  // Overall Width Dimension at Top
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(px(0), py(-28));
  ctx.lineTo(px(pWidth), py(-28));
  ctx.moveTo(px(0), py(-35));
  ctx.lineTo(px(0), py(-4));
  ctx.moveTo(px(pWidth), py(-35));
  ctx.lineTo(px(pWidth), py(pWidth * slope - 4));
  ctx.stroke();

  ctx.fillStyle = "#34d399";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    `Horizontal Width: ${pWidth} mm | Sloped Top Length: ${panel.slopedTopMm} mm`,
    px(pWidth * 0.5),
    py(-36)
  );

  // Left Vertical Edge Dimension
  const leftEdgeBottomY = topClearance + riser - 12;
  ctx.beginPath();
  ctx.moveTo(px(-32), py(0));
  ctx.lineTo(px(-32), py(leftEdgeBottomY));
  ctx.stroke();
  ctx.save();
  ctx.translate(px(-44), py(leftEdgeBottomY * 0.5));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`Left Height: ${panel.leftHeightMm} mm`, 0, 0);
  ctx.restore();

  // Step Notch Dimensions on Bottom
  for (let s = 0; s < stepsInPanel; s++) {
    const sxMid = (s + 0.5) * tread;
    const syDrop = s * riser + topClearance + riser - 12;
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${tread}mm`, px(sxMid), py(syDrop) + 18);
    if (s < stepsInPanel - 1) {
      ctx.fillText(`${riser}mm`, px((s + 1) * tread) + 26, py(syDrop + riser * 0.5));
    }
  }

  // Right-Side CNC Specification & Cut-List Summary Box
  const tableX = W * 0.63;
  const tableY = 95;
  const tableW = W * 0.34;

  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.fillRect(tableX, tableY, tableW, H - 130);
  ctx.strokeRect(tableX, tableY, tableW, H - 130);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 14px 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("CNC GLASS FABRICATION SCHEDULE", tableX + 16, tableY + 28);

  const specs = [
    ["Panel ID", `${panel.code} (${panel.stepRange})`],
    ["Glass Spec", `${glassThick} mm Clear Toughened (IS 2553)`],
    ["Geometry Type", panel.isCurved ? `Curved Helical (R=${panel.curveRadiusMm}mm)` : "Stepped Raked Polygon"],
    ["Horizontal Width", `${panel.widthMm} mm`],
    ["Sloped Top Edge", `${panel.slopedTopMm} mm`],
    ["Left / Right Height", `${panel.leftHeightMm} mm / ${panel.rightHeightMm} mm`],
    ["Rake Pitch Angle", `${panel.rakeAngleDeg}°`],
    ["Step Cutouts", `${panel.stepCount} Treads (${tread} × ${riser} mm)`],
    ["Stud Holes (H1-H4)", `4 × Ø${studHoleDia} mm (Counterunk SS 304)`],
    ["Holder Holes (H5-H6)", `2 × Ø16 mm (50 mm from top edge)`],
    ["Edge Polish", "All Edges CNC Flat Polished + Chamfer"],
    ["Panel Weight", `${panel.weightKg} kg`],
    ["Panel Area", `${panel.areaSqFt} Sq.Ft (${panel.areaSqM} m²)`]
  ];

  specs.forEach(([k, v], idx) => {
    const ry = tableY + 58 + idx * 28;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.fillText(k, tableX + 16, ry);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 12px monospace";
    ctx.fillText(v, tableX + 175, ry);
  });
}


/**
 * Renders the 2D Site Installation Blueprint & Hardware Fixing Detail
 */
export function renderInstallationCanvas(canvas, state) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = "#080f1a";
  ctx.fillRect(0, 0, W, H);

  // Blueprint Grid
  ctx.strokeStyle = "rgba(56, 189, 248, 0.07)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const { tread, riser, railHeight, glassThick, pipeDia, studProj, studHoleDia } = state;
  const metrics = computeEngineeringMetrics(state);

  ctx.fillStyle = "#10b981";
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("2D SITE INSTALLATION & HARDWARE ANCHORAGE BLUEPRINT", 28, 38);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px 'Segoe UI', sans-serif";
  ctx.fillText(
    `SS 304 Grade 1" (${studProj}mm) Projection Stud Detail + Pipe-to-Glass Saddle Bracket + Step Core Drilling Layout`,
    28,
    62
  );

  // DETAIL A: Enlarged Cross-Section of 1" Projection Stud & Concrete Step Fixing (Left Side)
  const detAX = 230;
  const detAY = H - 150;

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 14px 'Segoe UI', sans-serif";
  ctx.fillText("DETAIL A: 1\" PROJECTION STUD & GLASS SECTION (SCALE 1:2)", 45, 102);

  // Concrete Step Block
  ctx.fillStyle = "#334155";
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.fillRect(detAX, detAY - 160, 210, 160);
  ctx.strokeRect(detAX, detAY - 160, 210, 160);

  // Wood/Marble Tread Finish on Top of Step
  ctx.fillStyle = "#92400e";
  ctx.fillRect(detAX - 12, detAY - 188, 222, 28);
  ctx.strokeRect(detAX - 12, detAY - 188, 222, 28);

  // M10x110mm Chemical Anchor Embedded in Concrete Step
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(detAX - 65, detAY - 96, 175, 14);
  ctx.strokeStyle = "#f59e0b";
  ctx.strokeRect(detAX, detAY - 102, 115, 26); // Chemical resin sleeve

  // 1" (25.4mm) SS 304 Standoff Spacer Barrel (between concrete face at detAX and glass)
  const spacerW = Math.max(42, studProj * 1.8);
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(detAX - spacerW, detAY - 114, spacerW, 50);
  ctx.strokeStyle = "#475569";
  ctx.strokeRect(detAX - spacerW, detAY - 114, spacerW, 50);

  // Vertical 10mm Toughened Glass Panel in Section
  const gW = Math.max(18, glassThick * 1.8);
  const gX = detAX - spacerW - gW;
  ctx.fillStyle = "rgba(56, 189, 248, 0.35)";
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 2;
  ctx.fillRect(gX, 155, gW, detAY - 195);
  ctx.strokeRect(gX, 155, gW, detAY - 195);

  // EPDM Rubber Washers (either side of glass)
  ctx.fillStyle = "#ef4444";
  ctx.fillRect(detAX - spacerW - 4, detAY - 120, 4, 62);
  ctx.fillRect(gX - 4, detAY - 120, 4, 62);

  // Outer SS 304 Cap Nut (Ø50mm)
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(gX - 22, detAY - 120, 18, 62);
  ctx.strokeRect(gX - 22, detAY - 120, 18, 62);

  // Top Ø50mm SS 304 Handrail Tube & Pipe-to-Glass Holder Bracket
  const pipeCenterX = gX + gW * 0.5;
  const pipeCenterY = 135;
  ctx.beginPath();
  ctx.arc(pipeCenterX, pipeCenterY, 28, 0, Math.PI * 2);
  ctx.fillStyle = "#cbd5e1";
  ctx.fill();
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pipeCenterX, pipeCenterY, 23, 0, Math.PI * 2);
  ctx.fillStyle = "#0f172a";
  ctx.fill();

  // Pipe-to-Glass Holder Stem & Clamp
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(pipeCenterX - 5, pipeCenterY + 28, 10, 48);
  ctx.fillRect(gX - 10, pipeCenterY + 66, gW + 20, 24);

  // Callout Labels for Detail A
  ctx.fillStyle = "#f8fafc";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText(`1. Ø${pipeDia}mm SS 304 Handrail Tube (1.5mm Wall)`, pipeCenterX + 42, pipeCenterY + 4);
  ctx.fillText(`2. SS 304 Pipe-to-Glass Holder (Ø16mm Hole)`, pipeCenterX + 42, pipeCenterY + 78);
  ctx.fillText(`3. ${glassThick}mm Clear Toughened Glass (Railing H = ${railHeight}mm)`, gX + 32, 290);
  ctx.fillText(`4. M10 × 110mm SS 304 Chemical Anchor Bolt`, detAX + 12, detAY - 115);
  ctx.fillText(`5. 1" (${studProj}mm) SS 304 Solid Standoff Spacer`, detAX - spacerW - 15, detAY - 35);
  ctx.fillText(`6. Ø50mm SS 304 Cap + 2mm EPDM Silicone Gaskets`, gX - 110, detAY - 135);

  // DETAIL B: Anchor Step Drilling Layout & Bill of Quantities (Right Side)
  const rightX = W * 0.53;
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 14px 'Segoe UI', sans-serif";
  ctx.fillText("DETAIL B: STEP ANCHOR DRILLING & BILL OF QUANTITIES (BOQ)", rightX, 102);

  // Step side-face drilling diagram
  const stepBoxX = rightX + 20;
  const stepBoxY = 130;
  const stepBoxW = 290;
  const stepBoxH = 135;

  ctx.fillStyle = "rgba(180, 105, 36, 0.22)";
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2;
  ctx.fillRect(stepBoxX, stepBoxY, stepBoxW, stepBoxH);
  ctx.strokeRect(stepBoxX, stepBoxY, stepBoxW, stepBoxH);

  // Two Anchor Stud locations on step side face
  const s1X = stepBoxX + stepBoxW * 0.30;
  const s2X = stepBoxX + stepBoxW * 0.72;
  const sY = stepBoxY + stepBoxH * 0.50;

  [s1X, s2X].forEach((sx, i) => {
    ctx.beginPath();
    ctx.arc(sx, sY, 18, 0, Math.PI * 2);
    ctx.strokeStyle = "#38bdf8";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx, sY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`STUD ${i + 1}`, sx - 22, sY - 24);
  });

  ctx.fillStyle = "#34d399";
  ctx.font = "12px monospace";
  ctx.fillText(
    `Edge Offset1: ${Math.round(tread * 0.30)}mm | C-to-C Spacing: ${Math.round(tread * 0.42)}mm | Depth from Tread Top: ${Math.round(riser * 0.45)}mm`,
     rightX,
    stepBoxY + stepBoxH + 24
  );

  // BOQ Table
  const boqY = 315;
  const boqW = W - rightX - 28;
  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.strokeStyle = "rgba(16, 185, 129, 0.35)";
  ctx.fillRect(rightX, boqY, boqW, H - boqY - 28);
  ctx.strokeRect(rightX, boqY, boqW, H - boqY - 28);

  const boqRows = [
    ["ITEM DESCRIPTION", "SPECIFICATION", "TOTAL QTY"],
    ["Toughened Glass Panels", `${glassThick}mm Clear Tempered (Stepped/Curved)`, `${metrics.totalGlassPanels} Nos (${metrics.totalGlassAreaSqFt} Sq.Ft)`],
    ["Top Handrail SS Pipe", `Ø${pipeDia}mm × 1.5mm SS 304 Brushed`, `${metrics.totalRft} Rft (${(metrics.totalRunningMm / 1000).toFixed(1)} m)`],
    ["1\" Projection Studs", `Ø50mm × ${studProj}mm SS 304 Standoff`, `${metrics.totalStuds} Sets`],
    ["Pipe-to-Glass Holders", `SS 304 Saddle Clamp (Ø16mm Pin)`, `${metrics.totalPipeHolders} Sets`],
    ["Chemical Anchor Bolts", `M10 × 110mm SS 304 + Epoxy Capsule`, `${metrics.totalStuds} Nos`],
    ["EPDM Bushings & Washers", `UV-Stabilized Clear Silicone (Ø${studHoleDia}mm)`, `${metrics.totalStuds * 2} Pairs`]
  ];

  boqRows.forEach((row, idx) => {
    const ry = boqY + 32 + idx * 34;
    if (idx === 0) {
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 12px 'Segoe UI', sans-serif";
    } else {
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "12px 'Segoe UI', sans-serif";
    }
    ctx.fillText(row[0], rightX + 14, ry);
    ctx.fillStyle = idx === 0 ? "#10b981" : "#94a3b8";
    ctx.fillText(row[1], rightX + 185, ry);
    ctx.fillStyle = idx === 0 ? "#10b981" : "#38bdf8";
    ctx.font = "bold 12px monospace";
    ctx.fillText(row[2], rightX + 415, ry);
  });
}


/**
 * Renders Sheet 4: Manufacturer Hardware CNC Cutout & Brand Catalogue Datasheet
 * Supports Dorma / Shivalik / Ozone / Kich / Hafele / Q-railing / Kinlong / CRL Cutouts:
 *  - 1" & 2" Counterbore Projection Studs
 *  - PT-10 / PT-20 / PT-30 Patch Fitting Corner Cutouts (165 x 54 mm + R15 + 2xØ15)
 *  - US-10 Center Patch Lock Cutouts (142 x 82 mm + 2xØ16)
 *  - 90° / 180° Hinge Mouse-Ear Cutouts (90 x 55 mm + 2xØ16)
 *  - 4-Way Spider Routel Countersunk Holes (Ø22 / Ø36 mm)
 *  - Square Deck Spigot & Baluster D-Clamp Notches
 */
export function renderHardwareCutoutCanvas(canvas, state, activeSkuItem) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = "#060c16";
  ctx.fillRect(0, 0, W, H);

  // Fine engineering millimeter grid
  ctx.strokeStyle = "rgba(56, 189, 248, 0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 28) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 28) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const item = activeSkuItem || {
    sku: "SHV-PS-1001",
    brandName: "Shivalik Architectural",
    familyTitle: "1\" (25.4mm) Side-Mount Projection Stud (Point Standoff)",
    cutoutType: "counterbore_hole",
    holeDiaMm: 18,
    counterboreDiaMm: 26,
    notchWidthMm: 165,
    notchHeightMm: 54,
    edgeDistX: 82,
    edgeDistY: 75,
    finishName: "SS 304 Satin Brushed",
    specSummary: "Ø50mm Cap × 25.4mm (1\") Standoff Barrel, M10×110 Chemical Anchor, EPDM Gaskets."
  };

  // Header Banner
  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 18px 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `GLAZING HARDWARE CATALOGUE & CNC GLASS CUTOUT DETAIL — [${item.sku}]`,
    28,
    38
  );
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "bold 14px 'Segoe UI', sans-serif";
  ctx.fillText(`${item.brandName}  •  ${item.familyTitle}  •  Finish: ${item.finishName}`, 28, 62);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillText(item.specSummary, 28, 84);

  // Left Box: 1:1 / Enlarged CNC Glass Cutout Geometry Diagram
  const boxX = 36;
  const boxY = 108;
  const boxW = W * 0.54;
  const boxH = H - 140;

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 13px 'Segoe UI', sans-serif";
  ctx.fillText("CNC GLASS FABRICATION CUTOUT GEOMETRY (ALL DIMENSIONS IN MM, TOLERANCE ±0.5MM)", boxX + 16, boxY + 26);

  const cx = boxX + boxW * 0.48;
  const cy = boxY + boxH * 0.54;

  if (item.cutoutType.includes("patch_pt")) {
    // Draw Dorma / Shivalik PT-10 / PT-20 Corner Patch Fitting CNC Cutout (165mm x 54mm + R15 + 2xØ15mm holes)
    const gw = 420;
    const gh = 340;
    const nw = 220; // scaled 165mm
    const nh = 85;  // scaled 54mm
    const gx = cx - gw * 0.5;
    const gy = cy - gh * 0.5;

    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw, gy);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.lineTo(gx + nw, gy + gh);
    ctx.lineTo(gx + nw, gy + gh - nh);
    ctx.arc(gx + nw - 16, gy + gh - nh, 16, 0, Math.PI * 1.5, true);
    ctx.lineTo(gx, gy + gh - nh);
    ctx.closePath();

    ctx.fillStyle = "rgba(56, 189, 248, 0.16)";
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Two Ø15mm clamping holes inside the PT-10 / PT-20 cutout zone
    [gx + 65, gx + 155].forEach((hx, i) => {
      const hy = gy + gh - nh - 42;
      ctx.beginPath();
      ctx.arc(hx, hy, 14, 0, Math.PI * 2);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`Ø${item.holeDiaMm}mm (#${i + 1})`, hx - 28, hy - 20);
    });

    // Dimensions for PT-10 / PT-20
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`Notch Length: ${item.notchWidthMm || 165} mm`, gx + 30, gy + gh + 28);
    ctx.fillText(`Notch Height: ${item.notchHeightMm || 54} mm`, gx + nw + 16, gy + gh - nh * 0.4);
    ctx.fillText(`Corner Relief Radius: R15 mm | Hole C-to-C: 80 mm`, gx + 20, gy - 16);
  } else if (item.cutoutType === "patch_lock_cutout" || item.cutoutType === "hinge_mouse_ear") {
    // Draw US-10 Center Lock or 90° Hinge Mouse-Ear Edge Cutout
    const gw = 380;
    const gh = 360;
    const nw = 130;
    const nh = 160;
    const gx = cx - gw * 0.45;
    const gy = cy - gh * 0.5;

    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw, gy);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx, cy + nh * 0.5);
    ctx.lineTo(gx + nw, cy + nh * 0.5);
    ctx.lineTo(gx + nw, cy - nh * 0.5);
    ctx.lineTo(gx, cy - nh * 0.5);
    ctx.closePath();

    ctx.fillStyle = "rgba(56, 189, 248, 0.16)";
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Mouse-ear radii at inner corners
    [cy - nh * 0.5, cy + nh * 0.5].forEach((ey) => {
      ctx.beginPath();
      ctx.arc(gx + nw, ey, 18, 0, Math.PI * 2);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.fillStyle = "#34d399";
    ctx.font = "bold 13px monospace";
    ctx.fillText(
      `Edge Cutout: ${item.notchWidthMm} mm × ${item.notchHeightMm} mm + 2 × Ø${item.holeDiaMm}mm Mouse-Ear Relief`,
      gx - 15,
      gy - 16
    );
  } else {
    // Counterbore Standoff Stud / Spider Routel / Spigot / D-Clamp CNC Hole Detail
    const gw = 420;
    const gh = 330;
    const gx = cx - gw * 0.5;
    const gy = cy - gh * 0.5;

    ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.4;
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeRect(gx, gy, gw, gh);

    // Draw Dual CNC Holes + Counterbore Rings
    const h1X = gx + 125;
    const h2X = gx + 295;
    const hY = gy + gh - 95;

    [h1X, h2X].forEach((hx, idx) => {
      // Outer counterbore / cap footprint
      ctx.beginPath();
      ctx.arc(hx, hY, 38, 0, Math.PI * 2);
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner CNC through-hole
      ctx.beginPath();
      ctx.arc(hx, hY, 20, 0, Math.PI * 2);
      ctx.fillStyle = "#060c16";
      ctx.fill();
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Crosshairs
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx - 48, hY); ctx.lineTo(hx + 48, hY);
      ctx.moveTo(hx, hY - 48); ctx.lineTo(hx, hY + 48);
      ctx.stroke();

      ctx.fillStyle = "#fde68a";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(
        item.holeDiaMm > 0 ? `CNC Hole #${idx + 1}: Ø${item.holeDiaMm}mm` : "Dry-Glaze Wedge Clamping",
        hx,
        hY - 50
      );
      if (item.counterboreDiaMm > 0) {
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`Counterbore: Ø${item.counterboreDiaMm}mm`, hx, hY - 66);
      }
    });

    // Edge distance callouts
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `Min Edge Offset X: ${item.edgeDistX} mm | Bottom Edge Offset Y: ${item.edgeDistY} mm | Glass: ${state.glassThick}mm Toughened`,
      gx,
      gy - 16
    );
  }

  // Right Box: Multi-Brand Equivalent Cross-Reference & Technical Specification Table
  const rX = W * 0.60;
  const rY = 108;
  const rW = W * 0.37;
  const rH = H - 140;

  ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
  ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.fillRect(rX, rY, rW, rH);
  ctx.strokeRect(rX, rY, rW, rH);

  ctx.fillStyle = "#f59e0b";
  ctx.font = "bold 14px 'Segoe UI', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("HARDWARE SPECIFICATION & BRAND CROSS-REFERENCE", rX + 16, rY + 28);

  const details = [
    ["Selected SKU Code", item.sku],
    ["Manufacturer Brand", item.brandName],
    ["Hardware Family", item.familyTitle.slice(0, 38)],
    ["Surface Finish", item.finishName],
    ["3D Mounting System", item.mountingMode.toUpperCase()],
    ["CNC Cutout Type", item.cutoutType.toUpperCase()],
    ["Primary Hole Diameter", item.holeDiaMm > 0 ? `Ø${item.holeDiaMm} mm (±0.5mm)` : "No Hole (Friction Channel)"],
    ["Counterbore / Notch", item.counterboreDiaMm ? `Ø${item.counterboreDiaMm} mm` : item.notchWidthMm ? `${item.notchWidthMm} × ${item.notchHeightMm} mm` : "Standard Through-Hole"],
    ["Edge Distance (X / Y)", `${item.edgeDistX} mm / ${item.edgeDistY} mm`],
    ["Compatible Glass", `${state.glassThick}mm Toughened / Laminated (8–19mm)`],
    ["Gasket Material", "2.0mm Clear UV-Stabilized EPDM / Silicone"],
    ["Structural Grade", "AISI 304 / AISI 316 / EN 1991-1-1 Tested"],
    ["Equivalent Brands", "Dorma • Shivalik • Ozone • Kich • Q-railing • CRL"]
  ];

  details.forEach(([k, v], idx) => {
    const ry = rY + 60 + idx * 32;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px 'Segoe UI', sans-serif";
    ctx.fillText(k, rX + 16, ry);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 12px monospace";
    ctx.fillText(v, rX + 180, ry);
  });
}
