/*
================================================================================
  GLASS WINGS STUDIO - 3DS MAX PROCEDURAL STAIRCASE & GLASS RAILING GENERATOR
  Based on CAD Drawing #700029 (Glass Decors - Location: Staircase)
================================================================================
  Specifications (All Dimensions in mm):
  - Glass:         10 mm Toughened Glass (Stepped profile along stair treads)
  - Railing Height: 915 mm (from step nosing to handrail top)
  - Handrail:      Ø50 mm SS 304 Grade Pipe / Tube
  - Top Fixing:    SS 304 Pipe-to-Glass Holder Brackets
  - Bottom Fixing: 1" (25.4 mm) SS 304 Projection Studs (Point-fixed standoffs)
  - Total Run:     Configurable (Default: 15 Steps per flight / ~53 Rft system)
  - Environment:   Modern Residential House Interior + Physical Camera & Sun/Sky
  
  HOW TO RUN IN AUTODESK 3DS MAX (2020 - 2026):
  1. Open 3ds Max -> Scripting -> Run Script... (or drag-and-drop this .ms file
     directly into the 3ds Max viewport).
  2. In the "Glass Wings Studio - Stair & Glass Railing" dialog, adjust
     dimensions if desired and click "BUILD 3D HOUSE STAIRCASE & RENDER SCENE".
  3. Press F9 (or Shift+Q) to render in Arnold, V-Ray, or Corona!
================================================================================
*/

try(destroyDialog GlassWingsStairRollout)catch()

