const venom = require("venom-bot");
const axios = require("axios");

const GOOGLE_API_KEY = "AIzaSyButGGe0w_Rr8rbYKLHMSHJHawSBsNjjEk"; // Substitua pela sua chave da API do Google

venom.create({
  session: "chatbot-session",
  multidevice: true,
  headless: true,
  browserArgs: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--headless=new"],
}).then((client) => start(client)).catch((error) => console.log(error));

const usersIMC = {};

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
        client.sendText(userId, 'Para criar sua dieta personalizada, preciso saber algumas informações: \n1. Qual seu peso? \n2. Qual seu objetivo? (Perder peso, Ganhar massa, Definir)');
      } else if (message.body === '4') {
        client.sendText(userId, 'Para calcular seu IMC, me informe primeiro sua altura (em metros). Exemplo: 1.75');
        usersIMC[userId] = { step: 'altura' };
      } else if (usersIMC[userId] && usersIMC[userId].step === 'altura') {
        let altura = parseFloat(message.body.replace(',', '.'));
        if (!isNaN(altura) && altura > 0) {
          usersIMC[userId].altura = altura;
          usersIMC[userId].step = 'peso';
          client.sendText(userId, 'Agora me informe seu peso (em kg). Exemplo: 70');
        } else {
          client.sendText(userId, 'Altura inválida. Por favor, digite um valor válido. Exemplo: 1.75');
        }
      } else if (usersIMC[userId] && usersIMC[userId].step === 'peso') {
        let peso = parseFloat(message.body.replace(',', '.'));
        if (!isNaN(peso) && peso > 0) {
          let altura = usersIMC[userId].altura;
          let imc = (peso / (altura * altura)).toFixed(2);
          let status;
          if (imc < 18.5) status = 'Abaixo do peso';
          else if (imc < 24.9) status = 'Peso normal';
          else if (imc < 29.9) status = 'Sobrepeso';
          else if (imc < 34.9) status = 'Obesidade grau 1';
          else if (imc < 39.9) status = 'Obesidade grau 2';
          else status = 'Obesidade grau 3';
          client.sendText(userId, `Seu IMC é ${imc}. Classificação: ${status}.`);
          delete usersIMC[userId];
        } else {
          client.sendText(userId, 'Peso inválido. Por favor, digite um valor válido. Exemplo: 70');
        }
      } else if (message.body === '5') {
        client.sendText(userId, 'Para saber a quantidade ideal de água diária, me envie seu peso (em kg). Exemplo: 70');
      } else if (message.body === '6') {
        client.sendText(userId, 'Por favor, envie sua localização para encontrar academias próximas. No WhatsApp, clique no ícone de **clipe de papel 📎** e selecione **Localização**.');
      } else if (message.lat && message.lng) {
        buscarAcademiasProximas(client, userId, message.lat, message.lng);
      } else if (!isNaN(parseFloat(message.body.replace(',', '.')))) {
        let peso = parseFloat(message.body.replace(',', '.'));
        let agua = (peso * 35) / 1000;
        client.sendText(userId, `Você deve beber aproximadamente ${agua.toFixed(2)} litros de água por dia.`);
      } else {
        client.sendText(userId, `Olá, ${nome}! Escolha uma das opções:\n1 - Como funciona\n2 - Montar treino personalizado\n3 - Montar dieta personalizada\n4 - Verificar IMC\n5 - Quantidade de água diária\n6 - Academias próximas a mim`);
      }
    }
  });
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
