# Conversão do modelo para TensorFlow.js

## 1. Exportar ONNX (após treino)

```bash
cd training/elastic-yolov8
python export_onnx.py
```

Arquivo gerado: `runs/elastic_seg/weights/best.onnx`

## 2. ONNX → TensorFlow SavedModel

Use `onnx-tf` + `tensorflow` para converter ONNX em SavedModel.

```bash
pip install onnx onnx-tf tensorflow
```

Crie um script `onnx_to_savedmodel.py`:

```python
import onnx
from onnx_tf.backend import prepare

onnx_model = onnx.load("runs/elastic_seg/weights/best.onnx")
tf_rep = prepare(onnx_model, device="CPU")
tf_rep.export_graph("saved_model_elastic")
```

Execute:

```bash
python onnx_to_savedmodel.py
```

## 3. SavedModel → TensorFlow.js

```bash
pip install tensorflowjs
tensorflowjs_converter --input_format=tf_saved_model \
  --output_format=tfjs_graph_model \
  saved_model_elastic \
  public/models/elastic-seg
```

Isso gera em `public/models/elastic-seg/`:

- `model.json`
- `group1-shard*`

## 4. Ajuste no frontend

O modelo YOLOv8-seg tem saída em formato de detecção (boxes + masks). O frontend atual espera uma saída de segmentação simples (uma máscara 256x256). Duas opções:

**A)** Pós-processar no frontend: usar a saída de máscaras do YOLO (protótipo de máscaras + coeficientes) e gerar a máscara final no canvas, depois recortar a região da boca e redimensionar para 256x256 para o recolor. Ou manter o modelo atual que espera entrada 256x256 e saída 256x256 (um único canal). Nesse caso o treino deve exportar um modelo que receba [1,256,256,3] e devolva [1,256,256,1].

**B)** Treinar um modelo de segmentação semântica (uma máscara por pixel) em vez de YOLOv8-seg. Por exemplo, um U-Net pequeno exportado para TF.js. O script de treino pode ser adaptado para um modelo que gere diretamente máscara 256x256.

Para o YOLOv8-seg convertido, a assinatura do modelo no TF.js pode diferir (múltiplas saídas). Ajuste `tfjsSegment.ts` para ler o tensor de máscara correto (geralmente a última saída ou a que contém os mask coefficients + proto).

## Comando único (resumo)

```bash
# Treino
python train.py

# ONNX
python export_onnx.py

# ONNX → SavedModel (requer script onnx_to_savedmodel.py)
python onnx_to_savedmodel.py

# TF.js
tensorflowjs_converter --input_format=tf_saved_model --output_format=tfjs_graph_model saved_model_elastic ../../public/models/elastic-seg
```

Depois coloque os arquivos gerados em `public/models/elastic-seg/` e recarregue o Simulador AR.
