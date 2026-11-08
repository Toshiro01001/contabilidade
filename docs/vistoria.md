# Vistoria de segurança: Lastro Contabilidade (demonstração)

Data: 2026-11-08. Site estático publicado no GitHub Pages, sem servidor próprio.

## Content-Security-Policy

Declarada por `<meta http-equiv="Content-Security-Policy">` no `index.html`:

`default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`

- Nenhum script inline, nenhum `onclick`, nenhum `style=""` no HTML. Os valores dinâmicos (largura das barras do simulador) são aplicados por `element.style.setProperty`, que a CSP permite.
- `connect-src 'none'`: nenhum `fetch`, `XMLHttpRequest` ou WebSocket pode sair da página.
- `form-action 'none'`: nenhum formulário consegue ser enviado a lugar nenhum, mesmo que o JavaScript falhe.
- `frame-ancestors` não entra na meta porque o navegador ignora essa diretiva fora do cabeçalho HTTP; o GitHub Pages não permite configurar cabeçalhos.
- O `404.html` tem a mesma política com `script-src 'none'`.

## Envio de dados

Nenhum. O único link externo é https://mileumalinhas.com.br, com `rel="noopener"`. O formulário de contato valida no navegador e mostra o resumo na própria tela; o teste automatizado confirma que nenhuma requisição para fora do próprio endereço acontece durante o uso das funções.

## Armazenamento no navegador

Nenhum. O site não usa `localStorage`, `sessionStorage`, cookies nem IndexedDB. Fechar a aba apaga tudo.

## Dependências

Nenhuma em tempo de execução. Fontes Archivo e IBM Plex Mono servidas localmente (licença SIL OFL, arquivos de licença em `fonts/`). O Playwright é usado apenas nos testes, fora do site.

## Dados pessoais e segredos

Nenhum dado real. Nomes, CRC, endereço, telefone, depoimentos e preços são fictícios e estão marcados como tal na faixa do topo, no rodapé e nas próprias seções. Não há chaves, tokens ou senhas no repositório.

## Riscos residuais

- A CSP por meta protege menos que por cabeçalho HTTP (por exemplo, não cobre `frame-ancestors`). Risco baixo: o site não tem sessão nem dados para serem roubados por clickjacking.
- O simulador e a calculadora são ilustrativos. O risco não é técnico, mas de interpretação: alguém decidir regime tributário com base neles. O aviso em âmbar, a memória de cálculo e a nota de rodapé reduzem esse risco; o texto deixa claro que a conta de verdade é feita com documentos.
- `innerHTML` é usado em `app.js` apenas com texto gerado pelo próprio script a partir de números e tabelas fixas, nunca com texto digitado pelo visitante. O resumo do formulário de contato usa `textContent`.
