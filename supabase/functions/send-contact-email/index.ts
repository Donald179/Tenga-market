const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { name, phone, email, message } = await request.json();
    if (![name, phone, email, message].every(value => typeof value === "string" && value.trim())) {
      return json({ error: "Tous les champs sont obligatoires." }, 400);
    }
    if (name.length > 120 || phone.length > 40 || email.length > 160 || message.length > 5000) {
      return json({ error: "Un champ dépasse la longueur autorisée." }, 400);
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: Deno.env.get("CONTACT_FROM_EMAIL") || "Teng Market <onboarding@resend.dev>",
        to: [Deno.env.get("CONTACT_TO_EMAIL") || "lamiendonaldo179@gmail.com"],
        reply_to: email,
        subject: `Nouveau message de ${name} - Teng Market`,
        text: `Nom et prenom : ${name}\nWhatsApp : ${phone}\nEmail : ${email}\n\nMessage :\n${message}`,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.text();
      console.error("Resend error:", error);
      return json({ error: "Le message n'a pas pu être envoyé." }, 502);
    }

    return json({ success: true });
  } catch (error) {
    console.error("Contact function error:", error);
    return json({ error: "Requête invalide." }, 400);
  }
});
