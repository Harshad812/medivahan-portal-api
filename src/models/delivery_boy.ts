import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DeliveryBoyAttributes {
  d_id: number;
  name: string;
  mobile: string;
  removed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface DeliveryBoyCreationAttributes
  extends Optional<DeliveryBoyAttributes, 'd_id' | 'removed'> {}

class DeliveryBoy
  extends Model<DeliveryBoyAttributes, DeliveryBoyCreationAttributes>
  implements DeliveryBoyAttributes
{
  public d_id!: number;
  public name!: string;
  public mobile!: string;
  public removed?: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DeliveryBoy.init(
  {
    d_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(15),
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
    tableName: 'delivery_boy',
  }
);

export default DeliveryBoy;
