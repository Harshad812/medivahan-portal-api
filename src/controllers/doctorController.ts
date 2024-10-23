import { Request, Response } from 'express';
import User from '../models/user';
import { Op, Sequelize } from 'sequelize';

export const doctorDetails = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const userResponse = {
      id: user?.id,
      firstname: user?.firstname,
      lastname: user?.lastname,
      mobile: user?.mobile,
      email: user?.email,
      designation: user?.designation,
      isMobileVerify: user?.isMobileVerify ?? false,
      profileImage: user?.profileImage,
      isClinicAdded: user?.isClinicAdded,
    };

    res.status(200).json({
      message: 'Doctor details retrieved successfully',
      user: userResponse,
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
