"""
Treino de modelo YOLOv8-seg para detectar borrachinhas de aparelho ortodôntico.

Fluxo:
- Carrega o modelo base yolov8n-seg.pt (pré-treinado).
- Treina usando o dataset em dataset/data.yaml.
- Copia o melhor peso (best.pt) gerado pelo Ultralytics para model/best.pt.

Requisitos:
- Dataset já exportado do CVAT no formato YOLO 1.1 dentro de elastic-ai/dataset
  com subpastas images/train, images/val, labels/train, labels/val e data.yaml.
"""

import shutil
from pathlib import Path

from ultralytics import YOLO


def train(
    data_path: str = "dataset/data.yaml",
    base_model: str = "yolov8n-seg.pt",
    imgsz: int = 640,
    epochs: int = 50,
    device: str = "cpu",
) -> Path:
    """
    Treina o modelo YOLOv8-seg e salva o melhor checkpoint em model/best.pt.

    :param data_path: Caminho para o data.yaml do dataset.
    :param base_model: Caminho ou nome do modelo base YOLOv8-seg.
    :param imgsz: Tamanho da imagem de entrada (imgsz x imgsz).
    :param epochs: Número de épocas de treinamento.
    :param device: Dispositivo a ser usado, por exemplo "cpu" ou "cuda:0".
    :return: Caminho final para o modelo salvo em model/best.pt.
    """
    root = Path(__file__).resolve().parent
    dataset_yaml = root / data_path

    if not dataset_yaml.is_file():
        raise FileNotFoundError(
            f"data.yaml não encontrado em {dataset_yaml}. "
            "Verifique se o dataset está em elastic-ai/dataset."
        )

    project_dir = root / "runs"
    exp_name = "elastic-yolov8n-seg"

    model = YOLO(base_model)

    model.train(
        data=str(dataset_yaml),
        imgsz=imgsz,
        epochs=epochs,
        device=device,
        project=str(project_dir),
        name=exp_name,
        exist_ok=True,
        task="segment",
    )

    best_src = project_dir / "segment" / exp_name / "weights" / "best.pt"
    if not best_src.is_file():
        raise FileNotFoundError(
            f"best.pt não encontrado em {best_src}. "
            "Verifique os logs de treinamento para erros."
        )

    model_dir = root / "model"
    model_dir.mkdir(parents=True, exist_ok=True)
    best_dst = model_dir / "best.pt"

    shutil.copy2(best_src, best_dst)

    print(f"Modelo salvo em: {best_dst}")
    return best_dst


if __name__ == "__main__":
    train()

