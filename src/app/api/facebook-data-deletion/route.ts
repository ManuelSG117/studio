import { NextRequest, NextResponse } from 'next/server';

// Utilidad para decodificar base64 url
function base64UrlDecode(input: string) {
  return Buffer.from(input.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

// Función para parsear el signed_request de Facebook
function parseSignedRequest(signedRequest: string, appSecret: string) {
  const [encodedSig, payload] = signedRequest.split('.', 2);
  const sig = Buffer.from(encodedSig, 'base64');
  const data = JSON.parse(base64UrlDecode(payload));

  // Validar la firma (opcional, recomendado en producción)
  // const expectedSig = crypto.createHmac('sha256', appSecret).update(payload).digest();
  // if (!crypto.timingSafeEqual(sig, expectedSig)) {
  //   throw new Error('Invalid signature');
  // }

  return data;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const signedRequest = formData.get('signed_request') as string;
  // const appSecret = process.env.FACEBOOK_APP_SECRET!; // Usa tu app secret real en producción
  const appSecret = 'APP_SECRET_AQUI'; // Reemplaza por tu app secret

  let userId = '';
  try {
    const data = parseSignedRequest(signedRequest, appSecret);
    userId = data.user_id;
    // Aquí deberías eliminar los datos del usuario identificado por userId
    // await deleteUserData(userId);
  } catch (error) {
    return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 });
  }

  // Genera un código de confirmación único (puedes usar un UUID real en producción)
  const confirmationCode = Math.random().toString(36).substring(2, 10);
  const statusUrl = `https://tudominio.com/data-deletion-status?id=${confirmationCode}`;

  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  });
} 