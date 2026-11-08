/* Testes do site Lastro Contabilidade com Playwright.
   Como rodar (na raiz do projeto):
     python3 -m http.server 8303 &
     node tests/site.cjs
   Variáveis opcionais: PORTA (padrão 8303), CAPTURAS=1 para salvar imagens em docs/ e no scratchpad. */
const { chromium, devices } = require("playwright");
const path = require("path");
const fs = require("fs");

const PORTA = process.env.PORTA || "8303";
const BASE = `http://localhost:${PORTA}/`;
const CAPTURAS = process.env.CAPTURAS === "1";
const PASTA_DOCS = path.join(__dirname, "..", "docs");
const PASTA_SHOTS = process.env.PASTA_SHOTS || "";

const VIEWPORTS = [
  { nome: "desktop 1280x900", opcoes: { viewport: { width: 1280, height: 900 } } },
  { nome: "iPhone 13", opcoes: { ...devices["iPhone 13"] } },
  { nome: "320px", opcoes: { viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } }
];

let falhas = 0;
function limpo(t) { return String(t).replace(/\u00a0/g, " ").trim(); }
function ok(cond, msg) {
  if (cond) console.log("  ok   " + msg);
  else { falhas++; console.log("  FALHA " + msg); }
}

async function textoCortado(page) {
  /* Procura elementos de texto cujo conteúdo transborda a própria caixa horizontalmente. */
  return page.evaluate(() => {
    const seletores = "h1,h2,h3,p,li,td,th,label,legend,summary,button,a,dt,dd,span.preco,.resultado-numero";
    const problemas = [];
    document.querySelectorAll(seletores).forEach((el) => {
      if (el.closest("[hidden]") || el.offsetParent === null) return;
      const cs = getComputedStyle(el);
      if (cs.overflowX === "auto" || cs.overflowX === "scroll") return;
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== "hidden") {
        problemas.push(el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : "") + " \"" + (el.textContent || "").trim().slice(0, 40) + "\"");
      }
    });
    return problemas.slice(0, 10);
  });
}

