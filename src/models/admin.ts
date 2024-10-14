import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface AdminAttributes {
  id: number;
  email?: string;
  username: string;
  password: string;
  removed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdminCreationAttributes
  extends Optional<AdminAttributes, 'id' | 'email' | 'removed'> {}

class Admin
  extends Model<AdminAttributes, AdminCreationAttributes>
  implements AdminAttributes
{
  public id!: number;
  public username!: string;
  public email?: string;
  public password!: string;
  public removed?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    removed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'admin',
  }
);

export default Admin;
