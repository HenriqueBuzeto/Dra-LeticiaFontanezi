# Dataset – Borrachinhas (elastic)

## Estrutura

```
dataset/
  images/
    train/
      img001.jpg
      img002.jpg
      ...
    val/
      img101.jpg
      ...
  labels/
    train/
      img001.txt   # formato YOLO segmentation (uma linha por polígono)
      img002.txt
    val/
      img101.txt
```

## Formato YOLO Segmentation

Cada arquivo `.txt` em `labels/` tem o mesmo nome da imagem. Cada linha:

```
<class_id> <x1> <y1> <x2> <y2> ... <xn> <yn>
```

- `class_id`: 0 (classe única "elastic")
- Coordenadas normalizadas 0–1 (x,y) do polígono que contorna a borrachinha.

Exemplo (um polígono com 5 pontos para a classe 0):

```
0 0.45 0.52 0.48 0.51 0.50 0.55 0.47 0.56 0.45 0.52
```

## Anotação com CVAT

1. Crie projeto no CVAT, upload das imagens.
2. Crie tarefa com tipo **Segmentação** (polygon).
3. Anote cada borrachinha com polígono; atribua label "elastic".
4. Exporte: **Export dataset** → **YOLO 1.1** (ou formato que gere um `.txt` por imagem com polígono).
5. Se o export vier em outro layout, mova os `.txt` para `labels/train/` e `labels/val/` e ajuste o `class_id` para 0.

## Tamanho recomendado

- Mínimo 50 imagens para começar; 100–200 para resultado estável.
- Proporção train/val: 80/20.
- Diversifique: ângulos, iluminação, cores de borrachinha.
