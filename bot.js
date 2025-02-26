const venom = require("venom-bot");
const axios = require("axios");

const GOOGLE_API_KEY = "AIzaSyButGGe0w_Rr8rbYKLHMSHJHawSBsNjjEk"; // Substitua pela sua chave da API do Google

venom
  .create({
    session: "chatbot-session",
    multidevice: true,
    headless: true,
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
      const nome = message.sender.pushname || 'amigo';
      const userId = message.from;

      if (message.body === '1') {
        client.sendText(userId, `Olá, ${nome}!\n\nSou seu PERSONAL TRAINER virtual.\nEu te ajudo com treinos, dietas e dicas de saúde! Escolha uma opção do menu digitando o número correspondente.`);
      } else if (message.body === '2') {
        client.sendText(userId, 'Para montar seu treino personalizado, me diga qual seu objetivo (exemplo: perder peso, ganhar massa muscular, definir o corpo).');
      } else if (message.body === '3') {
        client.sendText(userId, 'Para calcular seus macronutrientes, me informe primeiro seu peso (em kg). Exemplo: 70');
        usersMacro[userId] = { step: 'peso' };
      } else if (usersMacro[userId] && usersMacro[userId].step === 'peso') {
        let peso = parseFloat(message.body.replace(',', '.'));
        if (!isNaN(peso) && peso > 0) {
          usersMacro[userId].peso = peso;
          usersMacro[userId].step = 'altura';
          client.sendText(userId, 'Agora me informe sua altura (em metros). Exemplo: 1.75');
        } else {
          client.sendText(userId, 'Peso inválido. Por favor, digite um valor válido. Exemplo: 70');
        }
      } else if (usersMacro[userId] && usersMacro[userId].step === 'altura') {
        let altura = parseFloat(message.body.replace(',', '.'));
        if (!isNaN(altura) && altura > 0) {
          usersMacro[userId].altura = altura;
          usersMacro[userId].step = 'idade';
          client.sendText(userId, 'Agora me informe sua idade. Exemplo: 25');
        } else {
          client.sendText(userId, 'Altura inválida. Por favor, digite um valor válido. Exemplo: 1.75');
        }
      } else if (usersMacro[userId] && usersMacro[userId].step === 'idade') {
        let idade = parseInt(message.body);
        if (!isNaN(idade) && idade > 0) {
          usersMacro[userId].idade = idade;
          usersMacro[userId].step = 'sexo';
          client.sendText(userId, 'Agora me informe seu sexo (Masculino ou Feminino).');
        } else {
          client.sendText(userId, 'Idade inválida. Por favor, digite um valor válido. Exemplo: 25');
        }
      } else if (usersMacro[userId] && usersMacro[userId].step === 'sexo') {
        let sexo = message.body.toLowerCase();
        if (sexo === 'masculino' || sexo === 'feminino') {
          usersMacro[userId].sexo = sexo;
          usersMacro[userId].step = 'objetivo';
          client.sendText(userId, 'Qual seu objetivo? Digite 1 para ganhar massa muscular ou 2 para definir.');
        } else {
          client.sendText(userId, 'Sexo inválido. Por favor, digite Masculino ou Feminino.');
        }
      } else if (usersMacro[userId] && usersMacro[userId].step === 'objetivo') {
        let objetivo = parseInt(message.body);
        if (objetivo === 1 || objetivo === 2) {
          usersMacro[userId].objetivo = objetivo;
          calcularMacronutrientes(client, userId, usersMacro[userId]);
          delete usersMacro[userId];
        } else {
          client.sendText(userId, 'Objetivo inválido. Digite 1 para ganhar massa muscular ou 2 para definir.');
        }
      } else if (message.body === '4') {
        client.sendText(userId, 'Para calcular seu IMC, me informe primeiro sua altura (em metros). Exemplo: 1.75');
        usersIMC[userId] = { step: 'altura' };
      } else if (message.body === '5') {
        client.sendText(userId, 'Para saber a quantidade ideal de água diária, me envie seu peso (em kg). Exemplo: 70');
      } else if (message.body === '6') {
        client.sendText(userId, 'Por favor, envie sua localização para encontrar academias próximas. No WhatsApp, clique no ícone de **clipe de papel 📎** e selecione **Localização**.');
      } else if (message.lat && message.lng) {
        buscarAcademiasProximas(client, userId, message.lat, message.lng);
      } else {
        client.sendText(userId, `Olá, ${nome}! Escolha uma das opções:\n1 - Como funciona\n2 - Montar treino personalizado\n3 - Calcular macronutrientes da minha dieta\n4 - Verificar IMC\n5 - Quantidade de água diária\n6 - Academias próximas a mim`);
      }
    }
  });
}

function calcularMacronutrientes(client, userId, data) {
  let tmb;
  if (data.sexo === 'masculino') {
    tmb = 10 * data.peso + 6.25 * data.altura * 100 - 5 * data.idade + 5;
  } else {
    tmb = 10 * data.peso + 6.25 * data.altura * 100 - 5 * data.idade - 161;
  }
  let calorias = data.objetivo === 1 ? tmb * 1.2 : tmb * 0.85;
  let proteinas = (data.peso * 2).toFixed(1);
  let carboidratos = (calorias * 0.5 / 4).toFixed(1);
  let gorduras = (calorias * 0.25 / 9).toFixed(1);

  client.sendText(userId, `Sua meta diária:\n\n🔥 Calorias: ${calorias.toFixed(0)} kcal\n🍗 Proteínas: ${proteinas}g\n🍞 Carboidratos: ${carboidratos}g\n🥑 Gorduras: ${gorduras}g`);
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