rollout GlassWingsStairRollout "Glass Wings Studio - 3D Staircase & Glass Railing (CAD #700029)" width:420 height:560
(
    groupBox grpCAD "CAD Drawing #700029 Specifications (mm)" pos:[12,10] width:396 height:215
    
    spinner spnSteps "Number of Steps (Flight):" pos:[30,35] width:160 height:16 range:[5,30,15] type:#integer fieldwidth:55
    spinner spnTread "Step Tread Depth (mm):" pos:[30,62] width:160 height:16 range:[200.0,400.0,275.0] type:#float fieldwidth:55
    spinner spnRiser "Step Riser Height (mm):" pos:[30,89] width:160 height:16 range:[120.0,220.0,165.0] type:#float fieldwidth:55
    spinner spnStairWidth "Staircase Width (mm):" pos:[30,116] width:160 height:16 range:[800.0,2400.0,1150.0] type:#float fieldwidth:55
    
    spinner spnRailHeight "Railing Height (mm):" pos:[30,143] width:160 height:16 range:[750.0,1200.0,915.0] type:#float fieldwidth:55
    spinner spnGlassThick "Toughened Glass (mm):" pos:[30,170] width:160 height:16 range:[8.0,19.0,10.0] type:#float fieldwidth:55
    spinner spnPipeDia "SS 304 Pipe Dia (mm):" pos:[30,197] width:160 height:16 range:[38.0,75.0,50.0] type:#float fieldwidth:55

    groupBox grpHardware "SS 304 Hardware & Glass Panel Layout" pos:[12,235] width:396 height:115
    spinner spnStudProj "1\" Projection Stud (mm):" pos:[30,260] width:160 height:16 range:[15.0,60.0,25.4] type:#float fieldwidth:55
    spinner spnStudDia "Stud Cap Diameter (mm):" pos:[30,287] width:160 height:16 range:[30.0,70.0,50.0] type:#float fieldwidth:55
    spinner spnStepsPerPanel "Steps Per Glass Panel:" pos:[30,314] width:160 height:16 range:[3,8,5] type:#integer fieldwidth:55

    groupBox grpHouse "House Interior & Rendering Setup" pos:[12,360] width:396 height:110
    checkbox chkHouseEnv "Build House Interior (Walls, Floors, Double-Height Hall)" pos:[28,385] checked:true
    checkbox chkMaterials "Assign Physical Materials (10mm Glass + Brushed SS 304)" pos:[28,410] checked:true
    checkbox chkLightsCam "Create Architectural Lighting & Physical Camera" pos:[28,435] checked:true

    button btnGenerate "BUILD 3D HOUSE STAIRCASE & GLASS RAILING" pos:[12,482] width:396 height:42
    label lblFooter "Glass Decors Spec: 10mm Toughened Glass | SS 304 | 915mm Height | ~53 Rft" pos:[26,532] width:380 height:18

    -- =========================================================================
    -- PHYSICAL MATERIALS CREATION (Compatible with Arnold, V-Ray, Corona)
    -- =========================================================================
    fn createArchMaterials =
    (
        local mats = #()
        
        -- 1. 10mm Toughened Clear Architectural Glass (Subtle green tempered edge tint)
        local glassMtl = PhysicalMaterial name:"GWS_10mm_Toughened_Glass"
        glassMtl.base_color = color 232 248 244
        glassMtl.roughness = 0.02
        glassMtl.transparency = 0.92
        glassMtl.trans_ior = 1.52
        glassMtl.reflectivity = 1.0
        glassMtl.trans_color = color 225 247 240
        glassMtl.thin_walled = false
        
        -- 2. SS 304 Grade Brushed Stainless Steel (For Ø50mm Pipe, Holders & 1" Studs)
        local ss304Mtl = PhysicalMaterial name:"GWS_SS304_Brushed_Steel"
        ss304Mtl.base_color = color 215 220 225
        ss304Mtl.metalness = 1.0
        ss304Mtl.roughness = 0.18
        ss304Mtl.anisotropy = 0.45
        
        -- 3. Warm Wood / Marble Tread Material
        local treadMtl = PhysicalMaterial name:"GWS_Stair_Oak_Tread"
        treadMtl.base_color = color 168 112 62
        treadMtl.roughness = 0.32
        
        -- 4. Concrete Stair Waist Slab Material
        local concreteMtl = PhysicalMaterial name:"GWS_Stair_Concrete_Slab"
        concreteMtl.base_color = color 195 192 186
        concreteMtl.roughness = 0.65
        
        -- 5. House Interior Wall Paint (Warm Off-White)
        local wallMtl = PhysicalMaterial name:"GWS_House_Interior_Wall"
        wallMtl.base_color = color 244 241 235
        wallMtl.roughness = 0.75
        
        -- 6. House Floor Marble Tile
        local floorMtl = PhysicalMaterial name:"GWS_House_Marble_Floor"
        floorMtl.base_color = color 232 229 222
        floorMtl.roughness = 0.15
        
        #(glassMtl, ss304Mtl, treadMtl, concreteMtl, wallMtl, floorMtl)
    )

    -- =========================================================================
    -- CREATE 1" PROJECTION STUD + PIPE-TO-GLASS HOLDER HARDWARE
    -- =========================================================================
    fn createProjectionStud posPt projDist capDia glassThick ssMtl parentGrp =
    (
        -- Base Flange against stair tread/stringer side (Y-axis outward)
        local baseFlange = Cylinder name:(uniqueName "SS304_Stud_Flange_") \
            radius:(capDia * 0.42) height:5.0 heightsegs:1 sides:24 pos:posPt
        rotate baseFlange (angleAxis 90 [1,0,0])
        
        -- 1" (25.4mm) Barrel Standoff Spacer
        local spacer = Cylinder name:(uniqueName "SS304_1Inch_Stud_Spacer_") \
            radius:(capDia * 0.28) height:projDist heightsegs:1 sides:24 \
            pos:[posPt.x, posPt.y - projDist, posPt.z]
        rotate spacer (angleAxis -90 [1,0,0])
        
        -- Threaded Shaft through 10mm Glass hole
        local shaft = Cylinder name:(uniqueName "SS304_Stud_Shaft_") \
            radius:6.0 height:(projDist + glassThick + 8.0) heightsegs:1 sides:18 \
            pos:[posPt.x, posPt.y, posPt.z]
        rotate shaft (angleAxis 90 [1,0,0])
        
        -- Outer Cap Nut clamping the 10mm Toughened Glass face
        local capNut = Cylinder name:(uniqueName "SS304_Stud_Cap_") \
            radius:(capDia * 0.5) height:10.0 heightsegs:1 sides:32 \
            pos:[posPt.x, posPt.y - projDist - glassThick, posPt.z]
        rotate capNut (angleAxis 90 [1,0,0])
        
        if ssMtl != undefined do (
            baseFlange.material = ssMtl
            spacer.material = ssMtl
            shaft.material = ssMtl
            capNut.material = ssMtl
        )
        
        baseFlange.parent = parentGrp
        spacer.parent = parentGrp
        shaft.parent = parentGrp
        capNut.parent = parentGrp
    )

    fn createPipeToGlassHolder posPt glassY pipeY pipeZ glassThick ssMtl parentGrp =
    (
        -- Circular Clamp on Glass (75mm below glass top edge)
        local clampZ = pipeZ - 85.0
        local glassClamp = Cylinder name:(uniqueName "SS304_Glass_Holder_Disc_") \
            radius:22.0 height:(glassThick + 10.0) sides:24 \
            pos:[posPt.x, glassY + 5.0, clampZ]
        rotate glassClamp (angleAxis 90 [1,0,0])
        
        -- Vertical Saddle Stem supporting the Ø50mm SS Pipe
        local stem = Cylinder name:(uniqueName "SS304_Pipe_Holder_Stem_") \
            radius:7.0 height:65.0 sides:18 \
            pos:[posPt.x, pipeY, clampZ]
        
        -- Curved Cradle Collar under Ø50mm SS Pipe
        local collar = Tube name:(uniqueName "SS304_Pipe_Saddle_") \
            radius1:25.0 radius2:28.0 height:26.0 sides:24 \
            pos:[posPt.x - 13.0, pipeY, pipeZ]
        rotate collar (angleAxis 90 [0,1,0])
        
        if ssMtl != undefined do (
            glassClamp.material = ssMtl
            stem.material = ssMtl
            collar.material = ssMtl
        )
        
        glassClamp.parent = parentGrp
        stem.parent = parentGrp
        collar.parent = parentGrp
    )

    -- =========================================================================
    -- CREATE STEPPED 10MM TOUGHENED GLASS PANEL (MATCHING CAD DRAWING #700029)
    -- =========================================================================
    fn createSteppedGlassPanel startStep endStep tread riser railH glassThick glassY glassMtl parentGrp =
    (
        local gap = 4.0 -- 4mm expansion gap between toughened glass panels
        local xStart = (startStep * tread) + gap
        local xEnd   = ((endStep + 1) * tread) - gap
        
        -- Slope (pitch) of the staircase
        local slope = riser / tread
        
        -- Top edge of glass sits 60mm below the Ø50mm SS Pipe centerline
        local topOffset = railH - 65.0
        
        local sp = SplineShape name:(uniqueName "Glass_10mm_Stepped_Panel_") pos:[0, glassY, 0]
        addNewSpline sp
        
        -- Top-Left & Top-Right corners (raked parallel to Ø50mm SS Pipe handrail)
        local zTopLeft  = ((startStep + 1) * riser) + topOffset - (xStart - (startStep * tread)) * slope
        local zTopRight = ((endStep + 1) * riser) + topOffset - (xEnd - (endStep * tread)) * slope
        
        addKnot sp 1 #corner #line [xStart, glassY, zTopLeft]
        addKnot sp 1 #corner #line [xEnd,   glassY, zTopRight]
        
        -- Stepped Bottom Edge following the stair treads & risers from right (bottom) to left (top)
        local bottomClearance = -15.0 -- Extends slightly down alongside the tread side for 1" Projection Studs
        for s = endStep to startStep by -1 do
        (
            local sxRight = if s == endStep then xEnd else ((s + 1) * tread)
            local sxLeft  = if s == startStep then xStart else (s * tread)
            local szStep  = (s * riser) + bottomClearance
            
            addKnot sp 1 #corner #line [sxRight, glassY, szStep]
            addKnot sp 1 #corner #line [sxLeft,  glassY, szStep]
        )
        
        close sp 1
        updateShape sp
        
        -- Rotate spline knots onto XZ plane and extrude by 10mm along Y
        -- Note: In 3ds Max, Extrude modifier extrudes along local Z; so we build in XY and rotate 90 deg on X
        delete sp
        
        local panelSpline = SplineShape name:(uniqueName "Toughened_Glass_10mm_Panel_") pos:[0, glassY, 0]
        panelSpline.rotation = (eulerAngles 90 0 0)
        addNewSpline panelSpline
        
        addKnot panelSpline 1 #corner #line [xStart, zTopLeft, 0]
        addKnot panelSpline 1 #corner #line [xEnd,   zTopRight, 0]
        
        for s = endStep to startStep by -1 do
        (
            local sxRight = if s == endStep then xEnd else ((s + 1) * tread)
            local sxLeft  = if s == startStep then xStart else (s * tread)
            local szStep  = (s * riser) + bottomClearance
            
            addKnot panelSpline 1 #corner #line [sxRight, szStep, 0]
            addKnot panelSpline 1 #corner #line [sxLeft,  szStep, 0]
        )
        
        close panelSpline 1
        updateShape panelSpline
        
        local extMod = Extrude amount:glassThick capStart:true capEnd:true
        addModifier panelSpline extMod
        
        local chmMod = Chamfer amount:1.0 segments:1
        try(addModifier panelSpline chmMod)catch()
        
        if glassMtl != undefined do panelSpline.material = glassMtl
        panelSpline.wirecolor = color 120 220 245
        panelSpline.parent = parentGrp
        panelSpline
    )

    -- =========================================================================
    -- MAIN BUILD FUNCTION
    -- =========================================================================
    on btnGenerate pressed do
    (
        undo "Generate Glass Wings 3D Staircase" on
        (
            -- Set 3ds Max System Units to Millimeters (matching CAD "All Dimension in mm")
            units.DisplayType = #Metric
            units.MetricType = #Millimeters
            units.SystemType = #Millimeters
            
            local numSteps      = spnSteps.value
            local tread         = spnTread.value
            local riser         = spnRiser.value
            local stairWidth    = spnStairWidth.value
            local railHeight    = spnRailHeight.value
            local glassThick    = spnGlassThick.value
            local pipeDia       = spnPipeDia.value
            local studProj      = spnStudProj.value
            local studDia       = spnStudDia.value
            local stepsPerPanel = spnStepsPerPanel.value
            
            local mats = if chkMaterials.checked then createArchMaterials() else #(undefined, undefined, undefined, undefined, undefined, undefined)
            local glassMtl    = mats[1]
            local ss304Mtl    = mats[2]
            local treadMtl    = mats[3]
            local concreteMtl = mats[4]
            local wallMtl     = mats[5]
            local floorMtl    = mats[6]
            
            local rootDummy = Dummy name:"GlassWings_Staircase_Assembly" pos:[0,0,0] boxsize:[200,200,200]
            
            local totalRun  = numSteps * tread
            local totalRise = numSteps * riser
            
            -- 1. GENERATE STAIRCASE STEPS, WAIST SLAB & LANDINGS
            -- Note: Matching the CAD Elevation where top landing is at Left (X=0, Z=totalRise)
            -- and steps descend toward the Right (X = totalRun, Z = 0).
            for s = 0 to (numSteps - 1) do
            (
                local stepX = s * tread
                local stepZ = (numSteps - 1 - s) * riser
                
                -- Concrete Step Core
                local stepCore = Box name:(uniqueName "Stair_Step_Core_") \
                    length:stairWidth width:tread height:riser \
                    pos:[stepX + (tread * 0.5), stairWidth * 0.5, stepZ]
                if concreteMtl != undefined do stepCore.material = concreteMtl
                stepCore.parent = rootDummy
                
                -- Wooden/Stone L-Shaped Tread & Riser Cladding ( matching brown CAD step profile )
                local treadBoard = Box name:(uniqueName "Stair_Tread_Finish_") \
                    length:(stairWidth + 15.0) width:(tread + 20.0) height:30.0 \
                    pos:[stepX + (tread * 0.5) + 5.0, stairWidth * 0.5, stepZ + riser - 30.0]
                if treadMtl != undefined do treadBoard.material = treadMtl
                treadBoard.parent = rootDummy
            )
            
            -- Upper Landing Slab (Left side of CAD drawing: "Extension... 53 Rft")
            local upperLanding = Box name:"Upper_Landing_Slab" \
                length:stairWidth width:1200.0 height:220.0 \
                pos:[-600.0, stairWidth * 0.5, totalRise - 220.0]
            if concreteMtl != undefined do upperLanding.material = concreteMtl
            upperLanding.parent = rootDummy
            
            local upperFinish = Box name:"Upper_Landing_Finish" \
                length:(stairWidth + 15.0) width:1210.0 height:30.0 \
                pos:[-600.0, stairWidth * 0.5, totalRise - 30.0]
            if treadMtl != undefined do upperFinish.material = treadMtl
            upperFinish.parent = rootDummy
            
            -- Lower Floor Slab (Bottom of CAD drawing)
            local lowerSlab = Box name:"Lower_Floor_Slab" \
                length:(stairWidth + 1800.0) width:(totalRun + 2200.0) height:220.0 \
                pos:[(totalRun * 0.5) - 200.0, (stairWidth * 0.5) + 200.0, -220.0]
            if floorMtl != undefined do lowerSlab.material = floorMtl
            lowerSlab.parent = rootDummy
            
            -- 2. GENERATE STEPPED 10MM TOUGHENED GLASS PANELS & 1" PROJECTION STUDS
            -- Glass sits outside the front stringer edge (Y = -studProj) per SECTION VIEW
            local glassY = -studProj
            local pipeCenterY = -(studProj + (glassThick * 0.5))
            
            local panelStart = 0
            while panelStart < numSteps do
            (
                local panelEnd = amin #(panelStart + stepsPerPanel - 1, numSteps - 1)
                
                -- Build stepped glass panel for [panelStart .. panelEnd]
                -- Adjusting Z coordinates for descending left-to-right CAD orientation:
                local gap = 4.0
                local xStart = (panelStart * tread) + gap
                local xEnd   = ((panelEnd + 1) * tread) - gap
                local slope  = riser / tread
                local topOffset = railHeight - 55.0
                
                local zTopLeft  = totalRise + topOffset - (xStart * slope)
                local zTopRight = totalRise + topOffset - (xEnd * slope)
                
                local panelSpline = SplineShape name:(uniqueName "Toughened_10mm_Glass_Panel_") pos:[0, glassY, 0]
                panelSpline.rotation = (eulerAngles 90 0 0)
                addNewSpline panelSpline
                
                addKnot panelSpline 1 #corner #line [xStart, zTopLeft, 0]
                addKnot panelSpline 1 #corner #line [xEnd,   zTopRight, 0]
                
                for s = panelEnd to panelStart by -1 do
                (
                    local sxRight = if s == panelEnd then xEnd else ((s + 1) * tread)
                    local sxLeft  = if s == panelStart then xStart else (s * tread)
                    local szStep  = ((numSteps - 1 - s) * riser) + 15.0
                    
                    addKnot panelSpline 1 #corner #line [sxRight, szStep, 0]
                    addKnot panelSpline 1 #corner #line [sxLeft,  szStep, 0]
                )
                
                close panelSpline 1
                updateShape panelSpline
                addModifier panelSpline (Extrude amount:glassThick capStart:true capEnd:true)
                if glassMtl != undefined do panelSpline.material = glassMtl
                panelSpline.wirecolor = color 120 220 245
                panelSpline.parent = rootDummy
                
                -- Place Dual 1" Projection Studs on the first and last step of each glass panel (matching CAD circles)
                local anchorSteps = #(panelStart, panelEnd)
                for aStep in anchorSteps do
                (
                    local stepZ = ((numSteps - 1 - aStep) * riser) + (riser * 0.58)
                    local studX1 = (aStep * tread) + (tread * 0.30)
                    local studX2 = (aStep * tread) + (tread * 0.72)
                    
                    createProjectionStud [studX1, 0, stepZ] studProj studDia glassThick ss304Mtl rootDummy
                    createProjectionStud [studX2, 0, stepZ] studProj studDia glassThick ss304Mtl rootDummy
                )
                
                -- Place Pipe-to-Glass Holders at 20% and 80% of each glass panel width
                local holderX1 = xStart + ((xEnd - xStart) * 0.22)
                local holderX2 = xStart + ((xEnd - xStart) * 0.78)
                local pipeZ1 = totalRise + railHeight - (holderX1 * slope)
                local pipeZ2 = totalRise + railHeight - (holderX2 * slope)
                
                createPipeToGlassHolder [holderX1, glassY, pipeZ1] glassY pipeCenterY pipeZ1 glassThick ss304Mtl rootDummy
                createPipeToGlassHolder [holderX2, glassY, pipeZ2] glassY pipeCenterY pipeZ2 glassThick ss304Mtl rootDummy
                
                panelStart += stepsPerPanel
            )
            
            -- 3. GENERATE Ø50 MM SS 304 TOP HANDRAIL PIPE (Continuous Spline + Sweep/Renderable)
            local handrailSpline = SplineShape name:"SS304_50mm_Handrail_Pipe" pos:[0,0,0]
            addNewSpline handrailSpline
            
            local extTopX = -180.0
            local extTopZ = totalRise + railHeight + (180.0 * (riser / tread))
            local extBotX = totalRun + 80.0
            local extBotZ = railHeight - (80.0 * (riser / tread))
            
            addKnot handrailSpline 1 #smooth #curve [extTopX, pipeCenterY, extTopZ]
            addKnot handrailSpline 1 #corner #line  [0.0,     pipeCenterY, totalRise + railHeight]
            addKnot handrailSpline 1 #corner #line  [totalRun, pipeCenterY, railHeight]
            addKnot handrailSpline 1 #smooth #curve [extBotX, pipeCenterY, extBotZ - 35.0]
            updateShape handrailSpline
            
            handrailSpline.render_renderable = true
            handrailSpline.render_displayRenderMesh = true
            handrailSpline.render_useViewportSettings = false
            handrailSpline.render_thickness = pipeDia
            handrailSpline.render_sides = 32
            if ss304Mtl != undefined do handrailSpline.material = ss304Mtl
            handrailSpline.parent = rootDummy
            
            -- 4. OPTIONAL HOUSE INTERIOR ENVIRONMENT (Walls, Double-Height Hall, Window)
            if chkHouseEnv.checked do
            (
                -- Rear Stairwell Wall (behind the staircase at Y = stairWidth)
                local backWall = Box name:"House_Stairwell_Wall" \
                    length:200.0 width:(totalRun + 2600.0) height:(totalRise + 2800.0) \
                    pos:[(totalRun * 0.5) - 200.0, stairWidth + 100.0, -220.0]
                if wallMtl != undefined do backWall.material = wallMtl
                backWall.parent = rootDummy
                
                -- Left Landing Wall
                local leftWall = Box name:"House_Left_Wall" \
                    length:2600.0 width:200.0 height:(totalRise + 2800.0) \
                    pos:[-1300.0, (stairWidth * 0.5) - 200.0, -220.0]
                if wallMtl != undefined do leftWall.material = wallMtl
                leftWall.parent = rootDummy
            )
            
            -- 5. ARCHITECTURAL LIGHTING & PHYSICAL CAMERA FOR 3D RENDERING
            if chkLightsCam.checked do
            (
                -- Physical Camera framed on the staircase elevation & 3/4 architectural view
                local camPos = [totalRun * 0.55, -3600.0, totalRise * 0.62]
                local camTargetPos = [totalRun * 0.45, stairWidth * 0.25, totalRise * 0.50]
                
                try (
                    local physCam = Physical pos:camPos target:(Targetobject pos:camTargetPos) \
                        name:"GlassWings_Render_Camera" focal_length_mm:35.0 f_stop:5.6
                    viewport.setCamera physCam
                ) catch (
                    local freeCam = Targetcamera pos:camPos target:(Targetobject pos:camTargetPos) \
                        name:"GlassWings_Render_Camera" fov:48.0
                    viewport.setCamera freeCam
                )
                
                -- Key Architectural Sunlight & Warm Interior Fill Lights
                local keyLight = Omnilight name:"ArchViz_Sun_KeyLight" \
                    pos:[totalRun * 0.8, -2800.0, totalRise + 2200.0] \
                    multiplier:1.35 rgb:(color 255 248 238)
                
                local fillLight = Omnilight name:"ArchViz_Interior_FillLight" \
                    pos:[-600.0, -1800.0, totalRise + 1200.0] \
                    multiplier:0.65 rgb:(color 225 238 255)
                
                local rimLight = Omnilight name:"ArchViz_Glass_RimLight" \
                    pos:[totalRun * 0.5, stairWidth + 800.0, totalRise + 1600.0] \
                    multiplier:0.85 rgb:(color 255 242 220)
            )
            
            max views redraw
            messagebox "3D House Staircase & 10mm Toughened Glass Railing successfully generated!\n\nPress F9 (or Shift+Q) in 3ds Max to render." title:"Glass Wings Studio - Ready to Render"
        )
    )
)

createDialog GlassWingsStairRollout
