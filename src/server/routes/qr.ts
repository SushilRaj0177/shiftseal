import { Router } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod/v3';

/** Public: renders a check-in or zone code as an SVG QR sticker (codes are not secrets). */
export const qrRouter = Router();

const qrQuerySchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9-]{1,40}$/),
});

qrRouter.get('/', async (req, res, next) => {
  try {
    const { code } = qrQuerySchema.parse(req.query);
    const svg = await QRCode.toString(code, {
      type: 'svg',
      margin: 1,
      width: 148,
      color: { dark: '#1b1b1f', light: '#ffffff' },
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (err) {
    next(err);
  }
});
