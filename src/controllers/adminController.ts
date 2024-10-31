import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/admin';
import emailService from '../utils/emailService';

const JWT_SECRET = 'your_jwt_secret';
const JWT_EXPIRES_IN = '7d';

export const AdminDetails = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decodedToken: any = jwt.verify(accessToken, JWT_SECRET);

    const adminId = decodedToken.id;

    const admin = await Admin.findByPk(adminId);

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const adminResponse = {
      id: admin?.id,
      username: admin?.username,
      email: admin?.email,
    };

    res.status(200).json({
      message: 'Admin details retrieved successfully',
      admin: adminResponse,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving admin details',
      error: error.message,
    });
  }
};

export const AdminRegister = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin name already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await Admin.create({
      username,
      password: hashedPassword,
    });

    const response = {
      username: newAdmin.username,
    };

    res
      .status(201)
      .json({ message: 'Admin registered successfully', Admin: response });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Error registering admin', error: error.message });
  }
};

export const AdminLogin = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({
      where: { username },
    });

    if (!admin || !(await bcrypt.compare(password, admin?.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const ChangePassword = async (req: Request, res: Response) => {
  const { username, oldPassword, newPassword } = req.body;

  try {
    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    await admin.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { username, newPassword } = req.body;

  try {
    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error });
  }
};

const otpStore = new Map<string, { otp: number; expires: Date }>();

export const sendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;

  if (adminEmail !== email) {
    return res.status(400).json({ message: 'Invalid email' });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000);
    if (adminEmail) {
      otpStore.set(email, {
        otp,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      });
      const mailOptions = {
        to: email,
        subject: 'OTP for password reset',
        text: `Your OTP is ${otp}`,
      };

      await emailService.sendEmail(mailOptions);
      res.json({ message: 'OTP sent successfully' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error sending OTP', error });
  }
};

export const verifyOtp = (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const storedOtp = otpStore.get(email);

    if (!storedOtp) {
      return res.status(400).json({ message: 'OTP not found' });
    }

    if (storedOtp.otp !== Number(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (storedOtp.expires < new Date()) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'OTP expired' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error });
  }
};
