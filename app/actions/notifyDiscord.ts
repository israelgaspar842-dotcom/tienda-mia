'use server'

export async function sendDiscordAlert(payload: any) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("Falta DISCORD_WEBHOOK_URL en el entorno");
    return;
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error("Error Discord:", await response.text());
    } else {
      console.log("✅ Alerta enviada exitosamente desde el servidor");
    }
  } catch (error) {
    console.error("Fallo de red en Server Action:", error);
  }
}
