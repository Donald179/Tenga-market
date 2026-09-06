const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const rawBody = await request.text();
    if (!rawBody) return json({ error: "Le corps de la requête est vide." }, 400);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json({ error: "Le format JSON de la requête est invalide." }, 400);
    }

    const values = [payload.name, payload.phone, payload.email, payload.message];
    if (!values.every(value => typeof value === "string" && value.trim())) {
      return json({ error: "Tous les champs sont obligatoires." }, 400);
    }
    const name = payload.name as string;
    const phone = payload.phone as string;
    const email = payload.email as string;
    const message = payload.message as string;
    if (name.length > 120 || phone.length > 40 || email.length > 160 || message.length > 5000) {
      return json({ error: "Un champ dépasse la longueur autorisée." }, 400);
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    if (!resendApiKey) return json({ error: "Le secret RESEND_API_KEY n'est pas configuré dans Supabase." }, 500);
    const fromEmail = Deno.env.get("CONTACT_FROM_EMAIL")?.trim() || "Teng Market <onboarding@resend.dev>";
    const toEmail = Deno.env.get("CONTACT_TO_EMAIL")?.trim() || "lamiendonaldo179@gmail.com";
    if (!fromEmail || !toEmail) return json({ error: "Les adresses d'envoi ne sont pas configurées." }, 500);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
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
    const detail = error instanceof Error ? error.message : String(error);
    return json({ error: `Erreur interne : ${detail}` }, 500);
  }
});
