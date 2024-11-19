import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Prescription from '../models/prescription';
import { Sequelize } from 'sequelize';
import { Op } from 'sequelize';
import multiparty from 'multiparty';
import fs from 'fs';
import { uploadImageBufferToS3 } from '../utils/uploadImageBufferToS3';
import User from '../models/user';
import Bill from '../models/bill';
import sequelize from 'sequelize';
import { createNotification } from '../utils/notificationUtil';
import DeliveryBoy from '../models/delivery_boy';

const JWT_SECRET = 'your_jwt_secret';

Prescription.belongsTo(User, { foreignKey: 'user_id' });
Prescription.belongsTo(Bill, { foreignKey: 'bill_id' });
Prescription.belongsTo(DeliveryBoy, { foreignKey: 'deliveryboy_id' });
User.hasMany(Prescription, { foreignKey: 'user_id' });
Bill.hasMany(Prescription, { foreignKey: 'bill_id' });
DeliveryBoy.hasMany(Prescription, { foreignKey: 'deliveryboy_id' });

export const prescriptionDetails = async (req: Request, res: Response) => {
  const prescription_id = parseInt(req.params.id, 10);

  try {
    const prescription = await Prescription.findOne({
      include: [
        {
          model: User,
          attributes: ['id', 'firstname', 'lastname', 'commission', 'discount'],
        },
        {
          model: Bill,
          attributes: ['bill_id', 'bill_number', 'total_bill', 'bills'],
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

      if (newPrescription) {
        await createNotification(
          'New prescription added',
          newPrescription.user_id,
          res
        );
      }

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

    const allStatuses = ['received', 'closed', 'delivered', 'declined', 'open'];

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

//Dashboard

export const getAllPrescription = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      filter = '',
    } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const searchCondition: any = {
      [Op.and]: [],
    };

    if (search) {
      searchCondition[Op.and].push({
        [Op.or]: [
          { patient_name: { [Op.like]: `%${search}%` } },
          { mobile: { [Op.like]: `%${search}%` } },
          {
            '$User.firstname$': { [Op.like]: `%${search}%` },
          },
          {
            '$User.lastname$': { [Op.like]: `%${search}%` },
          },
        ],
      });
    }

    if (status) {
      if (status !== 'all') {
        searchCondition[Op.and].push({
          status: status,
        });
      }
    }

    let order: any[] = [['updatedAt', 'DESC']]; // Default to sorting by last update (newest first)

    switch (filter) {
      case 'today':
        order = [['createdAt', 'DESC']]; // Sort by creation date for today (most recent first)
        searchCondition[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
            [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
          },
        });
        break;
      case 'last_7_days':
        order = [['createdAt', 'DESC']]; // Sort by creation date (most recent first)
        searchCondition[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
          },
        });
        break;
      case 'last_15_days':
        order = [['createdAt', 'DESC']]; // Sort by creation date (most recent first)
        searchCondition[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 15)), // Last 15 days
          },
        });
        break;
      case 'last_update':
        order = [['updatedAt', 'DESC']]; // Sort by last update (most recent first)
        break;
      default:
        order = [['createdAt', 'DESC']]; // Default sort
    }

    const prescription = await Prescription.findAndCountAll({
      attributes: [
        'prescription_id',
        'pr_id',
        'patient_name',
        'mobile',
        'status',
        'createdAt',
      ],
      where: searchCondition[Op.and].length ? searchCondition : {},
      include: [
        {
          model: User,
          attributes: ['firstname', 'lastname'],
        },
      ],
      limit: Number(limit),
      offset: offset,
      order: order,
    });

    if (!prescription) {
      return res.status(404).json({ message: 'prescription not found' });
    }

    const totalPages = Math.ceil(prescription.count / Number(limit));

    res.status(200).json({
      message: 'prescription list retrieved successfully',
      prescription: prescription.rows,
      count: prescription.count,
      currentPage: Number(page),
      totalPages: totalPages,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving prescription list',
      error: error.message,
    });
  }
};

export const updatePrescriptionStatus = async (req: Request, res: Response) => {
  const { ids, status } = req.body; // Extract ids and status from request body

  if (!Array.isArray(ids) || ids.length === 0 || !status) {
    return res.status(400).json({
      message: 'Invalid request. Please provide an array of IDs and a status.',
    });
  }

  try {
    const [updatedCount] = await Prescription.update(
      { status },
      { where: { prescription_id: ids } }
    );

    if (updatedCount === 0) {
      return res
        .status(404)
        .json({ message: 'No prescriptions found with the provided IDs.' });
    }

    res.status(200).json({
      message: `${updatedCount} prescription(s) updated successfully.`,
      updatedCount,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error updating prescription status',
      error: error.message,
    });
  }
};

