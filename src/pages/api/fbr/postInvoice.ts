// pages/api/fbr/postInvoice.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const response = await axios.post(
      'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb',
      req.body,
      {
        headers: {
          'Authorization': `Bearer ${process.env.FBR_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds timeout
      }
    );

    res.status(200).json(response.data);
  } catch (err: any) {
    // Axios error handling
    if (err.response) {
      // Server responded with status code out of 2xx
      console.error('FBR API Response Error:', err.response.data);
      res.status(err.response.status).json(err.response.data);
    } else if (err.request) {
      // Request made but no response
      console.error('No response from FBR API:', err.request);
      res.status(503).json({ error: 'No response from FBR API' });
    } else {
      // Other errors
      console.error('FBR Post Invoice Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  }
}
