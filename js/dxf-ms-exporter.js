/**
 * Glass Wings Studio — 2D AutoCAD DXF & Dynamic 3ds Max (.ms) Exporter
 * Generates production-ready 2D CAD DXF files (Elevation + Glass Fabrication Cut Sheets)
 * and parameterized 3ds Max MAXScript (.ms) files.
 */

export function generateAutoCADDXF(state) {
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
    clientName,
    projectLocation,
    drawingNo
  } = state;

  const lines = [];
  const add = (code, val) => {
    lines.push(String(code), String(val));
  };

  // DXF Header & Layer Table
  add(0, "SECTION");
  add(2, "HEADER");
  add(9, "$INSUNITS");
  add(70, 4); // 4 = Millimeters
  add(0, "ENDSEC");

  add(0, "SECTION");
  add(2, "TABLES");
  add(0, "TABLE");
  add(2, "LAYER");
  add(70, 6);

  const layers = [
    { name: "STAIRS_CONCRETE", color: 32 },
    { name: "GLASS_10MM_TOUGHENED", color: 4 }, // Cyan
    { name: "SS304_PIPE_50MM", color: 7 },      // White
    { name: "SS304_HARDWARE_STUDS", color: 3 }, // Green
    { name: "DIMENSIONS_TEXT", color: 5 },      // Blue
    { name: "FABRICATION_CUTSHEET", color: 2 }  // Yellow
  ];

  layers.forEach((l) => {
    add(0, "LAYER");
    add(2, l.name);
    add(70, 0);
    add(62, l.color);
    add(6, "CONTINUOUS");
  });

  add(0, "ENDTAB");
  add(0, "ENDSEC");

  // Entities Section
  add(0, "SECTION");
  add(2, "ENTITIES");

  const dxfLine = (x1, y1, x2, y2, layer) => {
    add(0, "LINE");
    add(8, layer);
    add(10, x1.toFixed(2));
    add(20, y1.toFixed(2));
    add(30, "0.0");
    add(11, x2.toFixed(2));
    add(21, y2.toFixed(2));
    add(31, "0.0");
  };

  const dxfCircle = (cx, cy, r, layer) => {
    add(0, "CIRCLE");
    add(8, layer);
    add(10, cx.toFixed(2));
    add(20, cy.toFixed(2));
    add(30, "0.0");
    add(40, r.toFixed(2));
  };

  const dxfText = (x, y, height, text, layer) => {
    add(0, "TEXT");
    add(8, layer);
    add(10, x.toFixed(2));
    add(20, y.toFixed(2));
    add(30, "0.0");
    add(40, height.toFixed(2));
    add(1, text);
  };

  const totalRun = numSteps * tread;
  const totalRise = numSteps * riser;
  const slope = riser / tread;

  // 1. Draw 2D Side Elevation (Left-to-Right Descending matching CAD #700029)
  // Upper landing
  dxfLine(-800, totalRise, 0, totalRise, "STAIRS_CONCRETE");
  dxfLine(-800, totalRise - 200, 0, totalRise - 200, "STAIRS_CONCRETE");

  for (let s = 0; s < numSteps; s++) {
    const sx = s * tread;
    const syTop = (numSteps - s) * riser;
    const syBot = (numSteps - 1 - s) * riser;
    // Riser
    dxfLine(sx, syTop, sx, syBot, "STAIRS_CONCRETE");
    // Tread
    dxfLine(sx, syBot, sx + tread, syBot, "STAIRS_CONCRETE");
  }

  // Lower Floor Slab
  dxfLine(0, -200, totalRun + 500, -200, "STAIRS_CONCRETE");
  dxfLine(totalRun, 0, totalRun + 500, 0, "STAIRS_CONCRETE");

  // 2. Stepped Glass Panels & Hardware in Elevation
  const topClearance = railHeight - 55;
  let panelIndex = 1;

  for (let pStart = 0; pStart < numSteps; pStart += stepsPerPanel) {
    const pEnd = Math.min(pStart + stepsPerPanel - 1, numSteps - 1);
    const gap = 4;
    const xStart = pStart * tread + gap;
    const xEnd = (pEnd + 1) * tread - gap;

    const yTopLeft = totalRise + topClearance - xStart * slope;
    const yTopRight = totalRise + topClearance - xEnd * slope;

    // Top sloped edge of glass
    dxfLine(xStart, yTopLeft, xEnd, yTopRight, "GLASS_10MM_TOUGHENED");
    // Left vertical edge
    const yBotLeft = (numSteps - 1 - pStart) * riser + 12;
    dxfLine(xStart, yTopLeft, xStart, yBotLeft, "GLASS_10MM_TOUGHENED");
    // Right vertical edge
    const yBotRight = (numSteps - 1 - pEnd) * riser + 12;
    dxfLine(xEnd, yTopRight, xEnd, yBotRight, "GLASS_10MM_TOUGHENED");

    // Stepped Bottom Edge
    for (let s = pStart; s <= pEnd; s++) {
      const sxL = s === pStart ? xStart : s * tread;
      const sxR = s === pEnd ? xEnd : (s + 1) * tread;
      const syStep = (numSteps - 1 - s) * riser + 12;
      dxfLine(sxL, syStep, sxR, syStep, "GLASS_10MM_TOUGHENED");
      if (s < pEnd) {
        const syNext = (numSteps - 2 - s) * riser + 12;
        dxfLine(sxR, syStep, sxR, syNext, "GLASS_10MM_TOUGHENED");
      }
    }

    // Dual 1" Projection Studs & CNC Holes on anchor steps
    [pStart, pEnd].forEach((aStep) => {
      const studY = (numSteps - 1 - aStep) * riser + riser * 0.55;
      const studX1 = aStep * tread + tread * 0.30;
      const studX2 = aStep * tread + tread * 0.72;
      dxfCircle(studX1, studY, 25, "SS304_HARDWARE_STUDS");
      dxfCircle(studX1, studY, studHoleDia * 0.5, "GLASS_10MM_TOUGHENED");
      dxfCircle(studX2, studY, 25, "SS304_HARDWARE_STUDS");
      dxfCircle(studX2, studY, studHoleDia * 0.5, "GLASS_10MM_TOUGHENED");
    });

    // Top Pipe-to-Glass Holder holes
    const hX1 = xStart + (xEnd - xStart) * 0.22;
    const hX2 = xStart + (xEnd - xStart) * 0.78;
    const hY1 = totalRise + topClearance - hX1 * slope - 45;
    const hY2 = totalRise + topClearance - hX2 * slope - 45;
    dxfCircle(hX1, hY1, 8, "SS304_HARDWARE_STUDS");
    dxfCircle(hX2, hY2, 8, "SS304_HARDWARE_STUDS");

    // 3. Draw Individual 2D Glass Panel Fabrication Cut-Sheet below the Elevation
    const fabOffsetX = (panelIndex - 1) * (stepsPerPanel * tread + 450);
    const fabOffsetY = -1800;
    const pWidth = xEnd - xStart;
    const pHeightLeft = yTopLeft - yBotLeft;

    dxfText(
      fabOffsetX,
      fabOffsetY + yTopLeft - yBotRight + 120,
      45,
      `PANEL G-0${panelIndex} (${glassThick}mm TOUGHENED GLASS - W:${Math.round(pWidth)}mm x H:${Math.round(pHeightLeft)}mm)`,
      "FABRICATION_CUTSHEET"
    );

    // Shifted panel geometry for CNC fabrication sheet
    dxfLine(fabOffsetX, fabOffsetY + (yTopLeft - yBotRight), fabOffsetX + pWidth, fabOffsetY + (yTopRight - yBotRight), "FABRICATION_CUTSHEET");
    dxfLine(fabOffsetX, fabOffsetY + (yTopLeft - yBotRight), fabOffsetX, fabOffsetY + (yBotLeft - yBotRight), "FABRICATION_CUTSHEET");
    dxfLine(fabOffsetX + pWidth, fabOffsetY + (yTopRight - yBotRight), fabOffsetX + pWidth, fabOffsetY, "FABRICATION_CUTSHEET");

    for (let s = pStart; s <= pEnd; s++) {
      const sxL = (s === pStart ? xStart : s * tread) - xStart;
      const sxR = (s === pEnd ? xEnd : (s + 1) * tread) - xStart;
      const syStep = (numSteps - 1 - s) * riser + 12 - yBotRight;
      dxfLine(fabOffsetX + sxL, fabOffsetY + syStep, fabOffsetX + sxR, fabOffsetY + syStep, "FABRICATION_CUTSHEET");
      if (s < pEnd) {
        const syNext = (numSteps - 2 - s) * riser + 12 - yBotRight;
        dxfLine(fabOffsetX + sxR, fabOffsetY + syStep, fabOffsetX + sxR, fabOffsetY + syNext, "FABRICATION_CUTSHEET");
      }
    }

    // CNC Holes on Fabrication Sheet
    [pStart, pEnd].forEach((aStep) => {
      const studY = (numSteps - 1 - aStep) * riser + riser * 0.55 - yBotRight;
      const studX1 = aStep * tread + tread * 0.30 - xStart;
      const studX2 = aStep * tread + tread * 0.72 - xStart;
      dxfCircle(fabOffsetX + studX1, fabOffsetY + studY, studHoleDia * 0.5, "FABRICATION_CUTSHEET");
      dxfCircle(fabOffsetX + studX2, fabOffsetY + studY, studHoleDia * 0.5, "FABRICATION_CUTSHEET");
    });

    panelIndex++;
  }

  // Handrail Pipe Top & Bottom Lines
  dxfLine(0, totalRise + railHeight + pipeDia * 0.5, totalRun, railHeight + pipeDia * 0.5, "SS304_PIPE_50MM");
  dxfLine(0, totalRise + railHeight - pipeDia * 0.5, totalRun, railHeight - pipeDia * 0.5, "SS304_PIPE_50MM");

  // Title & Annotations
  dxfText(0, totalRise + railHeight + 350, 65, `LOCATION - STAIRCASE (${stairType.toUpperCase()}) | DRAWING #${drawingNo}`, "DIMENSIONS_TEXT");
  dxfText(0, totalRise + railHeight + 240, 45, `CLIENT: ${clientName} | LOCATION: ${projectLocation} | GLASS: ${glassThick}mm TOUGHENED | RAIL HEIGHT: ${railHeight}mm`, "DIMENSIONS_TEXT");

  add(0, "ENDSEC");
  add(0, "EOF");

  return lines.join("\n");
}

