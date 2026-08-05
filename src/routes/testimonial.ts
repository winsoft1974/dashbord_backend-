import { Router, Response } from 'express';
import Testimonial from '../models/Testimonial';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { success, error } from '../utils/apiResponse';

const router = Router();

// @route   GET /api/testimonials
// @desc    Get active testimonials
// @access  Public
router.get('/', async (req: any, res: Response) => {
  try {
    const query: any = {};
    
    // Admins can see hidden reviews
    const isPublic = req.query.view !== 'admin';
    if (isPublic) {
      query.featured = true;
    }

    if (req.query.industry) {
      query.industry = req.query.industry;
    }

    const testimonials = await Testimonial.find(query).sort({ sortOrder: 1, createdAt: -1 });
    return success(res, testimonials);
  } catch (err: any) {
    console.error('Fetch testimonials error:', err);
    return error(res, 'Server error fetching testimonials', 500);
  }
});

// @route   POST /api/testimonials
// @desc    Create a testimonial
// @access  Protected
router.post('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, role, company, rating, review, reviewEn, industry } = req.body;

    if (!name || !role || !company || !rating || !review || !reviewEn || !industry) {
      return error(res, 'All fields are required', 400);
    }

    const newTestimonial = new Testimonial(req.body);
    await newTestimonial.save();

    return success(res, newTestimonial, 'Testimonial created successfully', 201);
  } catch (err: any) {
    console.error('Create testimonial error:', err);
    return error(res, 'Server error creating testimonial', 500);
  }
});

// @route   PUT /api/testimonials/:id
// @desc    Update a testimonial
// @access  Protected
router.put('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return error(res, 'Testimonial not found', 404);
    }

    return success(res, testimonial, 'Testimonial updated successfully');
  } catch (err: any) {
    console.error('Update testimonial error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/testimonials/:id
// @desc    Delete a testimonial
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) {
      return error(res, 'Testimonial not found', 404);
    }
    return success(res, null, 'Testimonial deleted successfully');
  } catch (err: any) {
    console.error('Delete testimonial error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
