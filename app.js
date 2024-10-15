const axios = require("axios");
const querystring = require("querystring");
const cheerio = require("cheerio");
const notifier = require("node-notifier");

function sendPostRequest(State, JSESSIONID, turma) {
  const payload = {
    form: "form",
    "form:checkCodigo": "on",
    "form:txtCodigo": turma.code,
    "form:txtNome": "",
    "form:checkHorario": "on",
    "form:txtHorario": turma.time,
    "form:checkNomeDocente": "on",
    "form:txtNomeDocente": turma.teacher,
    "form:comboDepartamento": "0",
    "form:buscar": "Buscar",
    "javax.faces.ViewState": `j_id${State}`,
  };

  axios({
    method: "POST",
    url: "https://sigaa.unb.br/sigaa/graduacao/matricula/extraordinaria/matricula_extraordinaria.jsf",
    headers: {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "pt-BR,pt;q=0.8",
      "Cache-Control": "max-age=0",
      Connection: "keep-alive",
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: `zero-chakra-ui-color-mode=light-zero; AMP_MKTG_8f1ede8e9c=JTdCJTIycmVmZXJyZXIlMjIlM0ElMjJodHRwcyUzQSUyRiUyRnNpZ2FhLnVuYi5iciUyRiUyMiUyQyUyMnJlZmVycmluZ19kb21haW4lMjIlM0ElMjJzaWdhYS51bmIuYnIlMjIlN0Q=; JSESSIONID=${JSESSIONID}; AMP_8f1ede8e9c=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjI4OTdlNzk0OC1kZGJjLTRkNzYtOGE4MS05NTZiYzMyOGI3MWYlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjI4NGI0MzkzMy1hYjViLTQwYzgtYWI2MS1iNjYyZmRlZmJhZGQlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzI5MDE3OTUwNDUxJTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTcyOTAyNDIxNTU3MiUyQyUyMmxhc3RFdmVudElkJTIyJTNBMTE5MSU3RA==`,
      Host: "sigaa.unb.br",
      Referer: "https://autenticacao.unb.br/",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-site",
      "Sec-Fetch-User": "?1",
      "Sec-GPC": "1",
      "Upgrade-Insecure-Requests": "1",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
      "sec-ch-ua": '"Brave";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
    },
    data: querystring.stringify(payload),
  })
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);

      const linhas = $("tr.linhaImpar, tr.linhaPar");
      const offline = $('script').filter((i, el) => {
        return $(el).html().includes("alert('N\\u00E3o foi poss\\u00CDvel finalizar a opera\\u00E7\\u00E3o, pois a p\\u00E1gina que se est\\u00E1 tentando acessar n\\u00E3o est\\u00E1 mais ativa. Por favor, reinicie os procedimentos.')");
      }).length > 0;

      if(offline){
        console.log(`A sessão "${JSESSIONID}" ou o estado do formulário "${State}" da conta não funciona mais... Re-logue no SIGAA e consiga novos dados.`)
        process.exit(0);
      }
      if (linhas.length === 0) {
        console.log(
          `Não achado matéria com código "${turma.code}", professor "${turma.teacher}", horário "${turma.time}".`
        );
      } else {
        console.log(
          `Encontrado matéria com código "${turma.code}", professor "${turma.teacher}", horário "${turma.time}".`
        );
        notifier.notify({
          title: "MATÉRIA ENCONTRADA",
          message: `Encontrado matéria com código "${turma.code}", professor "${turma.teacher}", horário "${turma.time}".`,
          sound: true, // Ativar som (opcional)
          wait: true,
        });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}


const interval = 10000; //INTERVALO DAS BUSCAS

const State = ""; //ADICIONAR O STATE
const JSESSIONID = ""; //ADICIONAR O JSESSIONID

// TURMAS QUE DESEJA MONITORAR
const Turmas = [
  {
    code: "FGA0313",
    teacher: "",
    time: "35M12",
  },
];

let currentIndex = 0;
const startSendingRequests = () => {
  sendPostRequest(State, JSESSIONID, Turmas[currentIndex++]);
  currentIndex %= Turmas.length;
};

startSendingRequests();

setInterval(startSendingRequests, interval);
