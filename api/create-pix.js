export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const payload = {
      reference_id: `pedido_${Date.now()}`,
      customer: {
        name: "Cliente Teste",
        email: "teste@email.com",
        tax_id: "32984559894"
      },
      items: [
        {
          name: "Curso Marketing Digital",
          quantity: 1,
          unit_amount: 10000
        }
      ],
      qr_codes: [
        {
          amount: {
            value: 10000
          }
        }
      ]
    };

    const response = await fetch("https://sandbox.api.pagseguro.com/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAGBANK_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Erro ao criar PIX",
        details: data
      });
    }

    const qr = data?.qr_codes?.[0];

    return res.status(200).json({
      pedido: data?.id || null,
      copiaECola: qr?.text || null,
      qrCodeLink: qr?.links?.[0]?.href || null,
      raw: data
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno",
      details: error.message
    });
  }
}