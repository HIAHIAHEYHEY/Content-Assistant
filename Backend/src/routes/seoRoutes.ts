import { Router } from 'express';
import seoAnalysisService from '../services/seoAnalysisService';
import { rateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/analyze', rateLimiter, async (req, res) => {
  try {
    const { content, keywords } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const analysis = seoAnalysisService.analyzeSEO(content, keywords);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ error: 'SEO analysis failed' });
  }
});

router.post('/suggest-keywords', rateLimiter, async (req, res) => {
  try {
    const { content, count } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    const keywords = seoAnalysisService.extractKeywords(content, count || 10);
    res.json({ success: true, data: keywords });
  } catch (error) {
    res.status(500).json({ error: 'Keyword extraction failed' });
  }
});

export default router;