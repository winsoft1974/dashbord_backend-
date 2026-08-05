import { Router, Response } from 'express';
import TeamMember from '../models/TeamMember';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { success, error } from '../utils/apiResponse';

const router = Router();

// @route   GET /api/team
// @desc    Get active team members
// @access  Public
router.get('/', async (req: any, res: Response) => {
  try {
    const query: any = {};
    
    // Admins can see inactive members
    const isPublic = req.query.view !== 'admin';
    if (isPublic) {
      query.active = true;
    }

    const team = await TeamMember.find(query).sort({ sortOrder: 1, name: 1 });
    return success(res, team);
  } catch (err: any) {
    console.error('Fetch team error:', err);
    return error(res, 'Server error fetching team members', 500);
  }
});

// @route   POST /api/team
// @desc    Add a team member
// @access  Protected
router.post('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, designation, department, image } = req.body;

    if (!name || !designation || !department || !image) {
      return error(res, 'Name, Designation, Department, and Image URL are required', 400);
    }

    const newMember = new TeamMember(req.body);
    await newMember.save();

    return success(res, newMember, 'Team member added successfully', 201);
  } catch (err: any) {
    console.error('Create team member error:', err);
    return error(res, 'Server error adding team member', 500);
  }
});

// @route   PUT /api/team/:id
// @desc    Update a team member
// @access  Protected
router.put('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const member = await TeamMember.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!member) {
      return error(res, 'Team member not found', 404);
    }

    return success(res, member, 'Team member updated successfully');
  } catch (err: any) {
    console.error('Update team member error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/team/:id
// @desc    Delete a team member
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const member = await TeamMember.findByIdAndDelete(req.params.id);
    if (!member) {
      return error(res, 'Team member not found', 404);
    }
    return success(res, null, 'Team member deleted successfully');
  } catch (err: any) {
    console.error('Delete team member error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
