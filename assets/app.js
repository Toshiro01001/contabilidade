/* Lastro Contabilidade: script único.
   Tudo roda no navegador. Nenhum dado sai desta página e nada é guardado. */
(function () {
  "use strict";

  var reduzMovimento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var fmtMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
  var fmtInteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var fmtPct = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

  function moeda(v) { return fmtMoeda.format(Math.round(v * 100) / 100); }
  function pct(v) { return fmtPct.format(v); }
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }

  /* Lê um número digitado no padrão brasileiro ("40.000", "1.250,50", "900,5"). */
  function lerNumero(texto) {
    if (typeof texto !== "string") return NaN;
    var t = texto.replace(/[R$\s]/g, "");
    if (t === "") return NaN;
    var temVirgula = t.indexOf(",") >= 0;
    var temPonto = t.indexOf(".") >= 0;
    if (temVirgula) {
      t = t.replace(/\./g, "").replace(",", ".");
    } else if (temPonto && !/^\d{1,3}(\.\d{3})+$/.test(t)) {
      /* um ponto só, fora do padrão de milhar: trata como decimal */
    } else if (temPonto) {
      t = t.replace(/\./g, "");
    }
    var n = Number(t);
    return isFinite(n) ? n : NaN;
  }

  function formatarCampo(input) {
    var n = lerNumero(input.value);
    if (isNaN(n)) return;
    input.value = (n % 1 === 0) ? fmtInteiro.format(n) : new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  }

  function trocarTexto(el, texto, html) {
    if (!el) return;
    if (reduzMovimento) { if (html) el.innerHTML = texto; else el.textContent = texto; return; }
    el.classList.add("trocando");
    window.setTimeout(function () {
      if (html) el.innerHTML = texto; else el.textContent = texto;
      el.classList.remove("trocando");
    }, 90);
  }

  /* ---------- Menu no celular ---------- */
  (function menu() {
    var botao = $(".menu-botao");
    var nav = $("#menu");
    if (!botao || !nav) return;
    botao.addEventListener("click", function () {
      var aberto = nav.classList.toggle("aberto");
      botao.setAttribute("aria-expanded", aberto ? "true" : "false");
      $(".menu-botao-texto", botao).textContent = aberto ? "Fechar" : "Menu";
    });
    $$("a", nav).forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("aberto");
        botao.setAttribute("aria-expanded", "false");
        $(".menu-botao-texto", botao).textContent = "Menu";
      });
    });
  })();

  /* ---------- Abertura: os números da folha "fecham" ---------- */
  (function abertura() {
    var folha = $(".folha");
    var alvos = $$("[data-conta]");
    if (!folha || !alvos.length) return;
    if (reduzMovimento) { folha.classList.add("carimbado"); return; }

    folha.classList.add("animando");
    var duracao = 1200;
    var inicio = null;

    function desenhar(ts) {
      if (inicio === null) inicio = ts;
      var p = Math.min(1, (ts - inicio) / duracao);
      var e = 1 - Math.pow(1 - p, 3);
      alvos.forEach(function (el) {
        var alvo = Number(el.getAttribute("data-conta"));
        var atual = alvo * e;
        if (el.hasAttribute("data-moeda")) {
          el.textContent = moeda(p === 1 ? alvo : atual);
        } else {
          el.textContent = fmtInteiro.format(Math.round(atual)) + (el.getAttribute("data-sufixo") || "");
        }
      });
      if (p < 1) {
        window.requestAnimationFrame(desenhar);
      } else {
        folha.classList.remove("animando");
        folha.classList.add("carimbado");
      }
    }
    window.requestAnimationFrame(desenhar);
  })();

  /* ---------- Simulador de regime tributário ---------- */
  var ANEXOS = {
    I:   [[180000, 0.04, 0], [360000, 0.073, 5940], [720000, 0.095, 13860], [1800000, 0.107, 22500], [3600000, 0.143, 87300], [4800000, 0.19, 378000]],
    II:  [[180000, 0.045, 0], [360000, 0.078, 5940], [720000, 0.10, 13860], [1800000, 0.112, 22500], [3600000, 0.147, 85500], [4800000, 0.30, 720000]],
    III: [[180000, 0.06, 0], [360000, 0.112, 9360], [720000, 0.135, 17640], [1800000, 0.16, 35640], [3600000, 0.21, 125640], [4800000, 0.33, 648000]],
    V:   [[180000, 0.155, 0], [360000, 0.18, 4500], [720000, 0.195, 9900], [1800000, 0.205, 17100], [3600000, 0.23, 62100], [4800000, 0.305, 540000]]
  };
  var LIMITE_SIMPLES = 4800000;
  var PATRONAL = 0.278; /* INSS 20% + RAT 2% + terceiros 5,8% */

  function faixa(anexo, rbt12) {
    var tabela = ANEXOS[anexo];
    for (var i = 0; i < tabela.length; i++) {
      if (rbt12 <= tabela[i][0]) return { indice: i + 1, aliquota: tabela[i][1], deducao: tabela[i][2] };
    }
    return null;
  }

  function irpjMensal(base) {
    if (base <= 0) return { irpj: 0, adicional: 0 };
    return { irpj: base * 0.15, adicional: Math.max(0, base - 20000) * 0.10 };
  }

  function simular(d) {
    var rbt12 = d.fat * 12;
    var r = { simples: null, presumido: null, real: null };

    /* Simples Nacional */
    var anexo = d.atividade === "comercio" ? "I" : d.atividade === "industria" ? "II" : null;
    var fatorR = null;
    if (d.atividade === "servicos") {
      fatorR = d.fat > 0 ? d.folha / d.fat : 0;
      anexo = fatorR >= 0.28 ? "III" : "V";
    }
    if (rbt12 > LIMITE_SIMPLES) {
      r.simples = { elegivel: false, anexo: anexo, total: null, motivo: "Receita anual acima de " + moeda(LIMITE_SIMPLES) + ": a empresa não pode optar pelo Simples." };
    } else {
      var f = faixa(anexo, rbt12);
      var efetiva = rbt12 > 0 ? (rbt12 * f.aliquota - f.deducao) / rbt12 : f.aliquota;
      var das = d.fat * efetiva;
      r.simples = { elegivel: true, anexo: anexo, faixa: f.indice, nominal: f.aliquota, deducao: f.deducao, efetiva: efetiva, fatorR: fatorR, das: das, total: das };
    }

    /* Lucro Presumido */
    var presIR = d.atividade === "servicos" ? 0.32 : 0.08;
    var presCS = d.atividade === "servicos" ? 0.32 : 0.12;
    var baseIR = d.fat * presIR;
    var ir = irpjMensal(baseIR);
    var csll = d.fat * presCS * 0.09;
    var pis = d.fat * 0.0065;
    var cofins = d.fat * 0.03;
    var local = d.fat * d.local;
    var patronal = d.folha * PATRONAL;
    r.presumido = { presIR: presIR, presCS: presCS, baseIR: baseIR, irpj: ir.irpj, adicional: ir.adicional, csll: csll, pis: pis, cofins: cofins, local: local, patronal: patronal,
      total: ir.irpj + ir.adicional + csll + pis + cofins + local + patronal };

    /* Lucro Real */
    var pisR = d.fat * 0.0165;
    var cofinsR = d.fat * 0.076;
    var lucro = d.fat - d.custos - d.folha - patronal - pisR - cofinsR - local;
    var irR = irpjMensal(lucro);
    var csllR = lucro > 0 ? lucro * 0.09 : 0;
    r.real = { lucro: lucro, irpj: irR.irpj, adicional: irR.adicional, csll: csllR, pis: pisR, cofins: cofinsR, local: local, patronal: patronal,
      total: irR.irpj + irR.adicional + csllR + pisR + cofinsR + local + patronal };

    return r;
  }

  (function simulador() {
    var form = $("#sim-form");
    if (!form) return;
    var erro = $("#sim-erro");
    var nomes = { simples: "Simples Nacional", presumido: "Lucro Presumido", real: "Lucro Real" };

    function ler() {
      var d = {
        fat: lerNumero(form.faturamento.value),
        folha: lerNumero(form.folha.value),
        custos: lerNumero(form.custos.value),
        atividade: form.atividade.value,
        local: Number(form.local.value) / 100
      };
      var problemas = [];
      [["faturamento", "fat", "faturamento"], ["folha", "folha", "folha de pagamento"], ["custos", "custos", "despesas"]].forEach(function (c) {
        var input = form[c[0]];
        var ruim = isNaN(d[c[1]]) || d[c[1]] < 0;
        input.setAttribute("aria-invalid", ruim ? "true" : "false");
        if (ruim) problemas.push(c[2]);
      });
      if (isNaN(d.local) || d.local < 0 || d.local > 0.30) { problemas.push("imposto local (0 a 30%)"); form.local.setAttribute("aria-invalid", "true"); } else { form.local.setAttribute("aria-invalid", "false"); }
      if (problemas.length) {
        erro.textContent = "Confira: " + problemas.join(", ") + ". Use só números, com vírgula para centavos.";
        erro.hidden = false;
        return null;
      }
      erro.hidden = true;
      return d;
    }

    function linhaMemoria(rotulo, valor) {
      return "<tr><td>" + rotulo + "</td><td>" + moeda(valor) + "</td></tr>";
    }

    function desenhar() {
      var d = ler();
      if (!d) return;
      var r = simular(d);

      var candidatos = ["simples", "presumido", "real"].filter(function (k) { return r[k].total !== null; });
      candidatos.sort(function (a, b) { return r[a].total - r[b].total; });
      var melhor = candidatos[0];
      var segundo = candidatos[1];

      trocarTexto($("#sim-melhor-nome"), nomes[melhor]);
      trocarTexto($("#sim-melhor-valor"), moeda(r[melhor].total) + '<span class="resultado-unidade">/mês</span>', true);
      var economia = segundo ? r[segundo].total - r[melhor].total : 0;
      var nota = d.fat > 0
        ? (economia > 0.005 ? "Economia de " + moeda(economia) + " por mês (" + moeda(economia * 12) + " por ano) em relação ao " + nomes[segundo] + "."
          : "Empate técnico com o " + nomes[segundo] + ".")
        : "Informe um faturamento maior que zero para comparar.";
      if (r.real.lucro <= 0) nota += " No Lucro Real a empresa teria prejuízo contábil, por isso IRPJ e CSLL ficam zerados nesse regime.";
      $("#sim-melhor-nota").textContent = nota;

      var anexoEl = $("#sim-anexo");
      if (r.simples.anexo) {
        anexoEl.textContent = "anexo " + r.simples.anexo + (r.simples.elegivel ? ", " + r.simples.faixa + "ª faixa" : "");
      }

      $$("#sim-tabela tbody tr").forEach(function (tr) {
        var k = tr.getAttribute("data-regime");
        var valor = $("[data-valor]", tr), p = $("[data-pct]", tr);
        if (r[k].total === null) { valor.textContent = "não se enquadra"; p.textContent = "-"; }
        else { valor.textContent = moeda(r[k].total); p.textContent = d.fat > 0 ? pct(r[k].total / d.fat) : "-"; }
        tr.classList.toggle("melhor", k === melhor);
      });

      var maior = Math.max.apply(null, candidatos.map(function (k) { return r[k].total; })) || 1;
      $$("#sim-barras .barra").forEach(function (b) {
        var k = b.getAttribute("data-regime");
        var v = r[k].total === null ? 0 : r[k].total;
        $(".barra-valor", b).style.setProperty("--largura-barra", (maior > 0 ? (v / maior) * 100 : 0).toFixed(1) + "%");
        b.classList.toggle("melhor", k === melhor);
      });

      var m = "";
      m += "<h4>Simples Nacional</h4><table>";
      if (r.simples.elegivel) {
        m += "<tr><td>Receita dos últimos 12 meses (12 × faturamento)</td><td>" + moeda(d.fat * 12) + "</td></tr>";
        if (r.simples.fatorR !== null) m += "<tr><td>Fator R (folha ÷ receita): " + pct(r.simples.fatorR) + (r.simples.fatorR >= 0.28 ? ", vai para o anexo III" : ", abaixo de 28%, vai para o anexo V") + "</td><td></td></tr>";
        m += "<tr><td>Anexo " + r.simples.anexo + ", " + r.simples.faixa + "ª faixa: alíquota nominal " + pct(r.simples.nominal) + ", parcela a deduzir " + moeda(r.simples.deducao) + "</td><td></td></tr>";
        m += "<tr><td>Alíquota efetiva = (receita × nominal − dedução) ÷ receita</td><td>" + pct(r.simples.efetiva) + "</td></tr>";
        m += "<tr class=\"soma\"><td>DAS do mês (faturamento × efetiva)</td><td>" + moeda(r.simples.das) + "</td></tr>";
      } else {
        m += "<tr><td>" + r.simples.motivo + "</td><td></td></tr>";
      }
      m += "</table>";

      m += "<h4>Lucro Presumido</h4><table>";
      m += "<tr><td>Base do IRPJ: " + pct(r.presumido.presIR) + " do faturamento</td><td>" + moeda(r.presumido.baseIR) + "</td></tr>";
      m += linhaMemoria("IRPJ 15% sobre a base", r.presumido.irpj);
      m += linhaMemoria("Adicional de IRPJ 10% sobre o que passa de R$ 20.000 por mês", r.presumido.adicional);
      m += linhaMemoria("CSLL 9% sobre " + pct(r.presumido.presCS) + " do faturamento", r.presumido.csll);
      m += linhaMemoria("PIS 0,65% do faturamento", r.presumido.pis);
      m += linhaMemoria("COFINS 3% do faturamento", r.presumido.cofins);
      m += linhaMemoria("ICMS ou ISS " + pct(d.local) + " do faturamento", r.presumido.local);
      m += linhaMemoria("Encargos patronais 27,8% da folha", r.presumido.patronal);
      m += "<tr class=\"soma\"><td>Total do mês</td><td>" + moeda(r.presumido.total) + "</td></tr></table>";

      m += "<h4>Lucro Real</h4><table>";
      m += linhaMemoria("PIS 1,65% do faturamento (sem créditos)", r.real.pis);
      m += linhaMemoria("COFINS 7,6% do faturamento (sem créditos)", r.real.cofins);
      m += linhaMemoria("ICMS ou ISS " + pct(d.local) + " do faturamento", r.real.local);
      m += linhaMemoria("Encargos patronais 27,8% da folha", r.real.patronal);
      m += "<tr><td>Lucro antes do IR: faturamento − despesas − folha − encargos − PIS/COFINS − imposto local</td><td" + (r.real.lucro < 0 ? " class=\"negativo\"" : "") + ">" + moeda(r.real.lucro) + "</td></tr>";
      m += linhaMemoria("IRPJ 15% sobre o lucro", r.real.irpj);
      m += linhaMemoria("Adicional de IRPJ 10% sobre o lucro que passa de R$ 20.000", r.real.adicional);
      m += linhaMemoria("CSLL 9% sobre o lucro", r.real.csll);
      m += "<tr class=\"soma\"><td>Total do mês</td><td>" + moeda(r.real.total) + "</td></tr></table>";
      $("#sim-memoria").innerHTML = m;
    }

    form.addEventListener("input", desenhar);
    form.addEventListener("change", desenhar);
    form.addEventListener("submit", function (e) { e.preventDefault(); desenhar(); });
    $$("input[type=text]", form).forEach(function (i) { i.addEventListener("blur", function () { formatarCampo(i); }); });
    desenhar();
  })();

  /* ---------- Custo de funcionário ---------- */
  function custoFuncionario(d) {
    var decimo = d.salario / 12;
    var ferias = (d.salario * (1 + 1 / 3)) / 12;
    var baseEncargos = d.salario + decimo + ferias;
    var fgts = baseEncargos * 0.08;
    var patronal = d.regime === "outros" ? baseEncargos * PATRONAL : 0;
    var vt = Math.max(0, d.vt - d.salario * 0.06);
    var itens = [
      ["Salário bruto", d.salario],
      ["Provisão de 13º salário (1/12)", decimo],
      ["Provisão de férias com um terço (1/9)", ferias],
      ["FGTS 8% sobre salário e provisões", fgts]
    ];
    if (d.regime === "outros") itens.push(["INSS patronal, RAT e terceiros (27,8%)", patronal]);
    else itens.push(["INSS patronal", 0]);
    itens.push(["Vale-transporte (parte da empresa)", vt]);
    itens.push(["Vale-refeição ou alimentação", d.vr]);
    itens.push(["Plano de saúde e outros", d.saude]);
    var total = itens.reduce(function (s, i) { return s + i[1]; }, 0);
    return { itens: itens, total: total, multiplicador: d.salario > 0 ? total / d.salario : 0 };
  }

  (function calculadora() {
    var form = $("#custo-form");
    if (!form) return;
    var erro = $("#custo-erro");

    function desenhar() {
      var d = {
        salario: lerNumero(form.salario.value),
        regime: form.regime.value,
        vt: lerNumero(form.vt.value),
        vr: lerNumero(form.vr.value),
        saude: lerNumero(form.saude.value)
      };
      var problemas = [];
      [["salario", "salário"], ["vt", "vale-transporte"], ["vr", "vale-refeição"], ["saude", "plano de saúde"]].forEach(function (c) {
        var ruim = isNaN(d[c[0]]) || d[c[0]] < 0;
        form[c[0]].setAttribute("aria-invalid", ruim ? "true" : "false");
        if (ruim) problemas.push(c[1]);
      });
      if (problemas.length) {
        erro.textContent = "Confira: " + problemas.join(", ") + ". Use só números, com vírgula para centavos.";
        erro.hidden = false;
        return;
      }
      erro.hidden = true;
      var r = custoFuncionario(d);
      trocarTexto($("#custo-total"), moeda(r.total) + '<span class="resultado-unidade">/mês</span>', true);
      $("#custo-multiplicador").textContent = d.salario > 0
        ? "Cada R$ 1,00 de salário custa R$ " + r.multiplicador.toFixed(2).replace(".", ",") + " para a empresa. No ano, " + moeda(r.total * 12) + "."
        : "Informe um salário maior que zero.";
      $("#custo-linhas").innerHTML = r.itens.map(function (i) {
        return "<tr><th scope=\"row\">" + i[0] + "</th><td class=\"mono num-col\">" + moeda(i[1]) + "</td></tr>";
      }).join("");
      $("#custo-total-tabela").textContent = moeda(r.total);
    }

    form.addEventListener("input", desenhar);
    form.addEventListener("change", desenhar);
    form.addEventListener("submit", function (e) { e.preventDefault(); desenhar(); });
    $$("input[type=text]", form).forEach(function (i) { i.addEventListener("blur", function () { formatarCampo(i); }); });
    desenhar();
  })();

  /* ---------- Calendário de obrigações (fictício) ---------- */
  var OBRIGACOES = [
    { dia: 5, titulo: "FGTS da folha de outubro", descricao: "Depósito de 8% sobre a remuneração de cada funcionário, pelo FGTS Digital.", tipo: "folha", regimes: ["simples", "presumido"] },
    { dia: 6, titulo: "Pagamento dos salários de outubro", descricao: "Até o quinto dia útil. O holerite sai antes, para conferência.", tipo: "folha", regimes: ["simples", "presumido"] },
    { dia: 10, titulo: "ISS sobre serviços de outubro", descricao: "Imposto municipal para quem não está no Simples. A alíquota depende da cidade e do serviço.", tipo: "imposto", regimes: ["presumido"] },
    { dia: 13, titulo: "EFD-Contribuições", descricao: "Declaração digital de PIS e COFINS, referente a setembro.", tipo: "declaracao", regimes: ["presumido"] },
    { dia: 16, titulo: "DCTFWeb e EFD-Reinf", descricao: "Declaração das contribuições previdenciárias e retenções do mês anterior.", tipo: "declaracao", regimes: ["simples", "presumido"] },
    { dia: 20, titulo: "DAS do Simples Nacional", descricao: "Guia única com os tributos federais, ICMS ou ISS e INSS patronal, sobre o faturamento de outubro.", tipo: "imposto", regimes: ["simples"] },
    { dia: 20, titulo: "DAS-MEI", descricao: "Valor fixo mensal do microempreendedor individual, com INSS e ICMS ou ISS.", tipo: "imposto", regimes: ["mei"] },
    { dia: 20, titulo: "INSS sobre a folha de outubro", descricao: "Contribuição previdenciária patronal e a retida dos funcionários, via DARF da DCTFWeb.", tipo: "imposto", regimes: ["presumido"] },
    { dia: 20, titulo: "PGDAS-D de outubro", descricao: "Declaração mensal do Simples que gera o DAS. Sem ela, a guia não existe.", tipo: "declaracao", regimes: ["simples"] },
    { dia: 25, titulo: "PIS e COFINS de outubro", descricao: "Contribuições federais sobre o faturamento, para quem não está no Simples.", tipo: "imposto", regimes: ["presumido"] },
    { dia: 30, titulo: "Adiantamento do 13º salário", descricao: "Primeira parcela do 13º para todos os funcionários, sem desconto de INSS ou IR nesta parcela.", tipo: "folha", regimes: ["mei", "simples", "presumido"] },
    { dia: 30, titulo: "IRPJ e CSLL por estimativa", descricao: "Recolhimento mensal de quem está no Lucro Real anual, ou a parcela trimestral de outubro no Presumido.", tipo: "imposto", regimes: ["presumido"] },
    { dia: 30, titulo: "ICMS de outubro", descricao: "Imposto estadual sobre circulação de mercadorias. A data real varia por estado e por atividade.", tipo: "imposto", regimes: ["presumido"] }
  ];
  var NOMES_TIPO = { imposto: "Imposto", folha: "Folha", declaracao: "Declaração" };
  var NOMES_REGIME = { mei: "MEI", simples: "Simples", presumido: "Presumido e Real" };
  var DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

  (function agenda() {
    var lista = $("#agenda");
    if (!lista) return;
    var vazia = $("#agenda-vazia");
    var contagem = $("#prazos-contagem");
    var hoje = new Date();
    var mesmoMes = hoje.getFullYear() === 2026 && hoje.getMonth() === 10;

    OBRIGACOES.forEach(function (o) {
      var li = document.createElement("li");
      li.setAttribute("data-tipo", o.tipo);
      li.setAttribute("data-regimes", o.regimes.join(" "));
      var data = new Date(2026, 10, o.dia);
      var estado = "";
      if (mesmoMes) {
        var dif = o.dia - hoje.getDate();
        if (dif >= 0 && dif <= 5) estado = dif === 0 ? "vence hoje" : dif === 1 ? "vence amanhã" : "vence em " + dif + " dias";
      }
      if (estado) li.classList.add("proximo");
      li.innerHTML =
        "<div class=\"dia\">" + o.dia + "<small>" + DIAS_SEMANA[data.getDay()] + "</small></div>" +
        "<div><p class=\"titulo\">" + o.titulo + "</p><p class=\"descricao\">" + o.descricao + "</p>" +
        (estado ? "<p class=\"proximo-aviso\">" + estado.charAt(0).toUpperCase() + estado.slice(1) + "</p>" : "") +
        "<div class=\"etiquetas\"><span class=\"etiqueta etiqueta-tipo-" + o.tipo + "\">" + NOMES_TIPO[o.tipo] + "</span>" +
        o.regimes.map(function (r) { return "<span class=\"etiqueta\">" + NOMES_REGIME[r] + "</span>"; }).join("") + "</div></div>";
      lista.appendChild(li);
    });

    function filtrar() {
      var regime = ($("input[name=f-regime]:checked") || {}).value || "todos";
      var tipos = $$("input[name=f-tipo]:checked").map(function (i) { return i.value; });
      var visiveis = 0;
      $$("li", lista).forEach(function (li) {
        var okRegime = regime === "todos" || li.getAttribute("data-regimes").split(" ").indexOf(regime) >= 0;
        var okTipo = tipos.indexOf(li.getAttribute("data-tipo")) >= 0;
        var mostra = okRegime && okTipo;
        li.hidden = !mostra;
        if (mostra) visiveis++;
      });
      vazia.hidden = visiveis > 0;
      contagem.textContent = visiveis === 1 ? "1 obrigação" : visiveis + " obrigações";
    }

    $$("input[name=f-regime], input[name=f-tipo]").forEach(function (i) { i.addEventListener("change", filtrar); });
    filtrar();
  })();

  /* ---------- Planos: mensal ou anual ---------- */
  (function planos() {
    var botoes = $$(".alternador-botao");
    if (!botoes.length) return;
    var nota = $("#planos-nota");
    botoes.forEach(function (b) {
      b.addEventListener("click", function () {
        var periodo = b.getAttribute("data-periodo");
        botoes.forEach(function (x) {
          var ativo = x === b;
          x.classList.toggle("ativo", ativo);
          x.setAttribute("aria-pressed", ativo ? "true" : "false");
        });
        $$(".preco").forEach(function (p) {
          trocarTexto(p, "R$ " + fmtInteiro.format(Number(p.getAttribute("data-" + periodo))));
        });
        nota.textContent = periodo === "anual"
          ? "Valores fictícios de demonstração. No anual você paga 10 mensalidades pelo ano inteiro; o valor mostrado é o total dividido por 12."
          : "Valores fictícios de demonstração. No mensal não há fidelidade: cancela quando quiser, com aviso de 30 dias.";
      });
    });
  })();

  /* ---------- Contato: valida e mostra o resumo, sem enviar ---------- */
  (function contato() {
    var form = $("#contato-form");
    if (!form) return;
    var erro = $("#ct-erro");
    var resumo = $("#ct-resumo");
    var lista = $("#ct-resumo-lista");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var problemas = [];
      var campos = [
        { el: form.nome, nome: "Nome", valido: function (v) { return v.trim().length >= 2; }, msg: "informe seu nome" },
        { el: form.email, nome: "E-mail", valido: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: "e-mail inválido" },
        { el: form.empresa, nome: "Empresa", valido: function () { return true; } },
        { el: form.assunto, nome: "Assunto", valido: function (v) { return v !== ""; }, msg: "escolha o que você precisa" },
        { el: form.mensagem, nome: "Mensagem", valido: function (v) { return v.trim().length >= 10; }, msg: "mensagem com pelo menos 10 letras" }
      ];
      var primeiroRuim = null;
      campos.forEach(function (c) {
        var ok = c.valido(c.el.value);
        c.el.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok) { problemas.push(c.msg); if (!primeiroRuim) primeiroRuim = c.el; }
      });
      if (problemas.length) {
        erro.textContent = "Falta pouco: " + problemas.join("; ") + ".";
        erro.hidden = false;
        resumo.hidden = true;
        primeiroRuim.focus();
        return;
      }
      erro.hidden = true;
      lista.innerHTML = "";
      campos.forEach(function (c) {
        var v = c.el.value.trim();
        if (!v) return;
        var dt = document.createElement("dt"); dt.textContent = c.nome;
        var dd = document.createElement("dd"); dd.textContent = v;
        lista.appendChild(dt); lista.appendChild(dd);
      });
      resumo.hidden = false;
      resumo.scrollIntoView({ behavior: reduzMovimento ? "auto" : "smooth", block: "nearest" });
    });
  })();
})();
