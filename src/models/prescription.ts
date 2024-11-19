import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './user';
import DeliveryBoy from './delivery_boy';
import Bill from './bill';

interface PrescriptionAttributes {
  prescription_id?: number;
  prescriptions: string[];
  pr_id?: string;
  user_id: number;
  patient_name: string;
  mobile: string;
  address?: string;
  city?: string;
  near_by?: string;
  status?: string;
  bill_id?: number;
  deliveryboy_id?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PrescriptionCreationAttributes
  extends Optional<PrescriptionAttributes, 'prescription_id' | 'pr_id'> {}

class Prescription
  extends Model<PrescriptionAttributes, PrescriptionCreationAttributes>
  implements PrescriptionAttributes
{
  public prescription_id!: number;
  public user_id!: number;
  public prescriptions!: string[];
  public pr_id!: string;
  public patient_name!: string;
  public mobile!: string;
  public address?: string;
  public city?: string;
  public near_by?: string;
  public status?: string;
  public bill_id?: number;
  public deliveryboy_id?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

async function generatePrescriptionId(prescription: Prescription, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const transaction = await sequelize.transaction();
    try {
      const lastPrescription = await Prescription.findOne({
        order: [['pr_id', 'DESC']],
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      let nextId = 'PR0001';

      if (lastPrescription) {
        const lastIdNumber = parseInt(lastPrescription.pr_id.slice(2), 10);
        const newIdNumber = lastIdNumber + 1;
        nextId = `PR${newIdNumber.toString().padStart(4, '0')}`;
      }

      prescription.pr_id = nextId;

      await transaction.commit();
      break; // Exit loop if successful
    } catch (error: any) {
      await transaction.rollback();
      if (error.original?.code === 'ER_LOCK_DEADLOCK' && attempt < retries) {
        console.warn(`Deadlock detected. Retrying attempt ${attempt}...`);
        continue;
      }
      throw error; // Throw error if it's not a deadlock or retries exhausted
    }
  }
}

Prescription.init(
  {
    prescription_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    pr_id: {
      type: DataTypes.STRING(8),
      autoIncrement: false,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    prescriptions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    patient_name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    near_by: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        'open',
        'preparing',
        'declined',
        'dispatch',
        'delivered',
        'return',
        'closed'
      ),
      allowNull: true,
      defaultValue: 'open',
    },
    bill_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: Bill,
        key: 'bill_id',
      },
    },
    deliveryboy_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: DeliveryBoy,
        key: 'd_id',
      },
    },
  },

  {
    sequelize,
    tableName: 'prescription',
    hooks: {
      beforeCreate: async (prescription) => {
        await generatePrescriptionId(prescription);
      },
    },
  }
);

export default Prescription;
