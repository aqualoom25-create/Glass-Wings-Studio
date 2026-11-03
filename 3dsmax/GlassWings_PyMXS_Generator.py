"""
================================================================================
  GLASS WINGS STUDIO - 3DS MAX PYTHON (pymxs) STAIRCASE & GLASS RAILING BUILDER
  Based on CAD Drawing #700029 (Glass Decors - Location: Staircase)
================================================================================
  Specifications (All Dimensions in mm):
  - Glass:          10 mm Toughened Glass (Stepped profile along stair treads)
  - Railing Height: 915 mm
  - Handrail:       Ø50 mm SS 304 Grade Pipe / Tube
  - Top Fixing:     SS 304 Pipe-to-Glass Holder
  - Bottom Fixing:  1" (25.4 mm) SS 304 Projection Stud
  - Total Run:      53 Rft system (15 Steps per flight)

  HOW TO RUN IN AUTODESK 3DS MAX (2021 - 2026):
  Scripting -> Scripting Editor -> Open this .py file -> Tools -> Evaluate All (Ctrl+E)
================================================================================
"""

import os
from pymxs import runtime as rt


def build_glass_wings_staircase():
    """Executes the MAXScript generator directly inside 3ds Max via pymxs."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    ms_path = os.path.join(script_dir, "GlassWings_Staircase_Generator.ms")

    if os.path.exists(ms_path):
        rt.fileIn(ms_path)
        print("[Glass Wings Studio] Loaded MAXScript UI & Generator:", ms_path)
    else:
        raise FileNotFoundError(f"Could not find {ms_path}")


if __name__ == "__main__":
    build_glass_wings_staircase()
