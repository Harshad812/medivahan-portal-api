import { Request, Response } from 'express';
import DeliveryBoy from '../models/delivery_boy';
import Prescription from '../models/prescription';
import sequelize from 'sequelize';

Prescription.belongsTo(DeliveryBoy, { foreignKey: 'd_id' });
DeliveryBoy.hasMany(Prescription, { foreignKey: 'deliveryboy_id' });

export const deliveryBoyList = async (req: Request, res: Response) => {
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const deliveryBoy = await DeliveryBoy.findAll({
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM prescription AS p
              WHERE p.deliveryboy_id = DeliveryBoy.d_id
              AND p.status = 'dispatch'
            )`),
            'dispatchCount',
          ],
        ],
      },
      include: [
        {
          model: Prescription,
          attributes: [],
          required: false,
        },
      ],
    });

    res.status(200).json({
      message: 'Delivery boy retrieved successfully',
      deliveryBoy,
      count: deliveryBoy.length,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving delivery boy details',
      error: error.message,
    });
  }
};

export const deliveryBoyDetails = async (req: Request, res: Response) => {
  const d_id = parseInt(req.params.id, 10);
  const accessToken = req.headers.authorization?.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ message: 'Access token missing' });
  }

  try {
    const deliveryBoy = await DeliveryBoy.findByPk(d_id);

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    res.status(200).json({
      message: 'Delivery boy details retrieved successfully',
      deliveryBoy,
    });
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    res.status(500).json({
      message: 'Error retrieving delivery boy details',
      error: error.message,
    });
  }
};

export const createDeliveryBoy = async (req: Request, res: Response) => {
  const { name, mobile } = req.body;

  try {
    const existingDeliveryBoy = await DeliveryBoy.findOne({
      where: { mobile },
    });
    if (existingDeliveryBoy) {
      return res
        .status(400)
        .json({ message: 'Delivery boy name already in use' });
    }

    const newDeliveryBoy = await DeliveryBoy.create({
      name,
      mobile,
    });

    res
      .status(201)
      .json({ message: 'Delivery boy create successfully', newDeliveryBoy });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: 'Error create delivery boy', error: error.message });
  }
};

export const updateDeliveryBoy = async (req: Request, res: Response) => {
  const d_id = parseInt(req.params.id, 10);
  const { name, mobile } = req.body;

  try {
    const deliveryBoy = await DeliveryBoy.findOne({
      where: { d_id },
    });

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    deliveryBoy.name = name;
    deliveryBoy.mobile = mobile;

    await deliveryBoy.save();

    res.json({ message: 'Delivery boy updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error in update delivery boy', error });
  }
};