async function testarViewport(browser, vp) {
  console.log("\n== " + vp.nome + " ==");
  const context = await browser.newContext({ ...vp.opcoes, locale: "pt-BR" });
  const page = await context.newPage();
  const erros = [];
  page.on("console", (m) => { if (m.type() === "error") erros.push(m.text()); });
  page.on("pageerror", (e) => erros.push(String(e)));
  page.on("requestfailed", (r) => erros.push("request failed: " + r.url()));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  ok(erros.length === 0, "sem erros de console" + (erros.length ? ": " + erros.join(" | ") : ""));

  const scroll = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(scroll.sw <= scroll.cw, `sem rolagem horizontal (scrollWidth ${scroll.sw} <= ${scroll.cw})`);

  const cortes = await textoCortado(page);
  ok(cortes.length === 0, "sem texto cortado" + (cortes.length ? ": " + cortes.join("; ") : ""));

  /* Fontes locais carregadas */
  const fontes = await page.evaluate(() => Promise.all([document.fonts.check("700 20px Archivo"), document.fonts.check("500 20px 'IBM Plex Mono'")]));
  ok(fontes[0] && fontes[1], "fontes Archivo e IBM Plex Mono carregadas");

  /* Abertura: os números do hero fecharam e o carimbo apareceu */
  const saldo = await page.textContent(".folha tfoot [data-conta]");
  ok(limpo(saldo) === "R$ 6.844,00", "contagem da abertura terminou em R$ 6.844,00 (obtido: " + saldo.trim() + ")");
  ok(await page.$eval(".folha", (el) => el.classList.contains("carimbado")), "carimbo 'Conferido' apareceu");

  /* Menu no celular */
  const menuVisivel = await page.isVisible(".menu-botao");
  if (menuVisivel) {
    await page.click(".menu-botao");
    ok(await page.isVisible("#menu a[href='#planos']"), "menu do celular abre");
    await page.click("#menu a[href='#planos']");
    ok(!(await page.isVisible("#menu a[href='#planos']")), "menu do celular fecha ao escolher uma seção");
  }

  /* Função 1: simulador de regime */
  await page.fill("#sim-faturamento", "40.000");
  await page.fill("#sim-folha", "8.000");
  await page.fill("#sim-custos", "18.000");
  await page.check("input[name=atividade][value=comercio]");
  await page.fill("#sim-local", "5");
  await page.waitForTimeout(250);
  const simplesComercio = await page.textContent("#sim-tabela tr[data-regime=simples] [data-valor]");
  /* RBT12 480k, anexo I, 3ª faixa: (480000*0,095 - 13860)/480000 = 6,6125% -> 2.645,00 */
  ok(limpo(simplesComercio) === "R$ 2.645,00", "simulador: Simples comércio 40 mil = R$ 2.645,00 (obtido: " + simplesComercio.trim() + ")");
  const melhor = await page.textContent("#sim-melhor-nome");
  ok(melhor.trim() === "Simples Nacional", "simulador: regime mais barato é o Simples (obtido: " + melhor.trim() + ")");

  await page.check("input[name=atividade][value=servicos]");
  await page.fill("#sim-folha", "4.000");
  await page.waitForTimeout(250);
  const anexo = await page.textContent("#sim-anexo");
  ok(/anexo V/.test(anexo), "simulador: serviços com Fator R 10% cai no anexo V (obtido: " + anexo.trim() + ")");
  await page.fill("#sim-folha", "12.000");
  await page.waitForTimeout(250);
  ok(/anexo III/.test(await page.textContent("#sim-anexo")), "simulador: serviços com Fator R 30% cai no anexo III");

  await page.fill("#sim-faturamento", "500.000");
  await page.waitForTimeout(250);
  ok(/não se enquadra/.test(await page.textContent("#sim-tabela tr[data-regime=simples] [data-valor]")), "simulador: receita acima de 4,8 mi/ano sai do Simples");

  await page.fill("#sim-faturamento", "abc");
  await page.waitForTimeout(250);
  ok(await page.isVisible("#sim-erro"), "simulador: entrada inválida mostra erro");
  await page.fill("#sim-faturamento", "40.000");
  await page.fill("#sim-folha", "8.000");
  await page.check("input[name=atividade][value=comercio]");
  await page.waitForTimeout(250);
  ok(!(await page.isVisible("#sim-erro")), "simulador: erro some ao corrigir");

  /* Função 2: custo de funcionário */
  await page.fill("#custo-salario", "2.500");
  await page.check("input[name=regime][value=simples]");
  await page.fill("#custo-vt", "220");
  await page.fill("#custo-vr", "600");
  await page.fill("#custo-saude", "0");
  await page.waitForTimeout(250);
  /* 2500 + 208,33 + 277,78 = 2986,11; FGTS 238,89; VT 220-150=70; VR 600 => 3.895,00 */
  const custo = await page.textContent("#custo-total-tabela");
  ok(limpo(custo) === "R$ 3.895,00", "calculadora: salário 2.500 no Simples custa R$ 3.895,00 (obtido: " + custo.trim() + ")");
  await page.check("input[name=regime][value=outros]");
  await page.waitForTimeout(250);
  /* + 27,8% de 2986,11 = 830,14 => 4.725,14 */
  const custo2 = await page.textContent("#custo-total-tabela");
  ok(limpo(custo2) === "R$ 4.725,14", "calculadora: fora do Simples custa R$ 4.725,14 (obtido: " + custo2.trim() + ")");

  /* Função 3: calendário com filtros */
  const total = await page.$$eval("#agenda li:not([hidden])", (l) => l.length);
  ok(total === 13, "calendário: 13 obrigações visíveis sem filtro (obtido: " + total + ")");
  await page.check("input[name=f-regime][value=mei]");
  await page.waitForTimeout(100);
  const mei = await page.$$eval("#agenda li:not([hidden])", (l) => l.length);
  ok(mei === 2, "calendário: filtro MEI mostra 2 (obtido: " + mei + ")");
  await page.uncheck("input[name=f-tipo][value=imposto]");
  await page.uncheck("input[name=f-tipo][value=folha]");
  await page.waitForTimeout(100);
  ok(await page.isVisible("#agenda-vazia"), "calendário: mensagem de lista vazia aparece");
  await page.check("input[name=f-tipo][value=imposto]");
  await page.check("input[name=f-tipo][value=folha]");
  await page.check("input[name=f-regime][value=todos]");

  /* Função 4: planos mensal e anual */
  await page.click(".alternador-botao[data-periodo=anual]");
  await page.waitForTimeout(300);
  const precoAnual = await page.textContent(".plano-destaque .preco");
  ok(limpo(precoAnual) === "R$ 374", "planos: anual mostra R$ 374 no plano Rotina (obtido: " + precoAnual.trim() + ")");
  await page.click(".alternador-botao[data-periodo=mensal]");
  await page.waitForTimeout(300);
  ok(limpo(await page.textContent(".plano-destaque .preco")) === "R$ 449", "planos: volta para R$ 449 no mensal");

  /* Contato: valida sem enviar */
  let requisicoes = 0;
  page.on("request", (r) => { if (!r.url().startsWith(BASE)) requisicoes++; });
  await page.click("#contato-form button[type=submit]");
  ok(await page.isVisible("#ct-erro"), "contato: formulário vazio mostra erro");
  await page.fill("#ct-nome", "Teste da Silva");
  await page.fill("#ct-email", "teste@exemplo.com");
  await page.selectOption("#ct-assunto", { index: 1 });
  await page.fill("#ct-mensagem", "Quero abrir uma empresa de serviços.");
  await page.click("#contato-form button[type=submit]");
  await page.waitForTimeout(200);
  ok(await page.isVisible("#ct-resumo"), "contato: resumo aparece na tela");
  ok(requisicoes === 0, "contato: nenhuma requisição externa");

  /* Teclado: tab chega no botão do hero */
  await page.keyboard.press("Tab");
  const focado = await page.evaluate(() => document.activeElement && document.activeElement !== document.body ? document.activeElement.tagName.toLowerCase() + "#" + document.activeElement.id : "");
  ok(focado !== "", "navegação por teclado funciona (foco em " + focado + ")");

  ok(erros.length === 0, "sem erros de console depois de usar as funções" + (erros.length ? ": " + erros.join(" | ") : ""));

  const scroll2 = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(scroll2.sw <= scroll2.cw, "sem rolagem horizontal depois de usar as funções");

  if (CAPTURAS) {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(300);
    const sufixo = vp.nome.startsWith("desktop") ? "desktop" : vp.nome === "iPhone 13" ? "celular" : "320";
    if (sufixo !== "320") {
      await page.screenshot({ path: path.join(PASTA_DOCS, `capa-${sufixo}.png`) });
      if (sufixo === "desktop") {
        await page.evaluate(() => { document.querySelector(".topo").style.position = "static"; });
        for (const [id, nome] of [["simulador", "simulador"], ["custo", "custo-funcionario"], ["prazos", "calendario"], ["planos", "planos"]]) {
          const el = await page.$("#" + id);
          await el.scrollIntoViewIfNeeded();
          await page.waitForTimeout(400);
          await el.screenshot({ path: path.join(PASTA_DOCS, `funcao-${nome}.png`) });
        }
      }
    }
  }

  await context.close();
}

(async () => {
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) await testarViewport(browser, vp);

  if (CAPTURAS && PASTA_SHOTS) {
    fs.mkdirSync(PASTA_SHOTS, { recursive: true });
    const c1 = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "pt-BR" });
    const p1 = await c1.newPage();
    await p1.goto(BASE, { waitUntil: "networkidle" });
    await p1.waitForTimeout(1600);
    await p1.screenshot({ path: path.join(PASTA_SHOTS, "contabilidade-desk.png") });
    await c1.close();
    const c2 = await browser.newContext({ ...devices["iPhone 13"], locale: "pt-BR" });
    const p2 = await c2.newPage();
    await p2.goto(BASE, { waitUntil: "networkidle" });
    await p2.waitForTimeout(1600);
    await p2.screenshot({ path: path.join(PASTA_SHOTS, "contabilidade-cel.png") });
    await c2.close();
  }

  await browser.close();
  console.log("\n" + (falhas === 0 ? "Todos os testes passaram." : falhas + " falha(s)."));
  process.exit(falhas === 0 ? 0 : 1);
})();
