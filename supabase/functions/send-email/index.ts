import "https://deno.land/x/dotenv/load.ts"

Deno.serve(async (req) => {
  const { to, subject, text } = await req.json();

  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SENDGRID_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: "ton_email_verifie@ton_domaine.com" }, // doit être un sender validé dans SendGrid
      subject,
      content: [{ type: "text/plain", value: text }],
    }),
  });

  if (!resp.ok) {
    return new Response(
      JSON.stringify({ success: false, error: await resp.text() }),
      { status: resp.status }
    );
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
