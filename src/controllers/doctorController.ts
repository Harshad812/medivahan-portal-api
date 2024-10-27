import { Request, Response } from 'express';
import User from '../models/user';
import { Op, Sequelize } from 'sequelize';
import Clinic from '../models/clinic';
import Prescription from '../models/prescription';
import Bill from '../models/bill';
import sequelize from 'sequelize';

Clinic.belongsTo(User, { foreignKey: 'id' });
User.hasMany(Clinic, { foreignKey: 'user_id' });

Prescription.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Prescription, { foreignKey: 'user_id' });


export const doctorDetails = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.user_id, 10);
  

  try {
    const user = await User.findOne({
      where: {
        id: userId 
      },
      attributes: {
        exclude: ['password'] 
      },
      include: [
        {
          model: Clinic,
          as: 'Clinics'
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.status(200).json({
      message: 'Doctor details retrieved successfully',
      doctor: user,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving Doctor details',
      error: error.message,
    });
  }
};

export const getAllDoctor = async (req: Request, res: Response) => {
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
          { firstname: { [Op.like]: `%${search}%` } },
          { lastname: { [Op.like]: `%${search}%` } },
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
        order = [['updatedAt', 'DESC']]; // Default sort
    }

    const doctor = await User.findAndCountAll({
      attributes: [
        'id',
        'firstname',
        'lastname',
        'email',
        'mobile',
        'profileImage',
        'createdAt',
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM prescription AS p
            WHERE p.user_id = User.id AND p.status = 'delivered'
          )`),
          'deliveredCount',
        ],
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM prescription AS p
            WHERE p.user_id = User.id AND p.status = 'closed'
          )`),
          'closedCount',
        ],
        // Add similar lines for other status types if needed
      ],
      where: searchCondition[Op.and].length ? searchCondition : {},
      limit: Number(limit),
      offset: offset,
      order: order,
    });

    if (!doctor) {
      return res.status(404).json({ message: 'doctor not found' });
    }

    const totalPages = Math.ceil(doctor.count / Number(limit));

    res.status(200).json({
      message: 'doctor list retrieved successfully',
      doctor: doctor.rows,
      count: doctor.count,
      currentPage: Number(page),
      totalPages: totalPages,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving doctor list',
      error: error.message,
    });
  }
};

export const getPrescriptionByDoctor = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      filter = '',
      user_id = '' // Add user_id to query params
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
    }

    // User ID filter
    if (user_id) {
      searchCondition[Op.and].push({ user_id }); // Add user_id condition
    }

    let order: any[] = [['updatedAt', 'DESC']]; // Default sorting by last update

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
    const prescriptionData = prescription.rows.map((item:any) => {
      const totalBill = item?.Bill?.total_bill ?? 0; // Fetch total_bill
      const discountPercent = item?.User?.discount ?? 10; // Fetch discount
      const commissionPercent = item?.User?.commission ?? 10; // Fetch commission


      const discountAmount = (totalBill * (discountPercent / 100)).toFixed(2); // Calculate discount amount
      const commissionAmount = (totalBill * (commissionPercent / 100)).toFixed(2); // Calculate commission amount

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



export const getTotalPaidAndTotalDueByUser = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.user_id, 10);

  try {
    // Retrieve user's commission and discount values
    const user = await User.findByPk(userId, {
      attributes: ['commission', 'discount'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure commission and discount are not undefined or null, set default if necessary
    const doctorCommission = user.commission ? user.commission / 100 : 0; // Default to 0 if undefined or null
    const patientDiscount = user.discount ? user.discount / 100 : 0;     // Default to 0 if undefined or null
    const totalReduction = doctorCommission + patientDiscount;

    // Calculate total due for delivered prescriptions
    const totalDueResult:any = await Prescription.findAll({
      where: { user_id: userId, status: 'delivered' },
      include: [
        {
          model: Bill,
          attributes: [],
        },
      ],
      attributes: [
        [sequelize.fn('SUM', sequelize.col('Bill.total_bill')), 'totalDue'],
      ],
      raw: true,
    });
    const totalDue = totalDueResult[0]?.totalDue || 0;
    const payableDue = totalDue * (1 - totalReduction);

    // Calculate total paid for closed prescriptions
    const totalPaidResult:any = await Prescription.findAll({
      where: { user_id: userId, status: 'closed' },
      include: [
        {
          model: Bill,
          attributes: [],
        },
      ],
      attributes: [
        [sequelize.fn('SUM', sequelize.col('Bill.total_bill')), 'totalPaid'],
      ],
      raw: true,
    });
    const totalPaid = totalPaidResult[0]?.totalPaid || 0;
    const payablePaid = totalPaid * (1 - totalReduction);

    res.status(200).json({
      totalPaid,
      totalDue,
      payableDue,  // Payable amount after reductions for 'delivered' status
      payablePaid, // Payable amount after reductions for 'closed' status
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error retrieving total paid and total due',
      error: error.message,
    });
  }
};


  

export const updateCommissionOrDiscount = async (req: Request, res: Response) => {
  const { id, commission, discount } = req.body;

  try {
    // Find the user by ID
    const user = await User.findOne({ where: { id } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the commission or discount if provided
    if (commission !== undefined) {
      user.commission = commission;
    }
    
    if (discount !== undefined) {
      user.discount = discount;
    }

    // Save the updated user
    await user.save();

    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        commission: user.commission,
        discount: user.discount,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error updating commission or discount',
      error: error.message,
    });
  }
};

