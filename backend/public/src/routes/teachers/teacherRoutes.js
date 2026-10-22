const express = require('express');
const router = express.Router();
const TeacherAuthController = require('../../controllers/teachers/TeacherAuthController');
//const authTeacherToken = require('../config/middleware/authTeacherToken');
const TeacherProfileController = require('../../controllers/teachers/TeacherProfileController');
const upload = require('../../config/middleware/teachers/uploadAvatar');
const TeacherVideoController = require('../../controllers/teachers/TeacherVideoController');
const TeacherWebinarController = require('../../controllers/teachers/TeacherWebinarController');
const TeacherMeetingController = require('../../controllers/teachers/TeacherMeetingController');
const TeacherFollowerController = require("../../controllers/teachers/TeacherFollowerController");
const TeacherVideoLikeController = require("../../controllers/teachers/TeacherVideoLikeController");


// Auth
router.post('/register', TeacherAuthController.register);
router.post('/login', TeacherAuthController.login);

// GET profile
router.get('/profile/:id', TeacherProfileController.getProfile);

// UPDATE profile (name, mobile, bio, password optional, avatar optional)
router.put('/profile/update/:id', upload.single('avatar'), TeacherProfileController.updateProfile);

// ✅ Videos (My Channel)
router.get('/channel/my-videos/:id', TeacherVideoController.getMyVideos);

// ✅ Get my webinars with stats
router.get('/my-webinars/:id', TeacherWebinarController.getMyWebinars);

// ✅ Meetings
router.get('/my-meetings/:id', TeacherMeetingController.getMyMeetings);

// ✅ Reservations
router.get('/my-meetings/reservations/:id', TeacherMeetingController.getMyReservations);
// followers
router.get("/my-followers/:id", TeacherFollowerController.getMyFollowers);
// likes 
router.get("/my-videos-likes/:id", TeacherVideoLikeController.getMyVideosLikes);

module.exports = router;
