# Estudo de identidade: Lastro Contabilidade

Site de demonstração da Mil e Uma Linhas! para um escritório contábil fictício que atende pequenas empresas. Tudo aqui (nome, pessoas, telefones, preços, depoimentos) é inventado.

## Nome e posicionamento

**Lastro Contabilidade e Consultoria Financeira**

Frase de posicionamento: "Contabilidade que você lê sem dicionário." A promessa é clareza: a dona de uma pequena empresa abre o site e entende, em números, o que vai pagar, quanto custa contratar e o que vence neste mês.

"Lastro" é aquilo que dá sustentação a um valor. É uma palavra do universo financeiro, curta, com sonoridade firme, e que não soa como nome de banco.

## Conceito visual: a folha de razão

A imagem mental é o livro razão (ledger): colunas, linhas finas, números alinhados à direita, carimbo de conferência. O site inteiro é tratado como uma folha de contabilidade bem diagramada: muita linha horizontal fina, quase nenhum cartão flutuante, nenhuma sombra decorativa. Os números são os protagonistas; o texto serve a eles.

Uma coisa memorável por tela: no hero, uma foto de um livro-caixa aberto sobre a mesa, com carimbo e calculadora, ao lado dos três números da empresa que contam até o valor final ao abrir a página (o único movimento orquestrado do site). Nas demais telas, o destaque é sempre um número grande em petróleo.

## Paleta

| Papel | Nome | Hex | Uso |
|---|---|---|---|
| Fundo | Papel | `#F5F4EF` | Fundo geral, tom de papel de boa gramatura, sem puxar para o creme amarelado |
| Fundo de apoio | Pauta | `#E9E7DF` | Faixas alternadas de tabela, fundos de campo, blocos secundários |
| Linha | Fio | `#CFCBBF` | Todas as linhas de tabela e separadores (1px) |
| Texto | Tinta | `#1B2420` | Texto, títulos, números. Preto esverdeado, nunca preto puro |
| Texto secundário | Grafite | `#5B655F` | Legendas, rótulos de tabela, notas |
| Destaque | Petróleo | `#0E5B55` | O número ou botão principal de cada tela. Um por tela |
| Apoio | Âmbar | `#B9770E` | Avisos "ilustrativo", prazos próximos, marcadores de atenção |
| Negativo | Ferrugem | `#A63B2A` | Somente valores negativos ou vencidos em tabela |

Regras de uso:
- Petróleo aparece uma vez por tela (um botão primário ou um número-resultado). Nunca em fundo de seção inteira, exceto no rodapé escuro.
- Âmbar nunca é botão. É sinalização.
- Ferrugem nunca é decorativa. Só aparece ao lado de número negativo ou prazo vencido.
- Nada de gradiente. Nada de sombra em cartão. A hierarquia vem de linha, espaço e peso tipográfico.
- Contraste medido (WCAG): Tinta sobre Papel 14,5:1; Grafite sobre Papel 5,5:1 e sobre Pauta 4,9:1; Petróleo sobre Papel 7,2:1; branco sobre Petróleo 7,9:1; Ferrugem sobre Papel 5,8:1. O Âmbar puro (`#B9770E`) dá 3,3:1 e por isso só aparece em texto grande e em negrito (o dia do prazo próximo, 20px bold) e na borda do aviso; em texto pequeno usamos a variante escura `#8A5700` (5,5:1).

## Tipografia

Duas famílias, ambas SIL Open Font License, servidas localmente em `fonts/`:

- **Archivo** (variável, eixo de peso 100 a 900): títulos, texto corrido, botões e rótulos. Grotesca de proporção ampla, com números tabulares disponíveis (`font-variant-numeric: tabular-nums`). Pesos usados: 400 (corpo), 500 (rótulos e botões), 700 (títulos). Nunca abaixo de 400 nem acima de 700.
- **IBM Plex Mono** (400, 500, 600): todo valor monetário, percentual e data em tabela. É a fonte "de máquina de calcular": alinhamento perfeito de colunas e leitura instantânea de que aquilo é um número apurado, não um texto.

Escala tipográfica (base 17px no computador, 16px no celular):

