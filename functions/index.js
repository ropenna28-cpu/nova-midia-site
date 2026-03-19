const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

exports.createPix = onRequest(async (req, res) => {
  try {
    const response = await axios.post(
      "https://sandbox.api.pagseguro.com/orders",
      {
        reference_id: `pedido_${Date.now()}`,
        items: [
          {
            name: "Curso Marketing Digital",
            quantity: 1,
            unit_amount: 10000,
          },
        ],
        qr_codes: [
          {
            amount: {
              value: 10000,
            },
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    const qr = response.data?.qr_codes?.[0];

    res.status(200).json({
      pedido: response.data?.id || null,
      copiaECola: qr?.text || null,
      qrCodeLink: qr?.links?.[0]?.href || null,
      respostaCompleta: response.data,
    });
  } catch (error) {
    logger.error("Erro ao gerar PIX", error.response?.data || error.message);
    res.status(500).json({
      erro: "Erro ao gerar PIX",
      detalhe: error.response?.data || error.message,
    });
  }
});