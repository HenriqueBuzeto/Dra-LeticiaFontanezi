#!/usr/bin/env python3
"""
Exporta o melhor peso YOLOv8-seg para ONNX (para conversão TF.js).
Uso: python export_onnx.py
Gera: runs/elastic_seg/weights/best.onnx
"""

from pathlib import Path
from ultralytics import YOLO

def main():
    root = Path(__file__).resolve().parent
    best_pt = root / "runs" / "elastic_seg" / "weights" / "best.pt"
    if not best_pt.exists():
        print("Rode train.py antes. Esperado:", best_pt)
        return
    model = YOLO(str(best_pt))
    model.export(format="onnx", imgsz=256, simplify=True, dynamic=False)
    print("ONNX salvo em:", best_pt.with_suffix(".onnx"))

if __name__ == "__main__":
    main()
