# Lastro Contabilidade (demonstração)

Site estático de demonstração de um escritório contábil fictício para pequenas empresas, feito pela Mil e Uma Linhas!. Tudo é inventado: empresa, pessoas, telefones, preços, prazos e depoimentos. Desde 17/11/2026 a página é feita em React e chega aqui já compilada: `index.html` carrega o programa, o estilo e as fontes de `assets/` (arquivos compilados, não edite à mão). A fonte fica no repositório privado `mil-e-uma-linhas-conteudo`, em `vitrines-fonte/lastro-prado/`, e `node publicar.mjs` compila e copia para cá. As fotos e as máscaras das colinas ficam em `img/`, a página de erro em `404.html` e `404.css`, as licenças em `licencas/`, os testes em `tests/site.cjs` e os documentos de identidade e vistoria em `docs/`. Veja o `README.md`.

## Regras de trabalho

- Responda em português do Brasil, sem travessões, e chame o dono de Rodrigo Jr.
- Altere só o que foi pedido. Publicar ou fazer merge no `main` depende de pedido dele.
- Toda função criada ou alterada precisa funcionar também no celular. Teste a versão mobile, não só a de computador (`node tests/site.cjs` com o site servido na porta 8303).
- Ao criar ou alterar o site, explique como ele funciona.
- Ao terminar uma alteração, entregue a mensagem de commit em dois blocos rotulados: "Título" (até 50 caracteres) e "Descrição" (estendida, com exatamente o que foi feito).
- Entregue arquivos soltos, nunca em `.zip`.
- O repositório é público: não coloque senhas, chaves secretas nem dados pessoais em arquivos versionados.
- Sem CDN, sem fonte externa, sem analytics, sem script ou estilo inline: a Content-Security-Policy do `index.html` é restritiva e deve continuar assim.
- As colinas do topo usam WebGL. Todo efeito precisa ter versão parada: a página funciona inteira sem WebGL, no celular e com "reduzir movimento".
- O rodapé leva a assinatura M1L! | RTJ (`img/marca/`). Não redesenhe as duas marcas.
