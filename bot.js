const venom = require("venom-bot");
const axios = require("axios");

const GOOGLE_API_KEY = "api_google_key"; 

venom
  .create({
    session: "chatbot-session",
    multidevice: true,
    browserArgs: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--headless=new",
    ],
  })
  .then((client) => start(client))
  .catch((error) => console.log(error));

const usersIMC = {};
const usersMacro = {};
const usersData = {};
const usersAgua = {};
const usersTreino = {};

function start(client) {
  client.onMessage(async (message) => {
    if (message.isGroupMsg === false) {
      const nome = message.sender.pushname || "amigo";
      const userId = message.from;
      const texto = message.body.toLowerCase().trim();

      if (texto === "1") {
        client.sendText(
          userId,
          `Olá, ${nome}!
  Sou seu PERSONAL TRAINER virtual.
  Eu te ajudo com treinos, dietas e dicas de saúde! Escolha uma opção do menu digitando o número correspondente.`
        );
      } else if (texto === "2") {
        client.sendText(
          userId,
          `Para montar seu treino personalizado, primeiro informe seu nível de experiência:
  - Digite **"iniciante"** para quem está começando
  - Digite **"intermediário"** para quem já treina há algum tempo
  - Digite **"avançado"** para quem já tem bastante experiência`
        );
        usersTreino[userId] = { step: "nivel" };
      } else if (usersTreino[userId] && usersTreino[userId].step) {
        let user = usersTreino[userId];

        if (user.step === "nivel") {
          const niveis = { iniciante: 1, intermediário: 2, avançado: 3 };
          if (niveis[texto]) {
            user.nivel = niveis[texto];
            client.sendText(
              userId,
              `Agora, informe seu sexo:
  - Digite **"masculino"** para homem
  - Digite **"feminino"** para mulher`
            );
            user.step = "sexo";
          } else {
            client.sendText(
              userId,
              "Por favor, digite um nível válido: **iniciante, intermediário ou avançado**."
            );
          }
        } else if (user.step === "sexo") {
          const sexos = { masculino: 1, feminino: 2 };
          if (sexos[texto]) {
            user.sexo = sexos[texto];

            // Chamando a função de treino
            const treino = gerarTreinoSemana(user.nivel, user.sexo);
            client.sendText(
              userId,
              `Aqui está seu treino personalizado:\n\n${treino}`
            );

            // Removendo usuário da memória
            delete usersTreino[userId];
          } else {
            client.sendText(
              userId,
              "Por favor, digite um sexo válido: **masculino ou feminino**."
            );
          }
        }
      } else if (texto === "3") {
        client.sendText(
          userId,
          "Para calcular seu IMC, me informe primeiro seu peso (em kg). Exemplo: 70"
        );
        usersIMC[userId] = { step: "peso" };
      } else if (usersIMC[userId] && usersIMC[userId].step) {
        let user = usersIMC[userId];

        if (user.step === "peso") {
          user.peso = parseFloat(texto);
          client.sendText(
            userId,
            "Agora, informe sua altura (em metros). Exemplo: 1.75"
          );
          user.step = "altura";
        } else if (user.step === "altura") {
          user.altura = parseFloat(texto);
          const imc = calcularIMC(user.peso, user.altura);
          client.sendText(
            userId,
            `${nome}, seu Índice de Massa Corporal (IMC) é ${imc.toFixed(2)}.`
          );
          delete usersIMC[userId];
        }
      } else if (texto === "4") {
        client.sendText(
          userId,
          "Para saber a quantidade ideal de água diária, me informe seu peso (em kg). Exemplo: 70"
        );
        usersAgua[userId] = { step: "peso" };
      } else if (usersAgua[userId] && usersAgua[userId].step) {
        let user = usersAgua[userId];
        if (user.step === "peso") {
          user.peso = parseFloat(texto);
          const agua = calcularAgua(user.peso);
          client.sendText(
            userId,
            `${nome}, a quantidade ideal de água diária para você é aproximadamente ${agua.toFixed(
              2
            )} litros.`
          );
          delete usersAgua[userId];
        }
      } else if (texto === "5") {
        client.sendText(
          userId,
          "Por favor, envie sua localização para encontrar academias próximas. No WhatsApp, clique no ícone de **clipe de papel 📎** e selecione **Localização**."
        );
      } else if (message.lat && message.lng) {
        buscarAcademiasProximas(client, userId, message.lat, message.lng);
      } else {
        client.sendText(
          userId,
          `Olá, ${nome}! Escolha uma das opções:\n1 - Como funciona\n2 - Montar treino personalizado\n3 - Verificar IMC\n4 - Quantidade de água diária\n5 - Academias próximas a mim`
        );
      }
    }
  });
}

