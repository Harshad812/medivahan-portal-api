import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './user';

interface ClinicAttributes {
  clinic_id?: number;
  user_id: number;
  name: string;
  address: string;
  city: string;
  near_by?: string;
  assistant_name: string;
  assistant_mobile: string;
  isAssistantMobileVerified?: boolean;
  removed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClinicCreationAttributes
  extends Optional<ClinicAttributes, 'clinic_id'> {}

class Clinic
  extends Model<ClinicAttributes, ClinicCreationAttributes>
  implements ClinicAttributes
{
  public clinic_id!: number;
  public user_id!: number;
  public name!: string;
  public address!: string;
  public city!: string;
  public near_by?: string;
  public isAssistantMobileVerified?: boolean;
  public assistant_name!: string;
  public assistant_mobile!: string;
  public removed?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Clinic.init(
  {
    clinic_id: {
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
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    near_by: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    assistant_name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    assistant_mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    isAssistantMobileVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    removed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },

  {
    sequelize,
    tableName: 'clinic',
  }
);

export default Clinic;
