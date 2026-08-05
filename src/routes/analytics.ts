import { Router, Response } from 'express';
import Contact from '../models/Contact';
import DemoRequest from '../models/DemoRequest';
import DealerInquiry from '../models/DealerInquiry';
import CareerApplication from '../models/CareerApplication';
import { protect, AuthenticatedRequest } from '../middleware/auth';
import { success, error } from '../utils/apiResponse';

const router = Router();

// @route   GET /api/analytics/overview
// @desc    Get total leads, demos, career apps, and status indicators
// @access  Protected
router.get('/overview', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalContacts = await Contact.countDocuments();
    const totalDemos = await DemoRequest.countDocuments();
    const totalDealers = await DealerInquiry.countDocuments();
    const totalCareers = await CareerApplication.countDocuments();

    // Active leads (new/pending)
    const activeContacts = await Contact.countDocuments({ status: { $in: ['new', 'called'] } });
    const activeDemos = await DemoRequest.countDocuments({ status: { $in: ['pending', 'scheduled'] } });
    const activeDealers = await DealerInquiry.countDocuments({ status: 'new' });

    // Conversion Calculation (Status: converted or approved)
    const convertedContacts = await Contact.countDocuments({ status: 'converted' });
    const approvedDealers = await DealerInquiry.countDocuments({ status: 'approved' });
    const completedDemos = await DemoRequest.countDocuments({ status: 'completed' });

    const totalLeads = totalContacts + totalDemos + totalDealers;
    const activeLeads = activeContacts + activeDemos + activeDealers;
    const totalConversions = convertedContacts + approvedDealers + completedDemos;

    const conversionRate = totalLeads > 0 ? Math.round((totalConversions / totalLeads) * 100) : 0;

    return success(res, {
      totalLeads,
      activeLeads,
      totalContacts,
      totalDemos,
      totalDealers,
      totalCareers,
      conversionRate: `${conversionRate}%`,
      avgResponseTime: '2.4 hours',
    });
  } catch (err: any) {
    console.error('Analytics overview error:', err);
    return error(res, 'Server error calculating analytics', 500);
  }
});

// @route   GET /api/analytics/leads-by-month
// @desc    Get monthly lead count history (past 6 months)
// @access  Protected
router.get('/leads-by-month', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const matchQuery = { createdAt: { $gte: sixMonthsAgo } };

    const contactGroup = await Contact.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    const demoGroup = await DemoRequest.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format results to month labels
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: { [key: string]: { contacts: number; demos: number; total: number } } = {};

    // Initialize past 6 months
    const dateCursor = new Date(sixMonthsAgo);
    for (let i = 0; i < 6; i++) {
      const key = `${monthNames[dateCursor.getMonth()]} ${dateCursor.getFullYear().toString().substring(2)}`;
      monthlyData[key] = { contacts: 0, demos: 0, total: 0 };
      dateCursor.setMonth(dateCursor.getMonth() + 1);
    }

    contactGroup.forEach(item => {
      const key = `${monthNames[item._id.month - 1]} ${item._id.year.toString().substring(2)}`;
      if (monthlyData[key]) {
        monthlyData[key].contacts = item.count;
        monthlyData[key].total += item.count;
      }
    });

    demoGroup.forEach(item => {
      const key = `${monthNames[item._id.month - 1]} ${item._id.year.toString().substring(2)}`;
      if (monthlyData[key]) {
        monthlyData[key].demos = item.count;
        monthlyData[key].total += item.count;
      }
    });

    const formattedList = Object.keys(monthlyData).map(monthLabel => ({
      month: monthLabel,
      contacts: monthlyData[monthLabel].contacts,
      demos: monthlyData[monthLabel].demos,
      total: monthlyData[monthLabel].total,
    }));

    return success(res, formattedList);
  } catch (err: any) {
    console.error('Analytics leads by month error:', err);
    return error(res, 'Server error', 500);
  }
});

// @route   GET /api/analytics/leads-by-type
// @desc    Breakdown leads by inquiryType
// @access  Protected
router.get('/leads-by-type', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contactBreakdown = await Contact.aggregate([
      {
        $group: {
          _id: '$inquiryType',
          count: { $sum: 1 }
        }
      }
    ]);

    const formatted = contactBreakdown.map(item => ({
      type: item._id,
      count: item.count
    }));

    // Add demo count
    const demoCount = await DemoRequest.countDocuments();
    formatted.push({ type: 'demo', count: demoCount });

    // Add dealer inquiry count
    const dealerCount = await DealerInquiry.countDocuments();
    formatted.push({ type: 'dealer_inquiry', count: dealerCount });

    return success(res, formatted);
  } catch (err: any) {
    console.error('Analytics leads by type error:', err);
    return error(res, 'Server error', 500);
  }
});

export default router;
