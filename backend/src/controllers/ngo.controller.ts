import { Request, Response } from 'express';
import NGO from '../models/NGO';
import User from '../models/User';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { cloudinaryService } from '../services/cloudinary.service';
import { emailService } from '../services/email.service';

export const ngoController = {
  // Public - Get verified NGOs for public directory
  getNGOs: async (req: Request, res: Response) => {
    try {
      const {
        search,
        state,
        city,
        category,
        verificationStatus = 'verified',
        sortBy = 'newest',
        limit = '20',
        cursor,
      } = req.query;

      const query: any = {};

      // In public view, filter by verified unless explicitly specified by admin/public
      query.verificationStatus = verificationStatus;

      if (state) query['location.state'] = state;
      if (city) query['location.city'] = city;
      if (category) query.categories = category;

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { mission: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { registrationNumber: { $regex: search, $options: 'i' } },
        ];
      }

      if (cursor) {
        if (sortBy === 'newest') {
          query._id = { $lt: cursor };
        }
      }

      let sortOptions: any = { createdAt: -1 };
      if (sortBy === 'mostDonations') {
        sortOptions = { 'stats.fundsRaised': -1, _id: -1 };
      } else if (sortBy === 'highestRated') {
        sortOptions = { 'stats.rating': -1, _id: -1 };
      }

      const ngos = await NGO.find(query)
        .sort(sortOptions)
        .limit(Number(limit))
        .populate('creator', 'name avatar email');

      const nextCursor = ngos.length > 0 ? ngos[ngos.length - 1]._id : null;
      const total = await NGO.countDocuments(query);

      res.status(200).json({
        success: true,
        data: ngos,
        nextCursor,
        total,
      });
    } catch (error) {
      logger.error({ error }, 'Error fetching NGOs');
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Public - Get single NGO profile by ID
  getNGOById: async (req: Request, res: Response) => {
    try {
      const ngo = await NGO.findById(req.params.id).populate('creator', 'name avatar email');

      if (!ngo) {
        return res.status(404).json({ success: false, message: 'NGO not found' });
      }

      res.status(200).json({ success: true, data: ngo });
    } catch (error) {
      logger.error({ error }, 'Error fetching NGO details');
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Protected - Get current user's NGO application
  getMyNGO: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const ngo = await NGO.findOne({ creator: userId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: ngo,
      });
    } catch (error) {
      logger.error({ error }, 'Error fetching user NGO status');
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Protected - Register a new NGO application (Supports JSON + File Buffers)
  registerNGO: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // Check if user already submitted an active application
      const existingUserNGO = await NGO.findOne({ creator: userId });
      if (existingUserNGO && existingUserNGO.verificationStatus !== 'rejected') {
        return res.status(400).json({
          success: false,
          message: `You already have an active NGO registration (Status: ${existingUserNGO.verificationStatus}).`,
          data: existingUserNGO,
        });
      }

      const bodyData = typeof req.body.payload === 'string' ? JSON.parse(req.body.payload) : req.body;

      // Duplicate checks: Registration Number, PAN, Email
      const duplicateReg = await NGO.findOne({ registrationNumber: bodyData.registrationNumber });
      if (duplicateReg) {
        return res.status(400).json({
          success: false,
          message: 'An NGO with this Registration Number already exists.',
        });
      }

      const duplicatePan = await NGO.findOne({ panNumber: bodyData.panNumber });
      if (duplicatePan) {
        return res.status(400).json({
          success: false,
          message: 'An NGO with this PAN Number already exists.',
        });
      }

      const duplicateEmail = await NGO.findOne({ 'contactDetails.email': bodyData.contactDetails?.email });
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: 'An NGO with this official email address already exists.',
        });
      }

      // Handle file uploads if sent via Multer req.files
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedDocUrls: Record<string, string> = { ...(bodyData.documents || {}) };

      if (files) {
        for (const [fieldname, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray.length > 0) {
            const file = fileArray[0];
            const url = await cloudinaryService.uploadBuffer(file.buffer, file.mimetype, 'ngos/documents');
            uploadedDocUrls[fieldname] = url;
          }
        }
      }

      const logoUrl = uploadedDocUrls.logo || bodyData.logo || 'https://placehold.co/400x400/10b981/ffffff?text=NGO+Logo';
      const coverUrl = uploadedDocUrls.coverImage || bodyData.banner || 'https://placehold.co/1200x400/0f172a/ffffff?text=NGO+Cover';

      const ngoPayload = {
        ...bodyData,
        creator: userId,
        logo: logoUrl,
        banner: coverUrl,
        documents: {
          registrationCertificate: uploadedDocUrls.registrationCertificate || bodyData.documents?.registrationCertificate,
          panCard: uploadedDocUrls.panCard || bodyData.documents?.panCard,
          certificate12A: uploadedDocUrls.certificate12A || bodyData.documents?.certificate12A,
          certificate80G: uploadedDocUrls.certificate80G || bodyData.documents?.certificate80G,
          addressProof: uploadedDocUrls.addressProof || bodyData.documents?.addressProof,
          representativeIdProof: uploadedDocUrls.representativeIdProof || bodyData.documents?.representativeIdProof,
          representativePhoto: uploadedDocUrls.representativePhoto || bodyData.documents?.representativePhoto,
          logo: logoUrl,
          coverImage: coverUrl,
          annualReport: uploadedDocUrls.annualReport || bodyData.documents?.annualReport,
          financialStatement: uploadedDocUrls.financialStatement || bodyData.documents?.financialStatement,
          fcraCertificate: uploadedDocUrls.fcraCertificate || bodyData.documents?.fcraCertificate,
          cancelledChequeUrl: uploadedDocUrls.cancelledChequeUrl || bodyData.bankDetails?.cancelledChequeUrl,
        },
        bankDetails: {
          ...bodyData.bankDetails,
          cancelledChequeUrl: uploadedDocUrls.cancelledChequeUrl || bodyData.bankDetails?.cancelledChequeUrl,
        },
        verificationStatus: 'pending',
        approvalHistory: [
          {
            status: 'pending',
            timestamp: new Date(),
            notes: 'Initial registration submitted by applicant.',
          },
        ],
      };

      const newNGO = await NGO.create(ngoPayload);

      // Update User KYC status to pending
      await User.findByIdAndUpdate(userId, { kycStatus: 'pending' });

      // Trigger Email Notification
      try {
        await emailService.sendNGOApplicationReceived(
          newNGO.contactDetails.email,
          newNGO.name,
          newNGO.representative.fullName
        );
      } catch (err) {
        logger.error({ err }, 'Failed to send NGO application email');
      }

      res.status(201).json({
        success: true,
        data: newNGO,
        message: 'NGO application submitted successfully and is pending verification.',
      });
    } catch (error: any) {
      logger.error({ error }, 'Error registering NGO');
      res.status(500).json({ success: false, message: error.message || 'Server error during NGO registration.' });
    }
  },

  // Protected - Update/Resubmit NGO Application
  updateNGO: async (req: AuthRequest, res: Response) => {
    try {
      const ngo = await NGO.findById(req.params.id);

      if (!ngo) {
        return res.status(404).json({ success: false, message: 'NGO not found' });
      }

      if (ngo.creator.toString() !== req.user?.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this NGO application' });
      }

      const bodyData = typeof req.body.payload === 'string' ? JSON.parse(req.body.payload) : req.body;

      // Handle updated file uploads if present
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const uploadedDocUrls: Record<string, string> = { ...(ngo.documents as any), ...(bodyData.documents || {}) };

      if (files) {
        for (const [fieldname, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray.length > 0) {
            const file = fileArray[0];
            const url = await cloudinaryService.uploadBuffer(file.buffer, file.mimetype, 'ngos/documents');
            uploadedDocUrls[fieldname] = url;
          }
        }
      }

      const updatedHistory = [...(ngo.approvalHistory || [])];
      let newStatus = ngo.verificationStatus;

      // If updating from more_info_required, change status back to pending
      if (ngo.verificationStatus === 'more_info_required' || ngo.verificationStatus === 'rejected') {
        newStatus = 'pending';
        updatedHistory.push({
          status: 'pending',
          timestamp: new Date(),
          notes: 'Applicant updated missing information and resubmitted application.',
        });
      }

      const updatedNGO = await NGO.findByIdAndUpdate(
        req.params.id,
        {
          ...bodyData,
          verificationStatus: newStatus,
          documents: {
            ...ngo.documents,
            ...uploadedDocUrls,
          },
          approvalHistory: updatedHistory,
        },
        { new: true, runValidators: true }
      );

      res.status(200).json({
        success: true,
        data: updatedNGO,
        message: 'NGO application updated and resubmitted for verification.',
      });
    } catch (error: any) {
      logger.error({ error }, 'Error updating NGO');
      res.status(500).json({ success: false, message: error.message || 'Server error updating NGO.' });
    }
  },
};

