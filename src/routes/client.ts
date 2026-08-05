import { Router, Response } from 'express';
import ClientLogo from '../models/ClientLogo';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { success, error } from '../utils/apiResponse';

const router = Router();

// @route   GET /api/clients
// @desc    Get active client logos
// @access  Public
router.get('/', async (req: any, res: Response) => {
  try {
    const query: any = {};
    
    // Admins can see inactive clients
    const isPublic = req.query.view !== 'admin';
    if (isPublic) {
      query.active = true;
    }

    if (req.query.industry) {
      query.industry = req.query.industry;
    }

    const clients = await ClientLogo.find(query).sort({ sortOrder: 1, name: 1 });
    return success(res, clients);
  } catch (err: any) {
    console.error('Fetch clients error:', err);
    return error(res, 'Server error fetching client logos', 500);
  }
});

// @route   POST /api/clients
// @desc    Add a client logo
// @access  Protected
router.post('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, image } = req.body;

    if (!name || !image) {
      return error(res, 'Client Name and Logo Image URL are required', 400);
    }

    const newClient = new ClientLogo(req.body);
    await newClient.save();

    return success(res, newClient, 'Client logo added successfully', 201);
  } catch (err: any) {
    console.error('Create client logo error:', err);
    return error(res, 'Server error adding client logo', 500);
  }
});

// @route   PUT /api/clients/:id
// @desc    Update client logo
// @access  Protected
router.put('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = await ClientLogo.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!client) {
      return error(res, 'Client logo not found', 404);
    }

    return success(res, client, 'Client logo updated successfully');
  } catch (err: any) {
    console.error('Update client logo error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete client logo
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const client = await ClientLogo.findByIdAndDelete(req.params.id);
    if (!client) {
      return error(res, 'Client logo not found', 404);
    }
    return success(res, null, 'Client logo deleted successfully');
  } catch (err: any) {
    console.error('Delete client logo error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
