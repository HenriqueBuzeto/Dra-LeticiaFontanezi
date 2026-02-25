# Modelos para Simulador AR (face-api.js)

O simulador AR de borrachinhas usa **face-api.js** para detectar o rosto e a boca em tempo real.

## Uso padrão (CDN)

**Não é necessário baixar nada.** Por padrão, os modelos são carregados do CDN (jsDelivr). Basta ter conexão com a internet ao abrir o Simulador AR.

## Uso com arquivos locais (opcional)

Se o CDN estiver bloqueado ou quiser usar offline, coloque os pesos nesta pasta. O simulador tenta **primeiro** carregar de `/models` (esta pasta) e depois do CDN.

**Opção 1 – Baixar pelo script (recomendado):**

```bash
npm run download:face-api-models
```

**Opção 2 – Download manual:** Coloque os arquivos nesta pasta (`public/models/`). Eles estão no repositório **face-api.js** (pasta `weights`), por exemplo:
   - [tiny_face_detector_model](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
   - [face_landmark_68_model](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)

Arquivos necessários:

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`

Ou use o CDN como base para baixar (mesma estrutura):

```
https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights/
```

Depois de colocar os arquivos aqui, recarregue a página do Simulador AR (o app tenta `/models` primeiro).
