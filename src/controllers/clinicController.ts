import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Clinic from '../models/clinic';
import User from '../models/user';

const JWT_SECRET = 'your_jwt_secret';

export const clinicDetails = async (req: Request, res: Response) => {
  const clinic_id = parseInt(req.params.id, 10);

  try {
    const clinic = await Clinic.findByPk(clinic_id);

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.status(200).json({
      message: 'Clinic details retrieved successfully',
      clinic,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving clinic details',
      error: error.message,
    });
  }
};

export const createClinic = async (req: Request, res: Response) => {
  const { name, address, city, near_by, assistant_name, assistant_mobile } =
    req.body;

  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decodedToken: any = jwt.verify(accessToken, JWT_SECRET);

    const userId = decodedToken.id;

    const existingClinic = await Clinic.findOne({ where: { name } });
    if (existingClinic) {
      return res.status(400).json({ message: 'Clinic already in use' });
    }

    const newClinic = await Clinic.create({
      address,
      assistant_mobile,
      assistant_name,
      city,
      name,
      near_by,
      user_id: userId,
    });

    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isClinicAdded = true;
    await user.save();

    res
      .status(201)
      .json({ message: 'Create clinic successfully', clinic: newClinic });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Error in create clinic', error: error.message });
  }
};

export const verifyAssistantMobile = async (req: Request, res: Response) => {
  const clinic_id = parseInt(req.params.id, 10);

  try {
    const clinic = await Clinic.findByPk(clinic_id);

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    clinic.isAssistantMobileVerified = true;
    await clinic.save();

    res.json({ message: 'Assistant mobile verified!' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error in assistant mobile verification!', error });
  }
};

export const updateClinicDetails = async (req: Request, res: Response) => {
  const clinic_id = parseInt(req.params.id, 10);
  const { name, address, city, near_by, assistant_name, assistant_mobile } =
    req.body;

  if (!clinic_id) {
    return res.status(401).json({ message: 'Clinic is required!' });
  }

  try {
    const clinic = await Clinic.findByPk(clinic_id);

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    // Update clinic details
    clinic.name = name ?? clinic?.name;
    clinic.address = address ?? clinic?.address;
    clinic.city = city ?? clinic?.city;
    clinic.near_by = near_by ?? clinic?.near_by;
    clinic.assistant_name = assistant_name ?? clinic?.assistant_name;
    clinic.assistant_mobile = assistant_mobile ?? clinic?.assistant_mobile;

    // Save the updated clinic
    await clinic.save();

    res.status(200).json({ message: 'Clinic details updated successfully' });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Error updating clinic details', error: error.message });
  }
};
