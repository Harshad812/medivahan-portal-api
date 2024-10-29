import { Request, Response } from 'express';
import Prescription from '../models/prescription';
import User from '../models/user';
import { Op } from 'sequelize';

Prescription.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Prescription, { foreignKey: 'user_id' });

export const recentPrescriptions = async (req: Request, res: Response) => {
  const { limit = 8 } = req.query;
  try {
    const prescription = await Prescription.findAndCountAll({
      attributes: [
        'prescription_id',
        'patient_name',
        'mobile',
        'status',
        'createdAt',
      ],
      include: [
        {
          model: User,
          attributes: ['firstname', 'lastname'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
    });

    if (!prescription) {
      return res.status(404).json({ message: 'prescription not found' });
    }

    res.status(200).json({
      message: 'prescription list retrieved successfully',
      prescription: prescription.rows,
      count: prescription.count,
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


export const requireDetailsDoctorList = async (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  try {
    const doctor = await User.findAndCountAll({
      attributes: ['id', 'firstname', 'lastname', 'profileImage'],
      where: {
        [Op.or]: [
          { discount: 0 },
          { commission: 0 }
        ]
      },
      limit: Number(limit),
    });

    if (!doctor) {
      return res.status(404).json({ message: 'doctor not found' });
    }

    res.status(200).json({
      message: 'doctor list retrieved successfully',
      doctor: doctor.rows,
      count: doctor.count,
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


export const getPrescriptionAndDoctorCount = async (
  req: Request,
  res: Response
) => {
  try {
    const doctorCount = await User.count();
    const prescriptionCount = await Prescription.count();

    res.status(200).json({
      message: 'Counts retrieved successfully',
      totalDoctor: doctorCount,
      totalPrescription: prescriptionCount,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving counts list',
      error: error.message,
    });
  }
};
