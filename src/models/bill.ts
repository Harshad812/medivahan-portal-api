import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './user';

interface BillAttributes {
  bill_id?: number;
  user_id?: number;
  prescription_id?: number;
  bill_number?: string;
  total_bill?: number;
  bills?: string[]; // Make bills optional in the attributes
  removed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BillCreationAttributes extends Optional<BillAttributes, 'bill_id'> {}

class Bill
  extends Model<BillAttributes, BillCreationAttributes>
  implements BillAttributes
{
  public bill_id!: number;
  public prescription_id!: number;
  public bill_number!: string;
  public total_bill!: number;
  public bills?: string[]; // Make bills optional in the class
  public removed?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Bill.init(
  {
    bill_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    prescription_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'prescription',
        key: 'prescription_id',
      },
    },
    bill_number: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    total_bill: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    bills: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    removed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'bill',
    timestamps: true, // Ensure timestamps are enabled
  }
);

export default Bill;