export function generateDynamicMaxScript(state) {
  const {
    stairType,
    buildingEnv,
    numSteps,
    tread,
    riser,
    stairWidth,
    railHeight,
    glassThick,
    pipeDia,
    studProj,
    stepsPerPanel,
    curveRadius,
    curveAngle
  } = state;

  return `/*
================================================================================
  GLASS WINGS STUDIO — CUSTOM EXPORTED 3DS MAX SCRIPT (.MS)
  Staircase Mode: ${stairType.toUpperCase()} | Building Environment: ${buildingEnv.toUpperCase()}
  Generated Parameters:
  - Steps: ${numSteps} | Tread: ${tread}mm | Riser: ${riser}mm | Width: ${stairWidth}mm
  - Glass: ${glassThick}mm Toughened | Railing Height: ${railHeight}mm
  - Handrail Pipe: Ø${pipeDia}mm SS 304 | 1" Stud Offset: ${studProj}mm
================================================================================
*/

undo "Glass Wings Custom 3D Staircase & Building" on
(
    units.DisplayType = #Metric
    units.MetricType = #Millimeters
    units.SystemType = #Millimeters

    local stairType     = "${stairType}"
    local buildingEnv   = "${buildingEnv}"
    local numSteps      = ${numSteps}
    local tread         = ${tread}.0
    local riser         = ${riser}.0
    local stairWidth    = ${stairWidth}.0
    local railHeight    = ${railHeight}.0
    local glassThick    = ${glassThick}.0
    local pipeDia       = ${pipeDia}.0
    local studProj      = ${studProj}
    local stepsPerPanel = ${stepsPerPanel}
    local curveRadius   = ${curveRadius || 2400}.0
    local curveAngle    = ${curveAngle || 135}.0

    -- Physical Materials
    local glassMtl = PhysicalMaterial name:"GWS_${glassThick}mm_Toughened_Glass" base_color:(color 230 248 244) roughness:0.02 transparency:0.92 trans_ior:1.52 reflectivity:1.0
    local ss304Mtl = PhysicalMaterial name:"GWS_SS304_Brushed" base_color:(color 218 223 228) metalness:1.0 roughness:0.16
    local treadMtl = PhysicalMaterial name:"GWS_Tread_Finish" base_color:(color 172 115 64) roughness:0.32
    local concMtl  = PhysicalMaterial name:"GWS_Concrete_Structure" base_color:(color 198 195 190) roughness:0.68
    local wallMtl  = PhysicalMaterial name:"GWS_Building_Wall" base_color:(color 242 239 233) roughness:0.75

    local rootGrp = Dummy name:"GWS_${stairType}_Assembly" pos:[0,0,0]
    local totalRun = numSteps * tread
    local totalRise = numSteps * riser

    if stairType == "rounded" then
    (
        -- Helical / Rounded Commercial Staircase with Curved Glass Railing
        local angleStep = curveAngle / numSteps
        for s = 0 to (numSteps - 1) do
        (
            local ang = s * angleStep
            local rad = degToRad ang
            local px = (cos rad) * curveRadius
            local py = (sin rad) * curveRadius
            local pz = s * riser

            local stepBox = Box name:(uniqueName "Curved_Step_") length:stairWidth width:(tread * 1.15) height:riser pos:[px, py, pz]
            stepBox.rotation = eulerAngles 0 0 (ang + 90)
            stepBox.material = treadMtl
            stepBox.parent = rootGrp

            -- Outer Curved 1" Projection Studs & Glass Standoffs
            local outerR = curveRadius + (stairWidth * 0.5) + studProj
            local gx = (cos rad) * outerR
            local gy = (sin rad) * outerR
            local stud = Cylinder name:(uniqueName "SS304_Curved_Stud_") radius:24 height:(studProj + glassThick + 10) pos:[gx, gy, pz + (riser * 0.5)]
            stud.material = ss304Mtl
            stud.parent = rootGrp
        )

        -- Helical Handrail & Curved Glass Spline
        local railSp = SplineShape name:"Curved_SS304_Handrail_Pipe"
        addNewSpline railSp
        for s = 0 to numSteps do
        (
            local ang = s * angleStep
            local rad = degToRad ang
            local outerR = curveRadius + (stairWidth * 0.5) + studProj
            addKnot railSp 1 #smooth #curve [(cos rad) * outerR, (sin rad) * outerR, (s * riser) + railHeight]
        )
        updateShape railSp
        railSp.render_renderable = true
        railSp.render_displayRenderMesh = true
        railSp.render_thickness = pipeDia
        railSp.material = ss304Mtl
        railSp.parent = rootGrp
    )
    else
    (
        -- Straight / Duplex / Mall Atrium Stepped 10mm Toughened Glass Staircase
        for s = 0 to (numSteps - 1) do
        (
            local sx = s * tread
            local sz = (numSteps - 1 - s) * riser
            local stepCore = Box length:stairWidth width:tread height:riser pos:[sx + tread*0.5, stairWidth*0.5, sz] material:concMtl
            local stepTop  = Box length:(stairWidth+16) width:(tread+18) height:30 pos:[sx + tread*0.5, stairWidth*0.5, sz + riser - 30] material:treadMtl
            stepCore.parent = rootGrp
            stepTop.parent = rootGrp
        )

        local glassY = -studProj
        local slope = riser / tread
        local pStart = 0
        while pStart < numSteps do
        (
            local pEnd = amin #(pStart + stepsPerPanel - 1, numSteps - 1)
            local xStart = pStart * tread + 4.0
            local xEnd = (pEnd + 1) * tread - 4.0
            local zTopL = totalRise + (railHeight - 55.0) - (xStart * slope)
            local zTopR = totalRise + (railHeight - 55.0) - (xEnd * slope)

            local sp = SplineShape name:(uniqueName "Glass_10mm_Panel_") pos:[0, glassY, 0]
            sp.rotation = eulerAngles 90 0 0
            addNewSpline sp
            addKnot sp 1 #corner #line [xStart, zTopL, 0]
            addKnot sp 1 #corner #line [xEnd, zTopR, 0]
            for s = pEnd to pStart by -1 do
            (
                local sxR = if s == pEnd then xEnd else ((s + 1) * tread)
                local sxL = if s == pStart then xStart else (s * tread)
                local szS = ((numSteps - 1 - s) * riser) + 12.0
                addKnot sp 1 #corner #line [sxR, szS, 0]
                addKnot sp 1 #corner #line [sxL, szS, 0]
            )
            close sp 1
            updateShape sp
            addModifier sp (Extrude amount:glassThick capStart:true capEnd:true)
            sp.material = glassMtl
            sp.parent = rootGrp
            pStart += stepsPerPanel
        )

        local pipeSp = SplineShape name:"SS304_50mm_Handrail_Pipe"
        addNewSpline pipeSp
        addKnot pipeSp 1 #corner #line [0, -studProj, totalRise + railHeight]
        addKnot pipeSp 1 #corner #line [totalRun, -studProj, railHeight]
        updateShape pipeSp
        pipeSp.render_renderable = true
        pipeSp.render_displayRenderMesh = true
        pipeSp.render_thickness = pipeDia
        pipeSp.material = ss304Mtl
        pipeSp.parent = rootGrp
    )

    max views redraw
    messagebox "Custom Glass Wings 3D Staircase & Glass Railing generated!" title:"Glass Wings Studio"
)
`;
}
