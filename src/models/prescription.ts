import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './user';

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

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
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
        'received',
        'closed',
        'delivered',
        'decline',
        'open'
      ),
      allowNull: true,
      defaultValue: 'open',
    },
  },

  {
    sequelize,
    tableName: 'prescription',
    hooks: {
      // This hook will run before the `create` operation
      beforeCreate: async (prescription) => {
        const lastPrescription = await Prescription.findOne({
          order: [['pr_id', 'DESC']],
        });

        let nextId = 'PR0001'; // Default ID for the first record

        if (lastPrescription) {
          // Extract the numeric part of the last ID and increment it
          const lastIdNumber = parseInt(lastPrescription?.pr_id?.slice(2), 10); // Remove 'PR' prefix and parse number
          const newIdNumber = lastIdNumber + 1;

          // Format the new ID, ensuring it's zero-padded to 4 digits
          nextId = `PR${newIdNumber.toString().padStart(4, '0')}`;
        }

        prescription.pr_id = nextId;
      },
    },
  }
);

export default Prescription;
