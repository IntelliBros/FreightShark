import { Router } from 'express';

const router = Router();

// Stub endpoints for email-only server
router.get('/', (req, res) => res.json({ message: 'Auth endpoint - not implemented for email-only server' }));
router.post('/login', (req, res) => res.json({ message: 'Email server mode - use frontend auth' }));
router.post('/register', (req, res) => res.json({ message: 'Email server mode - use frontend auth' }));
router.post('/logout', (req, res) => res.json({ message: 'Email server mode - use frontend auth' }));
router.get('/validate', (req, res) => res.json({ message: 'Email server mode - use frontend auth' }));

export default router;