export const createBillAndUpdatePrescription = async (
  req: Request,
  res: Response
) => {
  const prescription_id = parseInt(req.params.prescription_id, 10);

  if (!prescription_id) {
    return res.status(400).json({ message: 'Prescription ID is required!' });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).send('Error parsing form');
    }

    try {
      const prescription = await Prescription.findByPk(prescription_id);
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }

      const { bill_number, total_bill, deliveryboy_id } = fields;
      const uploadedBills = [];

      if (files?.bills) {
        for (const file of files.bills) {
          // console.log('file', file);
          const buffer = fs.readFileSync(file.path);
          const uploadedBillUrl = await uploadImageBufferToS3(
            buffer,
            file.originalFilename
          );
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });

          console.log('uploadedBillUrl', uploadedBillUrl);
          if (uploadedBillUrl) uploadedBills.push(uploadedBillUrl);
        }
      }

      // Check if a bill already exists for the prescription
      let bill = await Bill.findOne({ where: { prescription_id } });

      if (bill) {
        // Update existing bill
        bill.bill_number = bill_number[0];
        bill.total_bill = parseFloat(total_bill[0]);
        bill.bills = uploadedBills.length ? uploadedBills : bill.bills; // Preserve existing files if none are uploaded
        await bill.save();
      } else {
        // Create a new bill if none exists
        bill = await Bill.create({
          user_id: prescription?.user_id,
          prescription_id: prescription?.prescription_id,
          bill_number: bill_number[0],
          total_bill: parseFloat(total_bill[0]),
          bills: uploadedBills.length ? uploadedBills : [],
        });
      }

      prescription.bill_id = bill.bill_id;
      prescription.deliveryboy_id =
        deliveryboy_id || prescription.deliveryboy_id;
      prescription.status = 'dispatch';
      await prescription.save();

      res.status(200).json({
        message:
          'Bill updated (or created) and prescription updated successfully',
        bill,
        prescription,
      });
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json({ message: 'Internal server error', error: error.message });
    }
  });
};

const possibleStatuses = [
  'open',
  'preparing',
  'declined',
  'dispatch',
  'delivered',
  'return',
  'closed',
];

export const getPrescriptionStatusCount = async (
  req: Request,
  res: Response
) => {
  try {
    const statusCounts = await Prescription.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count'],
      ],
      group: 'status',
    });

    const statusCountMap: { [key: string]: number } = {};

    statusCounts.forEach((item: any) => {
      statusCountMap[item.status] = item.getDataValue('count');
    });

    const result = possibleStatuses.map((status) => ({
      status,
      count: statusCountMap[status] || 0,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching prescription status count:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPrescriptionStatusCountByDoctor = async (
  req: Request,
  res: Response
) => {
  const user_id = parseInt(req.params.user_id, 10);
  try {
    const statusCounts = await Prescription.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count'],
      ],
      where: { user_id },
      group: 'status',
    });

    const statusCountMap: { [key: string]: number } = {};

    statusCounts.forEach((item: any) => {
      statusCountMap[item.status] = item.getDataValue('count');
    });

    const result = possibleStatuses.map((status) => ({
      status,
      count: statusCountMap[status] || 0,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching prescription status count:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPrescriptionByDeliveryBoy = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      filter = '',
      d_id = '', // Add user_id to query params
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const searchCondition: any = {
      [Op.and]: [],
    };

    // Search conditions
    if (search) {
      searchCondition[Op.and].push({
        [Op.or]: [
          { patient_name: { [Op.like]: `%${search}%` } },
          { mobile: { [Op.like]: `%${search}%` } },
          {
            '$User.firstname$': { [Op.like]: `%${search}%` },
          },
          {
            '$User.lastname$': { [Op.like]: `%${search}%` },
          },
          {
            '$Bill.bill_number$': { [Op.like]: `%${search}%` },
          },
        ],
      });
    }

    // Status filter
    if (status && status !== 'all') {
      searchCondition[Op.and].push({ status });
    }

    if (d_id) {
      searchCondition[Op.and].push({ deliveryboy_id: d_id });
    }

    let order: any[] = [['createdAt', 'DESC']]; // Default sorting by last update

    // Filter conditions
    switch (filter) {
      case 'today':
        order = [['createdAt', 'DESC']];
        searchCondition[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
            [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
          },
        });
        break;
      case 'last_7_days':
        searchCondition[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
          },
        });
        break;
      case 'last_15_days':
        searchCondition[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 15)), // Last 15 days
          },
        });
        break;
      case 'last_update':
        break; // No need to change order
      default:
        break; // Default sort
    }

    const prescription = await Prescription.findAndCountAll({
      attributes: [
        'prescription_id',
        'pr_id',
        'patient_name',
        'mobile',
        'address',
        'status',
        'createdAt',
      ],
      where: searchCondition[Op.and].length ? searchCondition : {},
      include: [
        {
          model: User,
          attributes: ['firstname', 'lastname', 'discount', 'commission'],
        },
        {
          model: Bill,
          attributes: ['bill_number', 'total_bill'],
        },
      ],
      limit: Number(limit),
      offset: offset,
      order: order,
    });

    if (!prescription || prescription.count === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Calculate total discount and commission for each prescription
    const prescriptionData = prescription.rows.map((item: any) => {
      const totalBill = item?.Bill?.total_bill ?? 0; // Fetch total_bill
      const discountPercent = item?.User?.discount ?? 10; // Fetch discount
      const commissionPercent = item?.User?.commission ?? 10; // Fetch commission

      const discountAmount = (totalBill * (discountPercent / 100)).toFixed(2); // Calculate discount amount
      const commissionAmount = (totalBill * (commissionPercent / 100)).toFixed(
        2
      ); // Calculate commission amount

      return {
        ...item.toJSON(), // Spread the existing item data
        discountAmount: Number(discountAmount), // Add calculated discount amount
        commissionAmount: Number(commissionAmount), // Add calculated commission amount
      };
    });

    const totalPages = Math.ceil(prescription.count / Number(limit));

    res.status(200).json({
      message: 'Prescription list retrieved successfully',
      prescription: prescriptionData, // Use the modified prescription data with calculated amounts
      count: prescription.count,
      currentPage: Number(page),
      totalPages: totalPages,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving prescription list',
      error: error.message,
    });
  }
};

