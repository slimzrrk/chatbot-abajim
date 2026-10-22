const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

router.get("/count-by-manuel", videoController.getVideoCountByManuel);
router.get("/manuel/:manuelId", videoController.getVideosByManuelId);

module.exports = router;