| Papel | Tamanho | Peso | Família |
|---|---|---|---|
| Título do hero | clamp(2,4rem, 6vw, 4,4rem), entrelinha 1,02 | 700 | Archivo |
| Título de seção (h2) | clamp(1,8rem, 3,2vw, 2,6rem), entrelinha 1,1 | 700 | Archivo |
| Subtítulo (h3) | 1,25rem | 700 | Archivo |
| Corpo | 1rem, entrelinha 1,55 | 400 | Archivo |
| Legenda e rótulo | 0,85rem | 500 | Archivo |
| Número-resultado | clamp(2,2rem, 5vw, 3,6rem) | 500 | IBM Plex Mono |
| Número em tabela | 0,95rem | 400/500 | IBM Plex Mono |

Regra de peso: títulos sempre 700, nunca itálico. Números grandes sempre em Plex Mono 500, nunca em negrito 700 (fica pesado). Nada em caixa alta além de siglas (CNPJ, DAS, FGTS).

## Layout

- Grade de 12 colunas, largura máxima de 1180px, margem lateral de 24px no celular e 48px no computador.
- Ritmo de espaçamento em múltiplos de 8px: 8, 16, 24, 40, 64, 104. Seções separadas por 104px no computador e 64px no celular.
- Alinhamento à esquerda em todo o texto. Números em tabela alinhados à direita. Nada centralizado, exceto o rodapé.
- Cada seção abre com uma linha fina de largura total (como a pauta do livro) e um título à esquerda com uma frase de uma linha dizendo o que é e o que fazer.
- Formulários e resultados lado a lado no computador (7 colunas de entrada, 5 de resultado) e empilhados no celular, com o resultado logo abaixo dos campos.

## Imagem forte do hero

O hero é uma **foto gerada por IA (Canva)**, ilustrativa: uma mesa de escritório vista de cima, em tom de papel, com um livro-caixa aberto (as colunas e os valores estão desfocados de propósito, para não haver número falso legível), uma xícara de café preto, uma calculadora, uma caneta esferográfica e um carimbo de madeira com a almofada de tinta em verde-escuro. O verde da almofada ecoa o Petróleo da paleta e o livro aberto é a folha de razão em versão real. Não há pessoas.

A moldura repete a da antiga folha de apuração: fio fino de 1 px na cor Fio, filete de 4 px em Tinta no topo e cantos de 3 px. O contêiner tem proporção fixa de 4:3 e mostra a cor média da foto enquanto ela carrega.

O painel desenhado em HTML e CSS ("Apuração do mês", com o carimbo "Conferido") foi retirado do hero. Os três números da abertura (empresas atendidas, fechamento médio e multas) continuam abaixo do texto e continuam contando até o valor final.

### Foto do hero

- **Arquivo**: `img/hero.webp`, 1440 x 1080 px, proporção 4:3.
- **Origem**: gerada por IA no Canva. O README e este estudo avisam que é ilustrativa.
- **Prompt resumido**: "Mesa de escritório de contabilidade vista de cima, superfície em tom de papel marfim. Livro-caixa grande aberto, com colunas e linhas de valores desfocadas, uma xícara de café preto, uma calculadora preta, uma caneta esferográfica preta com detalhe dourado, um carimbo de madeira e uma almofada de tinta verde-escura. Luz suave de janela com sombras listradas, muito espaço livre. Estilo editorial de site premium, sem texto legível, sem pessoas, proporção 4:3."
- **Texto alternativo**: descreve o livro-caixa, o café, a calculadora, a caneta, o carimbo e a almofada de tinta.
- **Texto do hero**: fica ao lado da foto no computador e abaixo dela no celular, nunca por cima. O contraste do texto é o da página (Tinta sobre Papel) e não depende da foto.

Ícones: nenhum pacote de ícones. Os poucos sinais gráficos (marcador de prazo, seta de ordenação) são SVG inline mínimos ou caracteres tipográficos.

## Movimento

- Um momento orquestrado: a contagem dos números do hero (312 empresas, 4 dias). A foto só ganha um fade de 800 ms.
- Respostas a ações: o resultado do simulador e da calculadora troca de valor com uma transição de opacidade de 180ms; as barras de comparação crescem em 400ms; os filtros do calendário escondem e mostram itens sem animação de altura.
- Tudo desligado sob `prefers-reduced-motion: reduce`.

## Clichês evitados de propósito

Sem creme com serifa e terracota, sem preto com verde ácido, sem cartões idênticos com a mesma sombra, sem rótulos em caixa alta acima de cada título, sem numeração 01/02/03, sem setas em links, sem gradientes. O azul corporativo foi trocado por petróleo escuro sobre papel, e a "cara de banco" foi trocada por "cara de folha de razão bem feita".
