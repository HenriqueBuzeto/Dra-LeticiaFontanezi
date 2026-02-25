#!/usr/bin/env python3
"""
Treino YOLOv8-seg para classe única "elastic" (borrachinhas).
Uso: python train.py
Requer: ultralytics, dataset em dataset/images e dataset/labels.
"""

from pathlib import Path
from ultralytics import YOLO

def main():
    root = Path(__file__).resolve().parent
    data_yaml = root / "data.yaml"
    if not data_yaml.exists():
        raise FileNotFoundError("Crie data.yaml (e dataset) antes de treinar.")

    model = YOLO("yolov8n-seg.pt")  # nano; use yolov8s-seg.pt para small
    model.train(
        data=str(data_yaml),
        epochs=100,
        imgsz=256,
        batch=16,
        device=0,
        project=str(root / "runs"),
        name="elastic_seg",
        exist_ok=True,
        pretrained=True,
        optimizer="auto",
        patience=15,
        save=True,
        plots=True,
    )
    print("Treino concluído. Modelo em runs/elastic_seg/weights/best.pt")

if __name__ == "__main__":
    main()
