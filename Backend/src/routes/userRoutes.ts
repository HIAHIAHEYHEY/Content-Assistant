import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../server';

const router = Router();

router.use(authMiddleware);

router.get('/drafts', async (req, res) => {
  try {
    const drafts = await prisma.draft.findMany({
      where: { userId: req.user!.userId },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: drafts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

router.post('/save-draft', async (req, res) => {
  try {
    const { title, content, optimizedContent } = req.body;
    const draft = await prisma.draft.create({
      data: {
        userId: req.user!.userId,
        title,
        content,
        optimizedContent,
        status: 'draft'
      }
    });
    res.json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

router.put('/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, optimizedContent, status } = req.body;
    const draft = await prisma.draft.update({
      where: { id, userId: req.user!.userId },
      data: { title, content, optimizedContent, status }
    });
    res.json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

router.delete('/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.draft.delete({
      where: { id, userId: req.user!.userId }
    });
    res.json({ success: true, message: 'Draft deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

export default router;