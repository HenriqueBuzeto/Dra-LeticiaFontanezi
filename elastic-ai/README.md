# Elastic AI – Detecção de Borrachinhas com YOLOv8-seg

Estrutura mínima para treinar e servir um modelo YOLOv8-seg que segmenta **borrachinhas de aparelho ortodôntico** (classe `elastic`).

## Estrutura de pastas

```
elastic-ai/
├── dataset/           # já existente (export do CVAT em YOLO 1.1)
│   ├── images/train
│   ├── images/val
│   ├── labels/train
│   ├── labels/val
│   └── data.yaml      # deve referenciar a classe 'elastic'
├── model/
│   └── best.pt        # criado após o treino (copiado automaticamente)
├── train.py           # script de treino YOLOv8-seg
├── app.py             # API FastAPI (POST /predict)
├── requirements.txt   # dependências Python
└── README.md
```

## 1. Instalar dependências

Crie e ative um ambiente virtual (opcional, mas recomendado) e instale os pacotes:

```bash
cd elastic-ai
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt
```

> Observação: o pacote `ultralytics` instalará automaticamente as dependências do YOLOv8 (como PyTorch). Isso pode demorar alguns minutos na primeira vez.

## 2. Preparar o dataset

Certifique-se de que o dataset exportado do CVAT esteja em `elastic-ai/dataset` com a seguinte estrutura:

- `images/train`, `images/val`
- `labels/train`, `labels/val`
- `data.yaml` apontando para as imagens e com a classe `elastic`.

Exemplo mínimo de `data.yaml`:

```yaml
path: .
train: images/train
val: images/val
names:
  0: elastic
```

## 3. Treinar o modelo

O script `train.py`:

- Carrega `yolov8n-seg.pt` como modelo base.
- Usa `dataset/data.yaml`.
- Treina com `imgsz=640`, `epochs=50`, `device='cpu'` (padrão).
- Copia o melhor modelo para `model/best.pt`.

Para treinar:

```bash
cd elastic-ai
python train.py
```

Se quiser alterar algum parâmetro, edite a função `train()` em `train.py` ou chame-a programaticamente.

## 4. Rodar a API FastAPI

Depois que `model/best.pt` existir:

```bash
cd elastic-ai
uvicorn app:app --host 0.0.0.0 --port 8000
```

Ou simplesmente:

```bash
python app.py
```

Endpoints:

- `GET /health` – checagem simples de status.
- `POST /predict` – recebe uma imagem base64 e retorna a máscara binária das borrachinhas em PNG base64.

### Configurar dispositivo

Por padrão, a inferência roda em **CPU**.  
Você pode alterar o dispositivo definindo a variável de ambiente `ELASTIC_DEVICE`:

```bash
export ELASTIC_DEVICE="cpu"         # ou "cuda:0" se tiver GPU e drivers corretos
python app.py
```

## 5. Exemplo de requisição `curl`

Supondo que você tenha uma imagem `imagem_teste.png`:

```bash
BASE64_IMAGE=$(python - << 'PY'
import base64
from pathlib import Path

img_path = Path("imagem_teste.png")
data = base64.b64encode(img_path.read_bytes()).decode("utf-8")
print(data)
PY
)

curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"${BASE64_IMAGE}\"}"
```

Resposta esperada (exemplo simplificado):

```json
{
  "mask": "iVBORw0KGgoAAAANSUhEUgAA...",  // PNG base64 da máscara binária
  "detail": "ok"
}
```

Se nenhuma borrachinha for detectada, o campo `mask` será `null` e `detail` trará uma mensagem adequada.

## Limpeza (opcional)

Após o treino, o modelo em uso é `model/best.pt`. A pasta `runs/` contém apenas artefatos do Ultralytics (logs, checkpoints antigos). Para liberar espaço, você pode apagá-la: `runs/` está no `.gitignore` e será recriada no próximo treino.

