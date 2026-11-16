"""3D contract hero image for outflow, in the look of launch-video/refs
(pale ground, one iridescent ribbon, glass cards, thin sans + one italic word).

Run:  /Applications/Blender.app/Contents/MacOS/Blender -b -P blender/contract_scene.py -- public/assets/contract-3d.png [width] [samples]
"""
import math
import os
import sys

import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = os.path.abspath(argv[0]) if argv else os.path.abspath("contract-3d.png")
WIDTH = int(argv[1]) if len(argv) > 1 else 1600
SAMPLES = int(argv[2]) if len(argv) > 2 else 128

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


# ---------- helpers ----------
def lin(hex_color, alpha=1.0):
    """sRGB hex -> linear RGBA."""
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, alpha)


def principled(name, **values):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    for key, val in values.items():
        if key in bsdf.inputs:
            bsdf.inputs[key].default_value = val
    return mat, bsdf


def link(obj):
    scene.collection.objects.link(obj)
    return obj


def rounded_rect(name, w, h, r, depth, mat, bevel=0.004):
    """Rounded rectangle slab lying in the local XY plane, centred on the origin."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "2D"
    cu.fill_mode = "BOTH"
    cu.extrude = depth / 2
    cu.bevel_depth = bevel
    cu.bevel_resolution = 3
    pts = []
    for cx, cy, a0 in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90),
                       (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for k in range(13):
            a = math.radians(a0 + 90 * k / 12)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, (x, y) in zip(sp.points, pts):
        p.co = (x, y, 0, 1)
    sp.use_cyclic_u = True
    obj = link(bpy.data.objects.new(name, cu))
    obj.data.materials.append(mat)
    return obj


def font(path):
    try:
        return bpy.data.fonts.load(path) if os.path.exists(path) else None
    except Exception:
        return None


SANS = font("/System/Library/Fonts/Supplemental/Arial.ttf")
SANS_B = font("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
SERIF_I = font("/System/Library/Fonts/Supplemental/Georgia Italic.ttf")


def text(body, size, x, y, z, mat, fnt=None, parent=None, spacing=1.0, align="LEFT"):
    cu = bpy.data.curves.new("txt", "FONT")
    cu.body = body
    cu.size = size
    cu.extrude = 0.0025
    cu.space_character = spacing
    cu.align_x = align
    if fnt:
        cu.font = fnt
    obj = link(bpy.data.objects.new("txt", cu))
    obj.location = (x, y, z)
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def bezier(name, points, tilts=None, extrude=0.0, bevel=0.0, mat=None, parent=None):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.resolution_u = 48
    cu.extrude = extrude
    cu.bevel_depth = bevel
    cu.bevel_resolution = 6
    cu.twist_smooth = 8
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(len(points) - 1)
    for i, (bp, co) in enumerate(zip(sp.bezier_points, points)):
        bp.co = co
        bp.handle_left_type = bp.handle_right_type = "AUTO"
        if tilts:
            bp.tilt = tilts[i]
    obj = link(bpy.data.objects.new(name, cu))
    if mat:
        obj.data.materials.append(mat)
    obj.parent = parent
    return obj


# ---------- materials ----------
paper, _ = principled("paper", **{"Base Color": lin("#FBFCFE"), "Roughness": 0.32, "Coat Weight": 0.6, "Coat Roughness": 0.12})
ink, _ = principled("ink", **{"Base Color": lin("#111216"), "Roughness": 0.45})
grey, _ = principled("grey", **{"Base Color": lin("#AEB6C6"), "Roughness": 0.5})
soft, _ = principled("soft", **{"Base Color": lin("#E3E7EF"), "Roughness": 0.5})
muted, _ = principled("muted", **{"Base Color": lin("#7A8194"), "Roughness": 0.5})
ground, _ = principled("ground", **{"Base Color": lin("#EEF0F4"), "Roughness": 0.55})


def iridescent(name, axis=0, roughness=0.16, stops=None):
    """Satin ribbon: cyan -> violet -> pink -> warm orange along its length, pearl-white at grazing angles."""
    mat, bsdf = principled(name, **{"Roughness": roughness, "Coat Weight": 1.0, "Coat Roughness": 0.06,
                                    "Sheen Weight": 0.4, "Metallic": 0.15})
    nt = mat.node_tree
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    stops = stops or [(0.2, "#5FD4F0"), (0.42, "#8B7CF6"), (0.62, "#F2A7D8"), (0.82, "#FF8A4C")]
    cr = ramp.color_ramp
    cr.elements[0].position, cr.elements[0].color = stops[0][0], lin(stops[0][1])
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], lin(stops[-1][1])
    for pos, col in stops[1:-1]:
        e = cr.elements.new(pos)
        e.color = lin(col)
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.18
    mix = nt.nodes.new("ShaderNodeMixRGB")
    mix.inputs["Color2"].default_value = lin("#FFFFFF")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    nt.links.new(sep.outputs[axis], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix.inputs["Color1"])
    nt.links.new(lw.outputs["Facing"], mix.inputs["Fac"])
    nt.links.new(mix.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def blob(name, inner, outer):
    """Frosted glass card with a soft colour blob, as in the second Pinterest reference."""
    mat, bsdf = principled(name, **{"Roughness": 0.4, "Coat Weight": 0.5})
    nt = mat.node_tree
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Location"].default_value = (-0.5, -0.5, 0)
    mp.inputs["Scale"].default_value = (1.7, 1.7, 1)
    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    cr = ramp.color_ramp
    cr.elements[0].position, cr.elements[0].color = 0.0, lin("#FFFFFF")
    cr.elements[1].position, cr.elements[1].color = 1.0, lin(inner)
    mid = cr.elements.new(0.45)
    mid.color = lin(outer)
    nt.links.new(tc.outputs["Generated"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
    if "Emission Color" in bsdf.inputs:
        nt.links.new(ramp.outputs["Color"], bsdf.inputs["Emission Color"])
        bsdf.inputs["Emission Strength"].default_value = 0.25
    return mat


ribbon_mat = iridescent("ribbon")
seal_mat = iridescent("seal", axis=0, roughness=0.22)
sign_mat, _ = principled("sign", **{"Base Color": lin("#3B2FB8"), "Roughness": 0.3, "Coat Weight": 1.0})

# ---------- ground ----------
bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, 0))
bpy.context.object.data.materials.append(ground)

# ---------- the contract ----------
W, H, T = 2.5, 3.4, 0.05
doc = link(bpy.data.objects.new("Contract", None))
sheet = rounded_rect("sheet", W, H, 0.16, T, paper)
sheet.parent = doc
z = T / 2 + 0.006
L = -W / 2 + 0.26

text("OUTFLOW  ·  BUILT FOR FRANK", 0.062, L, 1.36, z, muted, SANS_B, doc, spacing=1.25)
text("No. 0001", 0.062, W / 2 - 0.26, 1.36, z, muted, SANS, doc, align="RIGHT")
trial = text("Trial", 0.30, L, 0.93, z, ink, SANS, doc, spacing=0.96)
bpy.context.view_layer.update()
text("agreement", 0.30, L + trial.dimensions.x + 0.085, 0.93, z, sign_mat, SERIF_I, doc, spacing=0.96)
text("FRANK  ×  Kingsmere Risk Solutions Ltd", 0.088, L, 0.68, z, ink, SANS, doc)

# clause lines: grey bars standing in for the terms
rows = [(0.42, 1.0), (0.30, 0.94), (0.18, 0.86), (0.06, 0.97), (-0.06, 0.62),
        (-0.30, 1.0), (-0.42, 0.9), (-0.54, 0.74)]
for y, frac in rows:
    bar = rounded_rect("bar", (W - 0.52) * frac, 0.042, 0.02, 0.006, grey, bevel=0.0)
    bar.location = (L + (W - 0.52) * frac / 2, y, z)
    bar.parent = doc

# price pill
pill = rounded_rect("pill", 1.42, 0.2, 0.1, 0.012, soft, bevel=0.002)
pill.location = (L + 0.71, -0.82, z)
pill.parent = doc
text("€39 / month  ·  no lock-in", 0.085, L + 0.1, -0.85, z + 0.008, ink, SANS_B, doc)

# signature: a hand-drawn line of ink over a rule
SIG = [(0.00, 0.02), (0.06, 0.20), (0.10, 0.26), (0.13, 0.10), (0.10, -0.04), (0.17, 0.04), (0.24, 0.16),
       (0.27, 0.05), (0.31, 0.00), (0.37, 0.12), (0.42, 0.03), (0.47, 0.10), (0.53, 0.02), (0.60, 0.09),
       (0.66, 0.03), (0.74, 0.07), (0.85, 0.04), (1.00, 0.10), (1.18, 0.17), (1.32, 0.13)]
sig = [(L + 0.06 + x, -1.30 + y, z + 0.006) for x, y in SIG]
bezier("signature", sig, bevel=0.0095, mat=sign_mat, parent=doc)
rule = rounded_rect("rule", 1.45, 0.008, 0.004, 0.004, muted, bevel=0.0)
rule.location = (L + 0.725, -1.36, z)
rule.parent = doc
text("Signed 16 Nov 2026  ·  Humans involved 0", 0.058, L, -1.47, z, muted, SANS, doc)

# seal: iridescent disc with a tick
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.33, depth=0.05)
seal = bpy.context.object
seal.data.materials.append(seal_mat)
bpy.ops.object.shade_smooth()
bev = seal.modifiers.new("bevel", "BEVEL")
bev.width, bev.segments = 0.014, 4
seal.location = (W / 2 - 0.5, -1.2, z + 0.02)
seal.parent = doc
white, _ = principled("white", **{"Base Color": lin("#FFFFFF"), "Roughness": 0.25})
tick_pts = [(-0.13, 0.0, 0), (-0.035, -0.1, 0), (0.15, 0.11, 0)]
tick_cu = bpy.data.curves.new("tick", "CURVE")
tick_cu.dimensions = "3D"
tick_cu.bevel_depth = 0.024
tick_cu.bevel_resolution = 5
tick_cu.use_fill_caps = True
tsp = tick_cu.splines.new("POLY")
tsp.points.add(2)
for p, co in zip(tsp.points, tick_pts):
    p.co = (*co, 1)
tick = link(bpy.data.objects.new("tick", tick_cu))
tick.data.materials.append(white)
tick.location = (W / 2 - 0.5, -1.2, z + 0.055)
tick.parent = doc

# stand the sheet up, turned a little towards the light
doc.rotation_euler = (math.radians(72), 0, math.radians(-17))
doc.location = (0.15, 0, 1.86)

# ---------- glass cards behind (second reference) ----------
for name, x, y, zc, rz, inner, outer in (
        ("cardA", -3.3, 2.6, 1.55, 24, "#8B7CF6", "#F2A7D8"),
        ("cardB", 3.6, 3.2, 1.7, -28, "#5FD4F0", "#B9D3F2")):
    card = rounded_rect(name, 1.7, 2.2, 0.14, 0.04, blob(name, inner, outer))
    card.rotation_euler = (math.radians(78), 0, math.radians(rz))
    card.location = (x, y, zc)

# ---------- the ribbon ----------
path = [(-9.5, 4.2, 0.5), (-6.4, 2.6, 1.25), (-3.9, 1.3, 0.55), (-2.3, -0.7, 0.3), (-0.4, -1.75, 0.34),
        (1.7, -1.6, 0.36), (3.3, -0.3, 0.75), (4.9, 1.5, 1.35), (7.0, 2.4, 0.6), (10.0, 4.4, 1.1)]
tilts = [0.3, 1.0, 1.9, 2.6, 3.0, 3.3, 2.5, 1.7, 2.6, 3.4]
ribbon = bezier("ribbon", path, tilts, extrude=0.46, mat=ribbon_mat)
sol = ribbon.modifiers.new("solid", "SOLIDIFY")
sol.thickness, sol.offset = 0.05, 0
sub = ribbon.modifiers.new("sub", "SUBSURF")
sub.levels = sub.render_levels = 2

thin_mat = iridescent("thin", stops=[(0.0, "#FFFFFF"), (0.4, "#CFE0F6"), (0.75, "#FFB38F"), (1.0, "#FFFFFF")], roughness=0.2)
path2 = [(-8.0, 5.0, 0.5), (-4.8, 3.6, 1.2), (-2.0, 2.8, 0.5), (1.0, 2.3, 0.9), (3.6, 2.4, 0.4), (7.5, 4.6, 1.0)]
thin = bezier("thin", path2, [1.4, 0.7, 1.5, 1.0, 1.6, 0.9], extrude=0.26, mat=thin_mat)
s2 = thin.modifiers.new("solid", "SOLIDIFY")
s2.thickness = 0.04
thin.modifiers.new("sub", "SUBSURF").render_levels = 2

for o in scene.objects:
    if o.type in {"CURVE", "FONT", "MESH"} and o.name not in {"Plane"}:
        try:
            for poly in getattr(o.data, "polygons", []):
                poly.use_smooth = True
        except Exception:
            pass

# ---------- light, world, camera ----------
def area(name, loc, size, energy, color):
    data = bpy.data.lights.new(name, "AREA")
    data.size, data.energy, data.color = size, energy, lin(color)[:3]
    obj = link(bpy.data.objects.new(name, data))
    obj.location = loc
    obj.rotation_euler = (Vector((0, 0, 1.3)) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return obj


area("key", (-5.5, -5.0, 8.0), 7, 330, "#FFF6EC")
area("fill", (6.5, -5.5, 4.5), 6, 170, "#DCE8FF")
area("rim", (1.5, 7.0, 6.0), 6, 260, "#FFD9EE")

world = bpy.data.worlds.new("world")
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = lin("#DCE8F7")
bg.inputs["Strength"].default_value = 0.6
# a soft sun keeps the far ground as pale as the near ground (no grey horizon)
sun_data = bpy.data.lights.new("sun", "SUN")
sun_data.energy, sun_data.angle = 0.7, math.radians(60)
sun = link(bpy.data.objects.new("sun", sun_data))
sun.rotation_euler = (math.radians(18), math.radians(-12), 0)
scene.world = world

cam_data = bpy.data.cameras.new("cam")
cam_data.lens = 58
cam_data.dof.use_dof = True
cam_data.dof.focus_distance = 13.4
cam_data.dof.aperture_fstop = 2.8
cam = link(bpy.data.objects.new("cam", cam_data))
cam.location = (2.3, -12.4, 5.4)
cam.rotation_euler = (Vector((0.15, 0, 1.6)) - cam.location).to_track_quat("-Z", "Y").to_euler()
scene.camera = cam

# ---------- render ----------
scene.render.engine = "CYCLES"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
except Exception as e:  # CPU is fine, just slower
    print("GPU not used:", e)
scene.render.resolution_x = WIDTH
scene.render.resolution_y = int(WIDTH * 10 / 16)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = OUT
for attr, val in (("view_transform", "Standard"), ("look", "None")):
    try:
        setattr(scene.view_settings, attr, val)
    except Exception:
        pass
bpy.ops.render.render(write_still=True)
print("RENDERED", OUT)
