import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

router.post('/google', async (req, res) => {
  console.log('Received /oauth/google request:', req.body);
  const { code, codeVerifier, redirectUri } = req.body;

  if (!code || !redirectUri || !codeVerifier) {
    return res.status(400).json({ error: 'Missing code, codeVerifier, or redirectUri' });
  }

  try {
    const params = new URLSearchParams({
      code,
      client_id: '296978714021-2j0qim3a41vnfgch8vvv5hjgro5bgkpc.apps.googleusercontent.com', // Android client ID
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });

    console.log('Token exchange params:', params.toString());

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();
    console.log('Google token endpoint response:', data);

    if (data.error) {
      return res.status(400).json({ error: data.error, error_description: data.error_description });
    }

    res.json({ id_token: data.id_token, access_token: data.access_token });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router; 