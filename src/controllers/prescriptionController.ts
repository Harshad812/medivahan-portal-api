import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Prescription from '../models/prescription';
import { Sequelize } from 'sequelize';
import { Op } from 'sequelize';
import multiparty from 'multiparty';
import fs from 'fs';
import { uploadImageBufferToS3 } from '../utils/uploadImageBufferToS3';
import User from '../models/user';

const JWT_SECRET = 'your_jwt_secret';

Prescription.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Prescription, { foreignKey: 'user_id' });

export const prescriptionDetails = async (req: Request, res: Response) => {
  const prescription_id = parseInt(req.params.id, 10);

  try {
    const prescription = await Prescription.findOne({
      include: [
        {
          model: User,
          attributes: ['id', 'firstname', 'lastname', 'commission', 'discount'],
        },
      ],
      where: {
        prescription_id,
      },
    });

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.status(200).json({
      message: 'Prescription details retrieved successfully',
      prescription,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving prescription details',
      error: error.message,
    });
  }
};

export const createPrescription = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).send('Error parsing form');
    }
    if (!files || !files.images || files.images.length === 0) {
      return res.status(400).send('No file uploaded.');
    }
    const { patient_name, mobile, address, city, near_by } = fields;

    try {
      const decodedToken: any = jwt.verify(accessToken, JWT_SECRET);

      const userId = decodedToken.id;
      const uploadedPrescriptions = [];

      for (let i = 0; i < files?.images?.length; i++) {
        const file = files.images[i];
        const { originalFilename, path: filePath } = file;
        const buffer = fs.readFileSync(filePath);
        const uploadedImageUrl = await uploadImageBufferToS3(
          buffer,
          originalFilename
        );
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });

        if (uploadedImageUrl) {
          uploadedPrescriptions?.push(uploadedImageUrl);
        }
      }

      const newPrescription = await Prescription.create({
        patient_name: patient_name[0],
        mobile: mobile[0],
        address: address[0],
        city: city[0],
        near_by: near_by[0],
        prescriptions: uploadedPrescriptions,
        user_id: userId,
      });

      res.status(201).json({
        message: 'Create prescription successfully',
        prescription: newPrescription,
      });
    } catch (error: any) {
      res.status(500).json({
        message: 'Error in create prescription',
        error: error.message,
      });
    }
  });
};

export const updatePrescriptionDetails = async (
  req: Request,
  res: Response
) => {
  const prescription_id = parseInt(req.params.id, 10);

  if (!prescription_id) {
    return res.status(401).json({ message: 'prescription_id is required!' });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    try {
      const prescription = await Prescription.findByPk(prescription_id);

      if (!prescription) {
        return res.status(404).json({ message: 'prescription not found' });
      }

      if (err) {
        return res.status(500).send('Error parsing form');
      }

      const { patient_name, mobile, address, city, near_by, status } = fields;

      const uploadedPrescriptions = [];

      if (files?.images) {
        for (let i = 0; i < files?.images?.length; i++) {
          const file = files.images[i];
          const { originalFilename, path: filePath } = file;
          const buffer = fs.readFileSync(filePath);
          const uploadedImageUrl = await uploadImageBufferToS3(
            buffer,
            originalFilename
          );
          fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
          });

          if (uploadedImageUrl) {
            uploadedPrescriptions?.push(uploadedImageUrl);
          }
        }
        prescription.prescriptions = files?.images?.length
          ? uploadedPrescriptions
          : prescription?.prescriptions;
      }

      prescription.patient_name = patient_name
        ? patient_name[0]
        : prescription?.patient_name;
      prescription.mobile = mobile ? mobile[0] : prescription?.mobile;
      prescription.address = address ? address[0] : prescription?.address;
      prescription.city = city ? city[0] : prescription?.city;
      prescription.near_by = near_by ? near_by[0] : prescription?.near_by;
      prescription.status = status ? status[0] : prescription?.status;

      // Save the updated prescription
      await prescription.save();

      res
        .status(200)
        .json({ message: 'prescription details updated successfully' });
    } catch (error: any) {
      res.status(500).json({
        message: 'Error updating prescription details',
        error: error.message,
      });
    }
  });
};

export const prescriptionList = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decodedToken: any = jwt.verify(accessToken, JWT_SECRET);

    const user_id = decodedToken.id;

    const prescriptions = await Prescription.findAndCountAll({
      where: {
        user_id,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!prescriptions) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const allStatuses = ['received', 'closed', 'delivered', 'decline', 'open'];

    const statusCounts = await Prescription.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('status')), 'count'],
      ],
      group: ['status'],
      where: {
        user_id,
      },
    });

    const result = allStatuses.map((status) => ({
      status,
      count: 0,
    }));

    statusCounts.forEach(({ dataValues }: any) => {
      const index = result.findIndex(
        (item) => item.status === dataValues?.status
      );
      if (index !== -1) {
        result[index].count = parseInt(dataValues?.count, 10);
      }
    });

    res.status(200).json({
      message: 'Prescription details retrieved successfully',
      prescriptions: {
        count: prescriptions.count,
        rows: prescriptions.rows,
        statusCounts: result,
      },
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving prescription details',
      error: error.message,
    });
  }
};

export const getPrescriptionsByFilters = async (
  req: Request,
  res: Response
) => {
  const accessToken = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  // Extract filters from query string
  const { start_date, end_date, pr_id, status, search } = req.query;

  try {
    const decodedToken: any = jwt.verify(accessToken, JWT_SECRET);
    const user_id = decodedToken.id;

    // Build query filters
    const whereClause: any = {
      user_id,
    };

    if (start_date) {
      whereClause.createdAt = {
        [Op.gte]: new Date(`${start_date}T00:00:00Z`),
      }; // Start of the start_date (UTC)
    }

    // Handle when only end_date is provided
    if (end_date) {
      whereClause.createdAt = {
        ...whereClause.createdAt,
        [Op.lte]: new Date(`${end_date}T23:59:59.999Z`), // End of the end_date (UTC with milliseconds)
      };
    }

    if (pr_id) {
      whereClause.pr_id = pr_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      const searchValue = search.toString().trim();

      // Check if the search value contains both characters and numbers
      const hasNumeric = /\d/.test(searchValue);
      const hasAlphabet = /[a-zA-Z]/.test(searchValue);

      if (hasNumeric && hasAlphabet) {
        // If search contains both numeric and alphabetic characters, filter by pr_id
        whereClause.pr_id = {
          [Op.like]: `%${searchValue}%`,
        };
      } else if (hasAlphabet) {
        // If search contains only alphabetic characters, filter by patient_name
        whereClause.patient_name = {
          [Op.like]: `%${searchValue}%`,
        };
      }
    }

    // Fetch prescriptions based on filters
    const prescriptions = await Prescription.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    if (!prescriptions) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    res.status(200).json({
      message: 'Prescription details retrieved successfully',
      prescriptions,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving prescription details',
      error: error.message,
    });
  }
};
