import { Router, Response } from 'express';
import SiteStat from '../models/SiteStat';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { success, error } from '../utils/apiResponse';

const router = Router();

// @route   GET /api/stats
// @desc    Get all site stats
// @access  Public
router.get('/', async (req: any, res: Response) => {
  try {
    const stats = await SiteStat.find().sort({ sortOrder: 1 });
    return success(res, stats);
  } catch (err: any) {
    console.error('Fetch stats error:', err);
    return error(res, 'Server error fetching stats', 500);
  }
});

// @route   POST /api/stats
// @desc    Create a new site stat counter
// @access  Protected
router.post('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, number, labelEn, labelMr } = req.body;

    if (!key || number === undefined || !labelEn || !labelMr) {
      return error(res, 'Key, Number, Label (EN), and Label (MR) are required', 400);
    }

    // Check unique key
    const exists = await SiteStat.findOne({ key });
    if (exists) {
      return error(res, `Stat key '${key}' already exists`, 400);
    }

    const newStat = new SiteStat(req.body);
    await newStat.save();

    return success(res, newStat, 'Stat counter created successfully', 201);
  } catch (err: any) {
    console.error('Create stat error:', err);
    return error(res, 'Server error creating stat counter', 500);
  }
});

// @route   PUT /api/stats/:key
// @desc    Update a stat counter by key or by ID
// @access  Protected
router.put('/:key', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    
    // Find by key first, fallback to ID
    let stat = await SiteStat.findOne({ key });
    if (!stat) {
      // Try ID match
      try {
        stat = await SiteStat.findById(key);
      } catch (err) {
        // Not a valid object ID, ignore
      }
    }

    if (!stat) {
      return error(res, 'Stat counter not found', 404);
    }

    Object.assign(stat, req.body);
    await stat.save();

    return success(res, stat, 'Stat counter updated successfully');
  } catch (err: any) {
    console.error('Update stat error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/stats/:id
// @desc    Delete a stat counter by ID
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stat = await SiteStat.findByIdAndDelete(req.params.id);
    if (!stat) {
      return error(res, 'Stat counter not found', 404);
    }
    return success(res, null, 'Stat counter deleted successfully');
  } catch (err: any) {
    console.error('Delete stat error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
