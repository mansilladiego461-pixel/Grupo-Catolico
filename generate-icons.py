from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, path):
    img = Image.new('RGB', (size, size), color='#f5c800')
    draw = ImageDraw.Draw(img)
    
    # Draw cross
    cx, cy = size // 2, size // 2
    w = size // 10
    h_len = int(size * 0.55)
    v_len = int(size * 0.65)
    
    # Vertical bar
    draw.rectangle([cx - w, cy - v_len//2, cx + w, cy + v_len//2], fill='#3a2800')
    # Horizontal bar
    draw.rectangle([cx - h_len//2, cy - w - int(size*0.05), cx + h_len//2, cy + w - int(size*0.05)], fill='#3a2800')
    
    img.save(path)
    print(f"Created {path}")

os.makedirs('/home/claude/grupo-catolico/public', exist_ok=True)
create_icon(192, '/home/claude/grupo-catolico/public/icon-192.png')
create_icon(512, '/home/claude/grupo-catolico/public/icon-512.png')
