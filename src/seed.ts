import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Import config and models
import connectDB from './config/db';
import AdminUser from './models/AdminUser';
import Contact from './models/Contact';
import DemoRequest from './models/DemoRequest';
import DealerInquiry from './models/DealerInquiry';
import CareerApplication from './models/CareerApplication';
import NewsletterSubscriber from './models/NewsletterSubscriber';
import BlogPost from './models/BlogPost';
import Testimonial from './models/Testimonial';
import FaqItem from './models/FaqItem';
import TeamMember from './models/TeamMember';
import ClientLogo from './models/ClientLogo';
import SiteStat from './models/SiteStat';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await AdminUser.deleteMany({});
    await Contact.deleteMany({});
    await DemoRequest.deleteMany({});
    await DealerInquiry.deleteMany({});
    await CareerApplication.deleteMany({});
    await NewsletterSubscriber.deleteMany({});
    await BlogPost.deleteMany({});
    await Testimonial.deleteMany({});
    await FaqItem.deleteMany({});
    await TeamMember.deleteMany({});
    await ClientLogo.deleteMany({});
    await SiteStat.deleteMany({});
    console.log('🧹 Database cleared.');

    // 1. Seed Admin User
    console.log('🔑 Seeding Super Admin User...');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('admin', salt);
    
    const adminUser = new AdminUser({
      username: 'admin',
      email: 'admin@winsoft.com',
      passwordHash,
      role: 'superadmin',
      active: true,
    });
    await adminUser.save();
    console.log('✅ Admin user created: admin@winsoft.com / admin');

    // 2. Seed Contact Submissions
    console.log('📋 Seeding Contact Submissions...');
    const contacts = [
      {
        name: 'Abhishek Chougale',
        email: 'abhishekchougale038@gmail.com',
        phone: '+91 9423039902',
        company: 'Chougale Technologies',
        inquiryType: 'dealer',
        message: 'Interested in registering as an authorized dealer for Kolhapur region.',
        source: 'dealer_inquiry',
        status: 'new',
        language: 'en',
      },
      {
        name: 'Amit Deshmukh',
        email: 'amit@example.com',
        phone: '+91 7777777777',
        company: 'Krishna Sugar Mills',
        inquiryType: 'sugar',
        message: 'Need a quote for ERP integration for sugar factory crushing cycles.',
        source: 'contact_page',
        status: 'called',
        language: 'mr',
      },
    ];
    await Contact.insertMany(contacts);

    // 3. Seed Demo Requests
    console.log('📅 Seeding Demo Requests...');
    const demoRequests = [
      {
        name: 'Priya Patil',
        email: 'priya@example.com',
        phone: '+91 8888888888',
        company: 'Patil Jewellery House',
        industry: 'gold',
        currentChallenges: 'Looking for a system to track gold inventory across 3 retail outlets in Sangli.',
        preferredDate: '2026-08-10',
        preferredTime: '11:00',
        status: 'scheduled',
        notes: 'Assigned to sales manager Suresh Patil.',
      },
    ];
    await DemoRequest.insertMany(demoRequests);

    // 4. Seed Dealer Inquiries
    console.log('🤝 Seeding Dealer Inquiries...');
    const dealerInquiries = [
      {
        name: 'Suresh Patil',
        businessName: 'Patil Agro & Dairy Services',
        phone: '+91 9876543210',
        email: 'suresh.patil@example.com',
        address: 'Main Road, Sangli',
        status: 'approved',
        notes: 'Approved partner. Target set to 5 software units.',
      },
      {
        name: 'Mahesh Deshmukh',
        businessName: 'Deshmukh Software Agency',
        phone: '+91 8888888888',
        email: 'mahesh@example.com',
        address: 'Shivaji Nagar, Pune',
        status: 'under_review',
      },
    ];
    await DealerInquiry.insertMany(dealerInquiries);

    // 5. Seed Career Applications
    console.log('💼 Seeding Career Applications...');
    const careerApplications = [
      {
        name: 'Rohan Shinde',
        email: 'rohan.shinde@example.com',
        phone: '9876543222',
        position: 'React Frontend Developer',
        resumeUrl: 'http://localhost:5000/uploads/sample-resume.pdf',
        resumePublicId: 'sample-resume.pdf',
        resumeOriginalName: 'Rohan_Resume_2026.pdf',
        message: 'I have 3 years of experience in React and Next.js. I would love to join your Kolhapur office.',
        status: 'pending',
      },
    ];
    await CareerApplication.insertMany(careerApplications);

    // 6. Seed Newsletter Subscribers
    console.log('📧 Seeding Newsletter Subscribers...');
    const subscribers = [
      {
        email: 'news-reader@example.com',
        language: 'en',
        status: 'active',
        source: 'blog_page',
      },
    ];
    await NewsletterSubscriber.insertMany(subscribers);

    // 7. Seed Blog Posts
    console.log('📝 Seeding Blog Posts...');
    const blogs = [
      {
        slug: 'dairy-cooperative-digitization-amcs',
        title: 'Digitizing Dairy Cooperatives: The Role of AMCS Software',
        titleMr: 'दुग्ध सहकारी संस्थांचे संगणकीकरण: AMCS सॉफ्टवेअरचे महत्त्व',
        excerpt: 'How Automated Milk Collection Systems (AMCS) are bringing transparency and speed to local rural dairies.',
        excerptMr: 'ऑटोमेटेड मिल्क कलेक्शन सिस्टीम्स ग्रामीण भागात दूध संकलनात कशी पारदर्शकता आणि वेग आणत आहेत.',
        content: '<p>Milk collection has traditionally been a manual process subject to fat errors. Implementing AMCS software integrates milk testers directly with digital weighing scales...</p>',
        author: 'Technical Team',
        category: 'dairy',
        readTime: '6 min read',
        image: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=600',
        featured: true,
        published: true,
        publishedAt: new Date(),
        tags: ['dairy', 'technology', 'rural'],
      },
    ];
    await BlogPost.insertMany(blogs);

    // 8. Seed Testimonials
    console.log('⭐ Seeding Testimonials...');
    const testimonials = [
      {
        name: 'Babasaheb Mane',
        role: 'Chairman',
        company: 'Vardhaman Dudh Sangh',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        rating: 5,
        review: 'विन्सॉफ्टच्या डेअरी सॉफ्टवेअरमुळे आमच्या दूध संकलन केंद्रात मोठी सुधारणा झाली आहे. शेतकऱ्यांचा विश्वास वाढला आहे.',
        reviewEn: 'Winsoft’s dairy software has vastly improved our milk collection center. Farmer trust has gone up significantly.',
        industry: 'dairy',
        featured: true,
        sortOrder: 1,
      },
    ];
    await Testimonial.insertMany(testimonials);

    // 9. Seed FAQs
    console.log('❓ Seeding FAQs...');
    const faqs = [
      {
        category: 'Dairy',
        categoryMr: 'डेअरी सॉफ्टवेअर',
        question: 'Does the AMCS software support fat testing machine integrations?',
        questionEn: 'Does the AMCS software support fat testing machine integrations?',
        answer: 'होय, विन्सॉफ्ट डेअरी सॉफ्टवेअर सर्व प्रमुख फॅट टेस्टिंग आणि वजन मोजण्याच्या मशिन्सशी थेट जोडले जाऊ शकते.',
        answerEn: 'Yes, Winsoft Dairy Software supports direct integration with all major fat testing and weighing scale machines.',
        sortOrder: 1,
        published: true,
      },
    ];
    await FaqItem.insertMany(faqs);

    // 10. Seed Team Members
    console.log('👥 Seeding Team Members...');
    const team = [
      {
        name: 'Mr. Arvind Patil',
        designation: 'Managing Director',
        department: 'Executive',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
        linkedin: 'https://linkedin.com/in/arvind-patil',
        bio: 'Leading technological expansions in agricultural and industrial ERP software.',
        sortOrder: 1,
      },
    ];
    await TeamMember.insertMany(team);

    // 11. Seed Client Logos
    console.log('🏢 Seeding Client Logos...');
    const clients = [
      {
        name: 'Gokul Dairy',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100',
        website: 'https://gokulmilk.coop',
        industry: 'dairy',
        sortOrder: 1,
      },
    ];
    await ClientLogo.insertMany(clients);

    // 12. Seed Site Stats
    console.log('📊 Seeding Site Stats...');
    const stats = [
      {
        key: 'happy_clients',
        number: 1200,
        suffix: '+',
        labelEn: 'Happy Clients',
        labelMr: 'आनंदी ग्राहक',
        emoji: '😊',
        sortOrder: 1,
      },
      {
        key: 'years_experience',
        number: 18,
        suffix: '+',
        labelEn: 'Years Experience',
        labelMr: 'वर्षांचा अनुभव',
        emoji: '⏳',
        sortOrder: 2,
      },
    ];
    await SiteStat.insertMany(stats);

    console.log('🌱 Seeding process complete! Database seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

seedData();
