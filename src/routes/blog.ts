import { Router, Response } from 'express';
import BlogPost from '../models/BlogPost';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { success, error } from '../utils/apiResponse';

const router = Router();

// @route   GET /api/blog
// @desc    Get all published blog posts (Public)
// @access  Public
router.get('/', async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    const skip = (page - 1) * limit;

    const query: any = {};
    // Admins can see all drafts, public can only see published posts
    const isPublic = req.query.view !== 'admin';
    if (isPublic) {
      query.published = true;
    }

    if (req.query.category) {
      query.category = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      query.$or = [
        { title: searchRegex },
        { titleMr: searchRegex },
        { excerpt: searchRegex },
        { content: searchRegex }
      ];
    }

    const posts = await BlogPost.find(query)
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BlogPost.countDocuments(query);

    return success(res, {
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err: any) {
    console.error('Fetch blogs error:', err);
    return error(res, 'Server error fetching blog posts', 500);
  }
});

// @route   GET /api/blog/:slug
// @desc    Get single blog post by slug
// @access  Public
router.get('/:slug', async (req: any, res: Response) => {
  try {
    const post = await BlogPost.findOne({ slug: req.params.slug });
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }
    return success(res, post);
  } catch (err: any) {
    console.error('Fetch blog slug error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   POST /api/blog
// @desc    Create a blog post
// @access  Protected
router.post('/', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug, title } = req.body;

    if (!slug || !title) {
      return error(res, 'Slug and Title are required', 400);
    }

    // Check slug uniqueness
    const exists = await BlogPost.findOne({ slug });
    if (exists) {
      return error(res, 'Slug already exists, must be unique', 400);
    }

    const newPost = new BlogPost({
      ...req.body,
      publishedAt: req.body.published ? new Date() : null,
    });
    
    await newPost.save();
    return success(res, newPost, 'Blog post created successfully', 201);
  } catch (err: any) {
    console.error('Create blog error:', err);
    return error(res, 'Server error creating blog post', 500);
  }
});

// @route   PUT /api/blog/:id
// @desc    Update a blog post
// @access  Protected
router.put('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }

    // Check slug uniqueness if changed
    if (req.body.slug && req.body.slug !== post.slug) {
      const exists = await BlogPost.findOne({ slug: req.body.slug });
      if (exists) {
        return error(res, 'New slug already exists', 400);
      }
    }

    // Manage publish date transitions
    if (req.body.published !== undefined) {
      if (req.body.published && !post.published) {
        post.publishedAt = new Date();
      } else if (!req.body.published) {
        post.publishedAt = null;
      }
    }

    Object.assign(post, req.body);
    await post.save();

    return success(res, post, 'Blog post updated successfully');
  } catch (err: any) {
    console.error('Update blog error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   PUT /api/blog/:id/publish
// @desc    Toggle publish status
// @access  Protected
router.put('/:id/publish', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }

    post.published = !post.published;
    post.publishedAt = post.published ? new Date() : null;
    await post.save();

    return success(res, post, `Blog post ${post.published ? 'published' : 'unpublished'} successfully`);
  } catch (err: any) {
    console.error('Toggle publish error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/blog/:id
// @desc    Delete a blog post
// @access  Protected
router.delete('/:id', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }
    return success(res, null, 'Blog post deleted successfully');
  } catch (err: any) {
    console.error('Delete blog error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
