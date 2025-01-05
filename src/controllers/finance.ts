import { Request, Response } from 'express';
import Bill from '../models/bill';
import Prescription from '../models/prescription';
import User from '../models/user';

export const getFinanceData = async (req: Request, res: Response) => {
  try {
    const closedPrescriptions = await Prescription.findAll({
      where: { status: 'closed' },
      include: [
        { model: User, attributes: ['commission', 'discount'] },
        { model: Bill, attributes: ['total_bill'] },
      ],
    });

    const totalClosePayment = closedPrescriptions?.reduce(
      (sum, prescription: any) => {
        const bill = prescription.Bill;
        const totalBill = bill?.total_bill || 0;
        return sum + totalBill;
      },
      0
    );

    const paidToDoctors = closedPrescriptions?.reduce(
      (sum, prescription: any) => {
        const doctor = prescription.User;
        const bill = prescription.Bill;
        const commission_amount = Number(prescription.commission_amount) || 0;
        const commission = (doctor?.commission || 0) / 100;
        const totalBill = Number(bill?.total_bill) || 0;

        const computedCommission = commission_amount || commission * totalBill;

        return sum + computedCommission;
      },
      0
    );

    const deliveredPrescriptions = await Prescription.findAll({
      where: { status: 'delivered' },
      include: [
        { model: User, attributes: ['commission'] },
        { model: Bill, attributes: ['total_bill'] },
      ],
    });

    const pendingDues = deliveredPrescriptions?.reduce(
      (sum, prescription: any) => {
        const doctor = prescription.User;
        const bill = prescription.Bill;
        const commission_amount = Number(prescription.commission_amount) || 0;
        const commission = (doctor?.commission || 0) / 100;
        const totalBill = Number(bill?.total_bill) || 0;

        const computedCommission = commission_amount || commission * totalBill;

        return sum + computedCommission;
      },
      0
    );

    const discountToPatients = closedPrescriptions?.reduce(
      (sum, prescription: any) => {
        const doctor = prescription.User;
        const bill = prescription.Bill;
        const discount_amount = Number(prescription.discount_amount) || 0;
        const discount = (doctor?.discount || 0) / 100;
        const totalBill = Number(bill?.total_bill) || 0;

        const computedDiscount = discount_amount || discount * totalBill;

        return sum + computedDiscount;
      },
      0
    );

    res.status(200).json({
      paidToDoctors,
      totalClosePayment,
      pendingDues,
      discountToPatients,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching finance data' });
  }
};
