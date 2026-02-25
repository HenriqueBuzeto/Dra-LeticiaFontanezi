# Assets para o Simulador de Aparelho (AR)

Para o simulador usar uma **foto realista de aparelho** (estilo filtro) em vez do desenho automático, coloque aqui imagens PNG. O sistema **posiciona as imagens na faixa dos dentes** (reconhecida pela câmera) e troca só a cor das borrachinhas.

## Opções de arquivos

**Opção A – Uma imagem só (recomendado para filtro tipo TikTok)**  
- **`braces.png`** — uma única PNG com as duas arcadas (superior e inferior). O sistema centraliza na boca e escala na região dos dentes. Ideal se você tiver um asset pronto de aparelho.

**Opção B – Duas imagens (mais controle)**  
- **`braces-upper.png`** — arcada **superior**.  
- **`braces-lower.png`** — arcada **inferior**.  

Cada uma é centralizada na faixa dos dentes (superior e inferior) e a cor das borrachinhas é trocada pela cor escolhida no app.

## Regras do PNG

1. **Fundo transparente** — tudo que não for aparelho deve ser transparente.
2. **Bráquetes e fio** — desenhe em tons de metal (prata/cinza) como na realidade.
3. **Borrachinhas (ligaduras)** — pintadas em **uma única cor-chave** para o sistema trocar só essa parte:
   - Cor-chave: **magenta** `#FE00FF` (RGB 254, 0, 255).
   - Todas as ligaduras devem ser exatamente essa cor no arquivo.
   - No simulador, apenas esses pixels são trocados pela cor escolhida; o resto do PNG (metal, fio) permanece igual.

## Posicionamento

- O AR usa os landmarks da boca (face-api.js 68 pontos) para calcular a **faixa dos dentes** (não os lábios).
- **Upper:** a imagem é desenhada com o **centro vertical** alinhado à linha dos dentes superiores.
- **Lower:** idem para os dentes inferiores.
- **braces.png:** a imagem é centralizada no centro da boca (entre as duas arcadas) e escalada pela largura da região dos dentes.

Assim o overlay fica **nos dentes**, com troca de cor das borrachinhas em tempo real.

## Resumo

- Fundo: transparente.  
- Metal (bráquetes + fio): cor normal (prata/cinza).  
- Borrachinhas: **#FE00FF** (magenta).  
- Coloque **`braces.png`** (uma imagem) ou **`braces-upper.png`** + **`braces-lower.png`** (duas imagens) nesta pasta.

## SVG vetorial (braces-orthodontic.svg)

Arquivo **`braces-orthodontic.svg`** — aparelho ortodôntico 100% vetorial, pronto para React/Next.js:

- **Estrutura**: `Aparelho` > `Upper` / `Lower` > `Wire-Upper`|`Wire-Lower` + `Bracket-1`…`Bracket-28` (cada um com `Metal-Base` + `Elastic-N`).
- **28 elásticos** nomeados `Elastic-1` a `Elastic-28` — vetores independentes, troca dinâmica de cor via código.
- **Frame**: 2400×800px, viewBox centralizado, fundo transparente.
- **Cores**: metal #C9C9C9, fio #B5B5B5, borrachinhas padrão #FF0000 (alterável).

### Uso no React (troca de cor das borrachinhas)

```tsx
// Carregar SVG e aplicar cor única em todas as ligaduras
const color = '#22C55E'; // ex: verde
useEffect(() => {
  for (let i = 1; i <= 28; i++) {
    document.getElementById(`Elastic-${i}`)?.setAttribute('fill', color);
  }
}, [color]);
```

Ou injetar o SVG como componente e usar `currentColor` nos `<ellipse id="Elastic-N">` com `fill="currentColor"` e definir `color` no elemento pai.

## Se não houver arquivos aqui

O simulador usa um desenho automático (metal + anel colorido ao redor de cada bráquete), com a mesma lógica: apenas a borrachinha muda de cor (padrão branco).
