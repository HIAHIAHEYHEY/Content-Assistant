import { Request, Response } from 'express';
import geminiService from '../services/geminiService';
import seoAnalysisService from '../services/seoAnalysisService';
import { prisma } from '../server';
import { logger } from '../utils/logger';

export const analyzeContent = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Run both AI analysis and SEO analysis in parallel
    const [aiAnalysis, seoAnalysis] = await Promise.all([
      geminiService.analyzeContent(content),
      Promise.resolve(seoAnalysisService.analyzeSEO(content))
    ]);

    res.json({
      success: true,
      data: {
        ai: aiAnalysis,
        seo: seoAnalysis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Content analysis error:', error);
    res.status(500).json({ error: 'Content analysis failed' });
  }
};

export const rewriteContent = async (req: Request, res: Response) => {
  try {
    const { content, targetTone, keywords } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const tone = targetTone || 'professional';
    const keywordList = keywords || seoAnalysisService.extractKeywords(content, 5);

    // Rewrite content
    const optimizedContent = await geminiService.rewriteContent(content, keywordList, tone);

    // Analyze both versions
    const [originalAnalysis, optimizedAnalysis] = await Promise.all([
      Promise.resolve(seoAnalysisService.analyzeSEO(content, keywordList)),
      Promise.resolve(seoAnalysisService.analyzeSEO(optimizedContent, keywordList))
    ]);

    // Save optimization session if user is authenticated
    if (req.user) {
      await prisma.optimizationSession.create({
        data: {
          draftId: req.body.draftId || '',
          originalContent: content,
          optimizedContent,
          changes: {
            original: originalAnalysis,
            optimized: optimizedAnalysis
          },
          seoScore: optimizedAnalysis.score,
          readabilityScore: optimizedAnalysis.readability.fleschKincaid,
          keywordDensity: optimizedAnalysis.keywordDensity,
          targetTone: tone
        }
      });
    }

    res.json({
      success: true,
      data: {
        original: content,
        optimized: optimizedContent,
        analysis: {
          original: originalAnalysis,
          optimized: optimizedAnalysis
        },
        improvement: {
          seoScore: optimizedAnalysis.score - originalAnalysis.score,
          readability: optimizedAnalysis.readability.fleschKincaid - originalAnalysis.readability.fleschKincaid
        }
      }
    });
  } catch (error) {
    logger.error('Content rewrite error:', error);
    res.status(500).json({ error: 'Content rewriting failed' });
  }
};

export const proofreadContent = async (req: Request, res: Response) => {
  try {
    const { content, targetAudience } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const proofreadResult = await geminiService.proofreadContent(content);
    const readabilityAnalysis = seoAnalysisService.calculateReadability(proofreadResult.correctedContent);

    res.json({
      success: true,
      data: {
        original: content,
        corrected: proofreadResult.correctedContent,
        errors: proofreadResult.errors,
        readability: readabilityAnalysis,
        errorCount: proofreadResult.errors.length
      }
    });
  } catch (error) {
    logger.error('Proofreading error:', error);
    res.status(500).json({ error: 'Proofreading failed' });
  }
};

export const generateMeta = async (req: Request, res: Response) => {
  try {
    const { content, primaryKeyword } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const keyword = primaryKeyword || seoAnalysisService.extractKeywords(content, 1)[0] || 'content';
    const metaContent = await geminiService.generateMeta(content, keyword);

    res.json({
      success: true,
      data: metaContent
    });
  } catch (error) {
    logger.error('Meta generation error:', error);
    res.status(500).json({ error: 'Meta content generation failed' });
  }
};