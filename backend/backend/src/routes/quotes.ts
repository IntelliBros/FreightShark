import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'quotes endpoint - not implemented for email-only server' }));
export default router;
