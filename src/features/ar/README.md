# Feature: Simulador AR – Cor das borrachinhas

Esta pasta concentra tudo do **Simulador AR**: o cliente vê a câmera e escolhe a **cor das borrachinhas** na tela; a IA (face-api.js) detecta a boca e aplica apenas essa cor na região dos dentes em tempo real.

## O que a face-api.js faz

- **Não gera aparelho do zero:** desenha um overlay (arcos + círculos) na região da boca.
- **Troca a cor das borrachinhas:** o cliente escolhe uma cor na tela e o overlay é desenhado nessa cor, acompanhando o movimento da boca.

Ou seja: **só a cor da borrachinha é alterada**, com as opções exibidas na própria tela para o cliente ir trocando.

## Como desativar o AR

1. Abra `config.ts` nesta pasta.
2. Altere `ENABLE_AR_SIMULATOR` para `false`.
3. A rota `/ar-simulator` e os links no menu (header, footer, bottom nav) deixam de aparecer. O código do AR não é carregado quando a feature está desligada.

## Modelos (face-api.js)

Por padrão os modelos são carregados do CDN (jsDelivr); não é necessário baixar nada. Para usar arquivos locais (ex.: offline), veja `public/models/README.md`.

## Arquivos

- `config.ts` – flag e constantes da rota/menu
- `arBraces.ts` – carrega modelos, detecta face/boca e desenha o overlay
- `constants.ts` – cores das borrachinhas exibidas na tela
- `ARSimulatorPage.tsx` – página com câmera, paleta de cores e botão de salvar foto
- `index.ts` – exportações usadas pelo router
