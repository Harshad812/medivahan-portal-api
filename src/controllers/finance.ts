import { Request, Response } from 'express';
import Bill from '../models/bill';
import Prescription from '../models/prescription';
import User from '../models/user';

export const getFinanceData = async (req: Request, res: Response) => {
  try {
    const totalPayment = await Bill.sum('total_bill');

    const closedPrescriptions = await Prescription.findAll({
      where: { status: 'closed' },
      include: [{ model: User, attributes: ['commission'] }],
    });

    const paidToDoctors = closedPrescriptions?.reduce(
      (sum, prescription: any) => {
        const doctor = prescription?.user as User;
        return sum + (doctor?.commission || 0);
      },
      0
    );

    const deliveredPrescriptions = await Prescription.findAll({
      where: { status: 'delivered' },
      include: [{ model: User, attributes: ['commission'] }],
    });

    const pendingDues = deliveredPrescriptions.reduce(
      (sum, prescription: any) => {
        const doctor = prescription?.user as User;
        return sum + (doctor?.commission || 0);
      },
      0
    );

    const discountToPatients = await User.sum('discount');

    res.status(200).json({
      totalPayment,
      paidToDoctors,
      pendingDues,
      discountToPatients,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching finance data' });
  }
};
