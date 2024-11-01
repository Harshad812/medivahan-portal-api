import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import multiparty from 'multiparty';
import fs from 'fs';
import { uploadImageBufferToS3 } from '../utils/uploadImageBufferToS3';
import { createNotification } from '../utils/notificationUtil';

const JWT_SECRET = 'your_jwt_secret';
const JWT_EXPIRES_IN = '7d';
const JWT_REFRESH_SECRET = 'your_refresh_jwt_secret';
const JWT_REFRESH_EXPIRES_IN = '7d';

export const userDetails = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decodedToken: any = jwt.verify(accessToken, JWT_SECRET);

    const userId = decodedToken.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
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
      message: 'User details retrieved successfully',
      user: userResponse,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res
      .status(500)
      .json({ message: 'Error retrieving user details', error: error.message });
  }
};

export const register = async (req: Request, res: Response) => {
  const { firstname, lastname, mobile, email, designation, password } =
    req.body;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ where: { mobile } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstname,
      lastname,
      mobile,
      email,
      designation,
      password: hashedPassword,
    });

    if (newUser) {
      await createNotification('New doctor added', newUser.id, res);
    }

    const userResponse = {
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      mobile: newUser.mobile,
      email: newUser.email,
      designation: newUser.designation,
    };

    res
      .status(201)
      .json({ message: 'User registered successfully', user: userResponse });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Error registering user', error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { mobile, password } = req.body;

  try {
    const user = await User.findOne({
      where: { mobile },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
};

export const refreshToken = (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const accessToken = jwt.sign({ id: user?.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    res.json({ accessToken });
  });
};

export const socialMediaLogin = async (req: Request, res: Response) => {
  const { email, firstname, lastname, socialMediaId, loginMethod } = req.body;

  try {
    // Check if the user already exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // Create a new user if they don't exist
      user = await User.create({
        firstname,
        lastname,
        email,
        password: '',
        socialMediaId,
        loginMethod,
        designation: '',
        mobile: '',
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    });

    res.json({ accessToken, refreshToken, user });
  } catch (error) {
    res.status(500).json({ message: 'Error during social media login', error });
  }
};

const otpStore = new Map<string, { otp: string; expires: Date }>(); // In-memory storage for OTPs

export const forgotPassword = async (req: Request, res: Response) => {
  const { mobile } = req.body;

  try {
    const user = await User.findOne({ where: { mobile } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User exist!' });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error processing forgot password request', error });
  }
};

export const verifyOtp = (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const storedOtp = otpStore.get(email);

    if (!storedOtp) {
      return res.status(400).json({ message: 'OTP not found' });
    }

    if (storedOtp.otp !== otp) {
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

export const resetPassword = async (req: Request, res: Response) => {
  const { mobile, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { mobile } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error });
  }
};

export const ChangePassword = async (req: Request, res: Response) => {
  const { mobile, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { mobile } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error change password', error });
  }
};

export const verifyMobile = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decodedToken: any = jwt.verify(accessToken, JWT_SECRET);

    const userId = decodedToken.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isMobileVerify = true;
    await user.save();

    res.json({ message: 'You account now verified!' });
  } catch (error) {
    res.status(500).json({ message: 'Error account verification!', error });
  }
};

export const updateUserDetails = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id, 10);

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (err) {
        return res.status(500).send('Error parsing form');
      }

      const { firstname, mobile, lastname, designation } = fields;

      const file = files?.profileImage && files?.profileImage[0];

      // Update user details
      if (file) {
        const { originalFilename, path: filePath } = file;
        const buffer = fs.readFileSync(filePath);
        const uploadedImageUrl = await uploadImageBufferToS3(
          buffer,
          originalFilename
        );
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
        user.profileImage = uploadedImageUrl ?? user.profileImage;
      }

      user.firstname = firstname ? firstname[0] : user.firstname;
      user.lastname = lastname ? lastname[0] : user.lastname;
      user.mobile = mobile ? mobile[0] : user.mobile;
      user.designation = designation ? designation[0] : user.designation;
      user.isMobileVerify = true;

      // Save the updated user
      await user.save();

      res.status(200).json({ message: 'User details updated successfully' });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: 'Error updating user details', error: error.message });
    }
  });
};

export const deleteAccount = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const decodedToken: any = jwt.verify(accessToken, JWT_SECRET);

    const userId = decodedToken.id;

    const user = await User.findByPk(userId);
    const clinic = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.removed = true;
    await user.save();

    if (clinic) {
      clinic.removed = true;
      await clinic.save();
    }

    res.json({ message: 'You account now deleted!' });
  } catch (error) {
    res.status(500).json({ message: 'Error in delete account', error });
  }
};
