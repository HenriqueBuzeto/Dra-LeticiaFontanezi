# AR Elastic – Troca de cor de borrachinhas

## Como rodar (passo a passo)

1. **Instalar dependências do projeto**  
   Na raiz: `npm install`. Já inclui `@tensorflow/tfjs` e `@mediapipe/face_mesh`.

2. **MediaPipe (face bbox)**  
   O app tenta carregar de `/mediapipe` (local) ou CDN. Para uso offline:  
   `npm run download:mediapipe` e coloque os arquivos em `public/mediapipe/`.

3. **Subir o app**  
   `npm run dev`. Abra o menu e clique em **Simulador AR** (rota `/ar-simulator`).

4. **Na página**  
   - Clique em **Iniciar câmera**.  
   - Permita o uso da câmera.  
   - Posicione o rosto; a região da boca é detectada e a recolor é aplicada (fallback por saturação se não houver modelo).  
   - Escolha a cor no seletor.  
   - Se a detecção falhar, marque **Modo ajuste manual**, arraste o centro e o ponto de tamanho da elipse e clique em **Salvar posição**.

5. **Modelo TF.js (opcional)**  
   Se você treinou e converteu o modelo (ver `training/elastic-yolov8/`), coloque em `public/models/elastic-seg/` os arquivos `model.json` e `group*-shard*`. O app carrega de `/models/elastic-seg` e usa a inferência em vez do fallback por saturação.

## Estrutura

- `faceMouthRoi.ts` – ROI da boca a partir dos landmarks (MediaPipe).  
- `recolor.ts` – Recolor por máscara (blend overlay/multiply).  
- `segmentation/` – Carregamento e inferência TF.js; máscara manual.  
- `hooks/useElasticAR.ts` – Hook principal (câmera, loop, recolor).  
- `components/` – Seletor de cor e overlay (vídeo + canvas + manual).

## Treino e conversão

Ver pasta `training/elastic-yolov8/`:

- `dataset/README.md` – Estrutura do dataset e anotação (CVAT, formato YOLO).  
- `train.py` – Treino YOLOv8-seg.  
- `export_onnx.py` – Exportação para ONNX.  
- `CONVERSAO_TFJS.md` – ONNX → SavedModel → TF.js e onde colocar no projeto.

Comandos rápidos:

```bash
cd training/elastic-yolov8
pip install -r requirements.txt
python train.py
python export_onnx.py
# Depois seguir CONVERSAO_TFJS.md para TF.js e copiar para public/models/elastic-seg/
```
