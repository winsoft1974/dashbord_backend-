import { Router, Response } from 'express';
import FaqItem from '../models/FaqItem';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { success, error } from '../utils/apiResponse';

const router = Router();

// @route   GET /api/faq
// @desc    Get published FAQs
// @access  Public
router.get('/', async (req: any, res: Response) => {
  try {
    const query: any = {};
    
    // Admins can see drafts
    const isPublic = req.query.view !== 'admin';
    if (isPublic) {
      query.published = true;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    const faqs = await FaqItem.find(query).sort({ sortOrder: 1, createdAt: 1 });
    return success(res, faqs);
  } catch (err: any) {
    console.error('Fetch FAQs error:', err);
    return error(res, 'Server error fetching FAQ items', 500);
  }
});

// @route   POST /api/faq
// @desc    Create a FAQ item
// @access  Protected
router.post('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, question, answer } = req.body;

    if (!category || !question || !answer) {
      return error(res, 'Category, Question, and Answer are required', 400);
    }

    const newFaq = new FaqItem(req.body);
    await newFaq.save();

    return success(res, newFaq, 'FAQ item created successfully', 201);
  } catch (err: any) {
    console.error('Create FAQ error:', err);
    return error(res, 'Server error creating FAQ item', 500);
  }
});

// @route   PUT /api/faq/:id
// @desc    Update a FAQ item
// @access  Protected
router.put('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const faq = await FaqItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!faq) {
      return error(res, 'FAQ item not found', 404);
    }

    return success(res, faq, 'FAQ item updated successfully');
  } catch (err: any) {
    console.error('Update FAQ error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/faq/:id
// @desc    Delete a FAQ item
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const faq = await FaqItem.findByIdAndDelete(req.params.id);
    if (!faq) {
      return error(res, 'FAQ item not found', 404);
    }
    return success(res, null, 'FAQ item deleted successfully');
  } catch (err: any) {
    console.error('Delete FAQ error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
