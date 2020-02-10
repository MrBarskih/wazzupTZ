'use strict';
module.exports = (sequelize, DataTypes) => {
  var bookmarks = sequelize.define('bookmarks', {
    guid: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    link: {
      type: DataTypes.STRING(256),
      allowNull: false,
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      allowNull: true,
      type: DataTypes.DATE
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    favorites: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
  }, {
    timestamps: false
  });

  return bookmarks;
};