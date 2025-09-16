import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json({ message: 'endpoint - email server only' }));
export default router;