function calcularIMC(peso, altura) {
  return peso / (altura * altura);
}

function calcularAgua(peso) {
  return peso * 0.035;
}
function gerarTreinoSemana(nivel, sexo) {
  let treinoSemana = "";
  const diasTreino = {
    1: ["Segunda", "Quarta", "Sexta"], // Iniciante
    2: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"], // Intermediário
    3: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"], // Avançado
  };

  const dias = diasTreino[nivel];

  dias.forEach((dia, index) => {
    treinoSemana += `**Treino de ${dia}**\n`;

    if (sexo === 1) {
      // Masculino
      if (index % 3 === 0) {
        treinoSemana += "**Treino de Peito e Tríceps**\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Supino reto\n"
            : "3 séries de 10 repetições - Supino reto\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Desenvolvimento com halteres\n"
            : "3 séries de 10 repetições - Desenvolvimento com halteres\n";
        treinoSemana +=
          nivel >= 3 ? "5 séries de 12 repetições - Crucifixo inclinado\n" : "";
      } else if (index % 3 === 1) {
        treinoSemana += "**Treino de Costas e Bíceps**\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Barra fixa\n"
            : "3 séries de 10 repetições - Barra fixa\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Remada curvada\n"
            : "3 séries de 10 repetições - Remada curvada\n";
        treinoSemana +=
          nivel >= 3
            ? "5 séries de 12 repetições - Rosca direta com barra\n"
            : "";
      } else {
        treinoSemana += "**Treino de Pernas**\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Agachamento\n"
            : "3 séries de 10 repetições - Agachamento\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Leg Press\n"
            : "3 séries de 10 repetições - Leg Press\n";
        treinoSemana +=
          nivel >= 3
            ? "5 séries de 12 repetições - Passada com halteres\n"
            : "";
      }
    } else if (sexo === 2) {
      // Feminino
      if (index % 3 === 0) {
        treinoSemana += "**Treino de Glúteo e Posterior**\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Stiff\n"
            : "3 séries de 10 repetições - Stiff\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Glúteo na polia\n"
            : "3 séries de 10 repetições - Glúteo na polia\n";
        treinoSemana +=
          nivel >= 3
            ? "5 séries de 12 repetições - Levantamento terra sumô\n"
            : "";
      } else if (index % 3 === 1) {
        treinoSemana += "**Treino de Quadríceps e Panturrilhas**\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Agachamento\n"
            : "3 séries de 10 repetições - Agachamento\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Leg Press\n"
            : "3 séries de 10 repetições - Leg Press\n";
        treinoSemana +=
          nivel >= 3 ? "5 séries de 12 repetições - Panturrilha em pé\n" : "";
      } else {
        treinoSemana += "**Treino de Superiores e Core**\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Desenvolvimento com halteres\n"
            : "3 séries de 10 repetições - Desenvolvimento com halteres\n";
        treinoSemana +=
          nivel >= 2
            ? "4 séries de 12 repetições - Remada curvada\n"
            : "3 séries de 10 repetições - Remada curvada\n";
        treinoSemana +=
          nivel >= 3
            ? "5 séries de 12 repetições - Rosca direta com barra\n"
            : "";
      }
    }

    treinoSemana += "\n";
  });

  return treinoSemana;
}

async function buscarAcademiasProximas(client, user, latitude, longitude) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=2000&type=gym&key=${GOOGLE_API_KEY}`;
    const response = await axios.get(url);
    if (response.data.results.length === 0) {
      client.sendText(user, "Não encontrei academias próximas a você. 😕");
      return;
    }
    let resposta = "🏋️‍♂️ **Academias próximas:**\n\n";
    response.data.results.slice(0, 5).forEach((gym) => {
      resposta += `📍 *${gym.name}*\n`;
      if (gym.vicinity) resposta += `📍 Endereço: ${gym.vicinity}\n`;
      if (gym.rating) resposta += `⭐ Avaliação: ${gym.rating}/5\n`;
      resposta += "\n";
    });
    client.sendText(user, resposta);
  } catch (error) {
    console.error("Erro ao buscar academias:", error);
    client.sendText(user, "Ocorreu um erro ao buscar academias próximas. 😞");
  }
}
