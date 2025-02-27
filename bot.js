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

function start(client) {
  client.onMessage(async (message) => {
    if (message.isGroupMsg === false) {
      const nome = message.sender.pushname || "amigo";
      const userId = message.from;

      if (message.body === "1") {
        client.sendText(
          userId,
          `Olá, ${nome}!\n\nSou seu PERSONAL TRAINER virtual.\nEu te ajudo com treinos, dietas e dicas de saúde! Escolha uma opção do menu digitando o número correspondente.`
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
          delete user.step; // Remover o passo para não solicitar novamente
        }
      } else if (message.body === "3") {
        if (usersData[userId]) {
          const { peso, altura, idade, sexo } = usersData[userId];
          const tmb = calcularTMB(peso, altura, idade, sexo);
          client.sendText(
            userId,
            `${nome}, sua Taxa Metabólica Basal é de aproximadamente ${tmb.toFixed(
              2
            )} kcal por dia.`
          );
        } else {
          client.sendText(
            userId,
            "Para calcular sua TMB, informe primeiro seu peso (em kg). Exemplo: 70"
          );
          usersData[userId] = { step: "peso" };
        }
      } else if (usersData[userId] && usersData[userId].step) {
        let user = usersData[userId];

        if (user.step === "peso") {
          user.peso = parseFloat(message.body);
          client.sendText(
            userId,
            "Agora, informe sua altura (em metros). Exemplo: 1.75"
          );
          user.step = "altura";
        } else if (user.step === "altura") {
          user.altura = parseFloat(message.body);
          client.sendText(userId, "Agora, informe sua idade. Exemplo: 25");
          user.step = "idade";
        } else if (user.step === "idade") {
          user.idade = parseInt(message.body);
          client.sendText(
            userId,
            "Por último, informe seu sexo (masculino/feminino)."
          );
          user.step = "sexo";
        } else if (user.step === "sexo") {
          user.sexo = message.body.toLowerCase();
          if (user.sexo !== "masculino" && user.sexo !== "feminino") {
            client.sendText(
              userId,
              'Por favor, informe "masculino" ou "feminino".'
            );
            return;
          }

          const tmb = calcularTMB(
            user.peso,
            user.altura,
            user.idade,
            user.sexo
          );
          client.sendText(
            userId,
            `${nome}, sua Taxa Metabólica Basal é de aproximadamente ${tmb.toFixed(
              2
            )} kcal por dia.`
          );
          delete user.step; // Remover o passo para não solicitar novamente
        }
      } else if (message.body === "4") {
        client.sendText(
          userId,
          "Para calcular seu IMC, me informe primeiro sua altura (em metros). Exemplo: 1.75"
        );
        usersIMC[userId] = { step: "altura" };
      } else if (message.body === "5") {
        client.sendText(
          userId,
          "Para saber a quantidade ideal de água diária, me envie seu peso (em kg). Exemplo: 70"
        );
      } else if (message.body === "6") {
        client.sendText(
          userId,
          "Por favor, envie sua localização para encontrar academias próximas. No WhatsApp, clique no ícone de **clipe de papel 📎** e selecione **Localização**."
        );
      } else if (message.lat && message.lng) {
        buscarAcademiasProximas(client, userId, message.lat, message.lng);
      } else {
        client.sendText(
          userId,
          `Olá, ${nome}! Escolha uma das opções:\n1 - Como funciona\n2 - Montar treino personalizado\n3 - Calcular minha taxa metabolica basal\n4 - Verificar IMC\n5 - Quantidade de água diária\n6 - Academias próximas a mim`
        );
      }
    }
  });
}

function gerarTreino(nivel, sexo) {
  let treino = '';
  if (sexo === 'masculino') {
    treino += '**Treino Focado na Parte Superior**\n';
    treino += nivel === 'iniciante' ? '3 séries de 10 repetições - Supino reto\n3 séries de 10 repetições - Desenvolvimento com halteres\n' :
              nivel === 'intermediário' ? '4 séries de 12 repetições - Supino reto\n4 séries de 12 repetições - Desenvolvimento com halteres\n' :
              '5 séries de 12 repetições - Supino reto\n5 séries de 12 repetições - Desenvolvimento com halteres\n';
  } else {
    treino += '**Treino Focado em Membros Inferiores**\n';
    treino += nivel === 'iniciante' ? '3 séries de 10 repetições - Agachamento\n3 séries de 10 repetições - Leg Press\n' :
              nivel === 'intermediário' ? '4 séries de 12 repetições - Agachamento\n4 séries de 12 repetições - Leg Press\n' :
              '5 séries de 12 repetições - Agachamento\n5 séries de 12 repetições - Leg Press\n';
  }
  return treino;
}


function calcularTMB(peso, altura, idade, sexo) {
  if (sexo === "masculino") {
    return 88.36 + 13.4 * peso + 4.8 * altura * 100 - 5.7 * idade;
  } else {
    return 447.6 + 9.2 * peso + 3.1 * altura * 100 - 4.3 * idade;
  }
}

// Função para buscar academias próximas via Google Places API
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
