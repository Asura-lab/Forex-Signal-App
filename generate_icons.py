"""
Generate Android mipmap icons from icon.png
Replaces existing .webp files with .png files
"""
from PIL import Image, ImageDraw
import os
import shutil

SRC = r"C:\Users\Acer\Desktop\Forex-Signal-App\mobile_app\assets\icon.png"
RES = r"C:\Users\Acer\Desktop\Forex-Signal-App\mobile_app\android\app\src\main\res"

# Regular icon sizes (ic_launcher, ic_launcher_round)
ICON_SIZES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

# Adaptive foreground sizes (ic_launcher_foreground)
FOREGROUND_SIZES = {
    "mipmap-mdpi":    108,
    "mipmap-hdpi":    162,
    "mipmap-xhdpi":   216,
    "mipmap-xxhdpi":  324,
    "mipmap-xxxhdpi": 432,
}

def make_circle(img, size):
    """Create circular icon with transparent background."""
    img = img.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size, size), fill=255)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(img, (0, 0), mask)
    return result

def make_square(img, size):
    """Resize to square."""
    return img.resize((size, size), Image.LANCZOS)

def make_foreground(img, canvas_size):
    """
    Create adaptive icon foreground: icon centered with 25% padding safe zone.
    Android adaptive icon foreground should use 72dp out of 108dp canvas.
    """
    icon_size = int(canvas_size * (72 / 108))
    padding = (canvas_size - icon_size) // 2
    icon = img.resize((icon_size, icon_size), Image.LANCZOS)
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.paste(icon, (padding, padding), icon if icon.mode == "RGBA" else None)
    return canvas

src_img = Image.open(SRC).convert("RGBA")

for folder, size in ICON_SIZES.items():
    folder_path = os.path.join(RES, folder)
    os.makedirs(folder_path, exist_ok=True)

    # Remove old webp files
    for old in ["ic_launcher.webp", "ic_launcher_round.webp", "ic_launcher_foreground.webp"]:
        old_path = os.path.join(folder_path, old)
        if os.path.exists(old_path):
            os.remove(old_path)
            print(f"  Removed: {old_path}")

    # ic_launcher (square)
    sq = make_square(src_img, size)
    sq.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
    print(f"  Created: {folder}/ic_launcher.png ({size}x{size})")

    # ic_launcher_round (circle)
    rnd = make_circle(src_img, size)
    rnd.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
    print(f"  Created: {folder}/ic_launcher_round.png ({size}x{size})")

for folder, size in FOREGROUND_SIZES.items():
    folder_path = os.path.join(RES, folder)
    fg = make_foreground(src_img, size)
    fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")
    print(f"  Created: {folder}/ic_launcher_foreground.png ({size}x{size})")

# Update adaptive icon XMLs to use PNG references (they already reference @mipmap/ic_launcher_foreground which will now be .png)
print("\nAll icons generated successfully!")
print(f"Source: {SRC}")
