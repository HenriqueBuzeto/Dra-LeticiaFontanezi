"""
API FastAPI para servir o modelo YOLOv8-seg treinado para detectar borrachinhas.

Endpoint principal:
- POST /predict
  - Corpo JSON: {"image": "<base64_png_or_jpeg>"}
  - Retorno: {"mask": "<base64_png>", "detail": "ok"} com a máscara binária das borrachinhas.
"""

import base64
import io
import os
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ultralytics import YOLO
from PIL import Image


ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "model" / "best.pt"


class PredictRequest(BaseModel):
    image: str  # imagem em base64 (PNG ou JPEG)


class PredictResponse(BaseModel):
    mask: Optional[str]
    detail: str


def load_model() -> YOLO:
    if not MODEL_PATH.is_file():
        raise RuntimeError(
            f"Modelo não encontrado em {MODEL_PATH}. "
            "Treine primeiro executando: python train.py"
        )

    device = os.getenv("ELASTIC_DEVICE", "cpu")
    model = YOLO(str(MODEL_PATH))
    print(f"Modelo carregado de {MODEL_PATH} (device={device})")
    return model


app = FastAPI(title="Elastic AR – YOLOv8-seg API")
model = load_model()


def _decode_base64_image(data: str) -> np.ndarray:
    """Decodifica string base64 para array numpy (RGB)."""
    try:
        # Remove prefixo "data:image/xxx;base64," se existir.
        if "," in data:
            data = data.split(",", 1)[1]
        img_bytes = base64.b64decode(data)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Base64 inválido: {exc}") from exc

    try:
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"Imagem inválida: {exc}") from exc

    return np.array(image)


def _encode_mask_to_base64(mask: np.ndarray) -> str:
    """
    Converte máscara binária (0/255) em PNG base64.
    """
    if mask.dtype != np.uint8:
        mask = mask.astype(np.uint8)

    # Garante valores 0 ou 255.
    mask = np.where(mask > 0, 255, 0).astype(np.uint8)

    success, buf = cv2.imencode(".png", mask)
    if not success:
        raise RuntimeError("Falha ao codificar máscara em PNG.")

    b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
    return b64


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    """
    Recebe imagem em base64 e retorna máscara binária (PNG base64)
    das borrachinhas detectadas.
    """
    if not req.image:
        raise HTTPException(status_code=400, detail="Campo 'image' obrigatório.")

    img = _decode_base64_image(req.image)

    device = os.getenv("ELASTIC_DEVICE", "cpu")
    try:
        results = model.predict(
            source=img,
            imgsz=640,
            device=device,
            verbose=False,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Erro na inferência: {exc}") from exc

    if not results:
        return PredictResponse(mask=None, detail="nenhum resultado retornado")

    r = results[0]
    if r.masks is None or r.masks.data is None:
        return PredictResponse(mask=None, detail="nenhuma máscara detectada")

    masks_tensor = r.masks.data
    if masks_tensor.numel() == 0:
        return PredictResponse(mask=None, detail="nenhuma máscara detectada")

    masks_np = masks_tensor.cpu().numpy()
    combined = np.any(masks_np > 0.5, axis=0).astype(np.uint8) * 255  # [H, W] com 0/255

    mask_b64 = _encode_mask_to_base64(combined)
    return PredictResponse(mask=mask_b64, detail="ok")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=False,
    )

