import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserAttributes {
  id: number;
  firstname: string;
  lastname: string;
  mobile: string;
  email: string;
  designation: string;
  password: string;
  socialMediaId?: string;
  loginMethod?: string;
  isMobileVerify?: boolean;
  removed?: boolean;
  profileImage?: string;
  isClinicAdded?: boolean;
  discount?: number;
  commission?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    'id' | 'socialMediaId' | 'loginMethod' | 'isMobileVerify' | 'removed'
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public firstname!: string;
  public lastname!: string;
  public mobile!: string;
  public email!: string;
  public designation!: string;
  public password!: string;
  public socialMediaId?: string;
  public loginMethod?: string;
  public isMobileVerify?: boolean;
  public profileImage?: string;
  public removed?: boolean;
  public isClinicAdded?: boolean;
  public discount?: number;
  public commission?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    firstname: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(15),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    designation: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    socialMediaId: {
      type: DataTypes.STRING(256),
      allowNull: true,
    },
    loginMethod: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    isMobileVerify: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    removed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    profileImage: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    isClinicAdded: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    discount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    commission: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'users',
  }
);

export default User;
