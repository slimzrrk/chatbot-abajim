const db = require("../models");
const Video = db.Video;
const { Op } = require("sequelize");

const videoService = {
  countVideosByManuel: async () => {
    return await Video.findAll({
      attributes: ['manuel_id', [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'totalVideos']],
      group: ['manuel_id'],
    });
  },

  getVideosByManuelId: async (manuelId) => {
    return await Video.findAll({ where: { manuel_id: manuelId } });
  },
};

module.exports = videoService;
