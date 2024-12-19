'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SpotImage extends Model {
    static associate(models) {
      SpotImage.belongsTo(models.Spot, { foreignKey: 'spotId' });
    }
  }
  SpotImage.init({
    spotId: DataTypes.INTEGER,
    imageURL: DataTypes.STRING,
    previewImage: DataTypes.BOOLEAN,
  }, {
    sequelize,
    modelName: 'SpotImage',
  });
  return SpotImage;
};
