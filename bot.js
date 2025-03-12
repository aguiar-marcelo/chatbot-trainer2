const venom = require("venom-bot");
const axios = require("axios");

const GOOGLE_API_KEY = "AIzaSyButGGe0w_Rr8rbYKLHMSHJHawSBsNjjEk"; // Substitua pela sua chave da API do Google

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


function start(client) {
  client.onMessage(async (message) => {
    if (message.isGroupMsg === false) {
      const nome = message.sender.pushname || "amigo";
      const userId = message.from;

      if (message.body === "1") {
        client.sendText(
          userId,
          `Olá, ${nome}!
Sou seu PERSONAL TRAINER virtual.
Eu te ajudo com treinos, dietas e dicas de saúde! Escolha uma opção do menu digitando o número correspondente.`
        );
      } else if (message.body === '2') {
        client.sendText(userId, 'Para montar seu treino personalizado, me diga seu nível (iniciante, intermediário, avançado).');
        usersData[userId] = { step: 'nivel' };
      } else if (usersData[userId] && usersData[userId].step) {
        let user = usersData[userId];

        if (user.step === 'nivel') {
          user.nivel = message.body.toLowerCase();
          client.sendText(userId, 'Agora, informe seu sexo (masculino/feminino).');
          user.step = 'sexo';
        } else if (user.step === 'sexo') {
          user.sexo = message.body.toLowerCase();
          if (user.sexo !== 'masculino' && user.sexo !== 'feminino') {
            client.sendText(userId, 'Por favor, informe "masculino" ou "feminino".');
            return;
          }

          const treino = gerarTreino(user.nivel, user.sexo);
          client.sendText(userId, `${nome}, aqui está seu treino personalizado:\n\n${treino}`);
          delete user.step;
        }
      } else if (message.body === "3") {
        client.sendText(
          userId,
          "Para calcular seu IMC, me informe primeiro seu peso (em kg). Exemplo: 70"
        );
        usersIMC[userId] = { step: "peso" };
      } else if (usersIMC[userId] && usersIMC[userId].step) {
        let user = usersIMC[userId];

        if (user.step === "peso") {
          user.peso = parseFloat(message.body);
          client.sendText(
            userId,
            "Agora, informe sua altura (em metros). Exemplo: 1.75"
          );
          user.step = "altura";
        } else if (user.step === "altura") {
          user.altura = parseFloat(message.body);
          const imc = calcularIMC(user.peso, user.altura);
          client.sendText(
            userId,
            `${nome}, seu Índice de Massa Corporal (IMC) é ${imc.toFixed(2)}.`
          );
          delete usersIMC[userId];
        }
      } else if (message.body === "4") {
        client.sendText(
          userId,
          "Para saber a quantidade ideal de água diária, me informe seu peso (em kg). Exemplo: 70"
        );
        usersAgua[userId] = { step: "peso" };
      } else if (usersAgua[userId] && usersAgua[userId].step) {
        let user = usersAgua[userId];
        if (user.step === "peso") {
          user.peso = parseFloat(message.body);
          const agua = calcularAgua(user.peso);
          client.sendText(
            userId,
            `${nome}, a quantidade ideal de água diária para você é aproximadamente ${agua.toFixed(2)} litros.`
          );
          delete usersAgua[userId];
        }
      } else if (message.body === "5") {
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

function gerarTreino(nivel, sexo) {
  let treino = "";
  if (sexo === "masculino") {
    treino += "**Treino Focado na Parte Superior**\n";
    if (nivel === "iniciante") {
      treino += "3 séries de 10 repetições - Supino reto\n";
      treino += "3 séries de 10 repetições - Desenvolvimento com halteres\n";
    } else if (nivel === "intermediário") {
      treino += "4 séries de 12 repetições - Supino reto\n";
      treino += "4 séries de 12 repetições - Desenvolvimento com halteres\n";
      treino += "4 séries de 12 repetições - Barra fixa\n";
    } else {
      treino += "5 séries de 12 repetições - Supino reto\n";
      treino += "5 séries de 12 repetições - Desenvolvimento com halteres\n";
      treino += "5 séries de 12 repetições - Barra fixa\n";
      treino += "5 séries de 12 repetições - Crucifixo inclinado\n";
    }
  } else {
    treino += "**Treino Focado em Membros Inferiores**\n";
    if (nivel === "iniciante") {
      treino += "3 séries de 10 repetições - Agachamento\n";
      treino += "3 séries de 10 repetições - Leg Press\n";
    } else if (nivel === "intermediário") {
      treino += "4 séries de 12 repetições - Agachamento\n";
      treino += "4 séries de 12 repetições - Leg Press\n";
      treino += "4 séries de 12 repetições - Passada com halteres\n";
    } else {
      treino += "5 séries de 12 repetições - Agachamento\n";
      treino += "5 séries de 12 repetições - Leg Press\n";
      treino += "5 séries de 12 repetições - Passada com halteres\n";
      treino += "5 séries de 12 repetições - Glúteo na polia\n";
    }
  }
  return treino;
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