export const getPrescriptionStatusCountByDeliveryBoy = async (
  req: Request,
  res: Response
) => {
  const deliveryboy_id = parseInt(req.params.d_id, 10);
  try {
    const statusCounts = await Prescription.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('status')), 'count'],
      ],
      where: { deliveryboy_id },
      group: 'status',
    });

    const statusCountMap: { [key: string]: number } = {};

    statusCounts.forEach((item: any) => {
      statusCountMap[item.status] = item.getDataValue('count');
    });

    const totalPrescriptions = statusCounts.reduce(
      (total, item: any) => total + item.getDataValue('count'),
      0
    );

    const response = {
      totalPrescriptions,
      dispatchPrescriptions: statusCountMap['dispatch'] || 0,
      returnPrescriptions: statusCountMap['return'] || 0,
      deliveredPrescriptions: statusCountMap['delivered'] || 0,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching prescription status count:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPrescriptionForFinance = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      filter = '',
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const searchCondition: any = {
      [Op.and]: [],
    };

    // Search conditions
    if (search) {
      searchCondition[Op.and].push({
        [Op.or]: [
          { patient_name: { [Op.like]: `%${search}%` } },
          { mobile: { [Op.like]: `%${search}%` } },
          {
            '$User.firstname$': { [Op.like]: `%${search}%` },
          },
          {
            '$User.lastname$': { [Op.like]: `%${search}%` },
          },
        ],
      });
    }

    // Status filter
    if (status && status !== 'all') {
      searchCondition[Op.and].push({ status });
    } else {
      searchCondition[Op.and].push({
        status: { [Op.in]: ['closed', 'delivered'] },
      });
    }

    let order: any[] = [['createdAt', 'DESC']]; // Default sorting by last update

    // Filter conditions
    switch (filter) {
      case 'today':
        order = [['createdAt', 'DESC']];
        searchCondition[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
            [Op.lt]: new Date(new Date().setHours(23, 59, 59, 999)), // End of today
          },
        });
        break;
      case 'last_7_days':
        searchCondition[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
          },
        });
        break;
      case 'last_15_days':
        searchCondition[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 15)), // Last 15 days
          },
        });
        break;
      case 'last_update':
        break; // No need to change order
      default:
        break; // Default sort
    }

    const prescription = await Prescription.findAndCountAll({
      attributes: [
        'prescription_id',
        'pr_id',
        'patient_name',
        'mobile',
        'status',
        'createdAt',
      ],
      where: searchCondition[Op.and].length ? searchCondition : {},
      include: [
        {
          model: User,
          attributes: ['firstname', 'lastname', 'discount', 'commission'],
        },
        {
          model: Bill,
          attributes: ['bill_number', 'total_bill'],
        },
      ],
      limit: Number(limit),
      offset: offset,
      order: order,
    });

    if (!prescription || prescription.count === 0) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    // Calculate total discount and commission for each prescription
    const prescriptionData = prescription.rows.map((item: any) => {
      const totalBill = item?.Bill?.total_bill ?? 0; // Fetch total_bill
      const discountPercent = item?.User?.discount ?? 10; // Fetch discount
      const commissionPercent = item?.User?.commission ?? 10; // Fetch commission

      const discountAmount = (totalBill * (discountPercent / 100)).toFixed(2); // Calculate discount amount
      const commissionAmount = (totalBill * (commissionPercent / 100)).toFixed(
        2
      ); // Calculate commission amount

      return {
        ...item.toJSON(), // Spread the existing item data
        discountAmount: Number(discountAmount), // Add calculated discount amount
        commissionAmount: Number(commissionAmount), // Add calculated commission amount
      };
    });

    const totalPages = Math.ceil(prescription.count / Number(limit));

    res.status(200).json({
      message: 'Prescription list retrieved successfully',
      prescription: prescriptionData, // Use the modified prescription data with calculated amounts
      count: prescription.count,
      currentPage: Number(page),
      totalPages: totalPages,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving prescription list',
      error: error.message,
    });
  }
};
