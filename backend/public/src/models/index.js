const Sequelize = require("sequelize");
const sequelize = require("../config/db");

// 🔹 Import des modèles partagés (application mobile)
const User = require("./User");
const Webinar = require("./Webinar");
const WebinarTranslation = require("./WebinarTranslation");
const WebinarChapter = require("./WebinarChapter");
const File = require("./File");
const FileTranslation = require("./FileTranslation");
const Manuel = require("./Manuel")(sequelize, Sequelize);
const Material = require("./Material")(sequelize, Sequelize);
const SchoolLevel = require("./SchoolLevel");
const Video = require("./Videos");
const Meeting = require("./Meeting");
const MeetingFile = require("./MeetingFile");
const MeetingTime = require("./MeetingTime");
const ReserveMeeting = require("./ReserveMeeting");
const Sale = require("./Sale");
const Submaterial = require("./Submaterial");
const Notification = require("./Notification")(sequelize, Sequelize.DataTypes);
const NotificationStatus = require("./NotificationStatus")(sequelize, Sequelize.DataTypes);
const Favorite = require("./Favorite")(sequelize, Sequelize);
const UserMinWatched = require('./UserMinWatched');
const UserView = require('./UserView');
const Document = require("./Document");

const Order = require("./Order")(sequelize, Sequelize.DataTypes);
const OrderItem = require("./OrderItem")(sequelize, Sequelize.DataTypes);
const Cart = require("./Cart")(sequelize, Sequelize.DataTypes);
const CardReservation = require("./CardReservation");
const PaymentProof = require("./PaymentProof");
const Subscribe = require("./Subscribe");

// Quiz Models
const Quiz = require("./Quiz");
const QuizTranslation = require("./QuizTranslation");
const QuizQuestion = require("./QuizQuestion");
const QuizQuestionTranslation = require("./QuizQuestionTranslation");
const QuizAnswer = require("./QuizAnswer");
const QuizAnswerTranslation = require("./QuizAnswerTranslation");
const QuizResult = require("./QuizResult");
const Likes =  require("./Likes");

// Teacher related
const UserLevel = require("./UserLevel");
const UserMatiere = require("./UserMatiere");
const Follow = require("./Follow");
const Like = require("./Likes");

// wallet
const Wallet = require("./Wallet")(sequelize, Sequelize.DataTypes);
//dashboard child activities
const ChildActivity = require("./ChildActivity")(sequelize, Sequelize.DataTypes);


// 🔹 Import des modèles spécifiques au chatbot
const ChatbotInteraction = require("./ChatbotInteraction");
const ChatbotRecommendation = require("./ChatbotRecommendation");
const ChatbotTrainingData = require("./ChatbotTrainingData");
const RecommendationHistory = require("./RecommendationHistory");

// 🔹 Définir les relations

// Webinar ↔ User
Webinar.belongsTo(User, { foreignKey: "teacher_id", as: "teacher" });
User.hasMany(Webinar, { foreignKey: "teacher_id", as: "webinars" });
User.hasMany(Webinar, { foreignKey: "teacher_id", as: "videos" });
Video.belongsTo(User, { foreignKey: "user_id", as: "teacher" });

// Webinar ↔ Material
Webinar.belongsTo(Material, { foreignKey: "matiere_id", as: "material" });
Material.hasMany(Webinar, { foreignKey: "matiere_id", as: "webinars" });

// Webinar ↔ Chapters
Webinar.hasMany(WebinarChapter, { foreignKey: "webinar_id", as: "chapters" });
WebinarChapter.belongsTo(Webinar, { foreignKey: "webinar_id", as: "webinar" });

// Chapter ↔ File
WebinarChapter.hasMany(File, { foreignKey: "chapter_id", as: "files" });
File.belongsTo(WebinarChapter, { foreignKey: "chapter_id", as: "chapter" });

// File ↔ Translations
File.hasMany(FileTranslation, { foreignKey: "file_id", as: "translations" });
FileTranslation.belongsTo(File, { foreignKey: "file_id", as: "file" });

// Manuel ↔ Matière & Niveau
Manuel.belongsTo(Material, { foreignKey: "material_id", as: "material" });
Material.hasMany(Manuel, { foreignKey: "material_id" });

Manuel.belongsTo(SchoolLevel, { foreignKey: "level_id", as: "level" });
SchoolLevel.hasMany(Manuel, { foreignKey: "level_id" });

Manuel.hasMany(Video, { foreignKey: "manuel_id", as: "videos" });
Video.belongsTo(Manuel, { foreignKey: "manuel_id", as: "manuel" });

// Notifications
Notification.hasMany(NotificationStatus, {
  foreignKey: "notification_id",
  as: "statuses",
  onDelete: "CASCADE",
});
NotificationStatus.belongsTo(Notification, {
  foreignKey: "notification_id",
  as: "notification",
  onDelete: "CASCADE",
});

// Favoris
Webinar.hasMany(Favorite, { foreignKey: "webinar_id", as: "favorites" });
Favorite.belongsTo(Webinar, { foreignKey: "webinar_id", as: "webinar" });

User.hasMany(Favorite, { foreignKey: "user_id", as: "favorites" });
Favorite.belongsTo(User, { foreignKey: "user_id", as: "user" });

// Meetings
Meeting.hasMany(MeetingFile, { foreignKey: "meeting_id", as: "files" });
MeetingFile.belongsTo(Meeting, { foreignKey: "meeting_id", as: "meeting" });

MeetingFile.hasMany(MeetingTime, { foreignKey: "meeting_id", as: "times" });
MeetingTime.belongsTo(MeetingFile, { foreignKey: "meeting_id", as: "file" });

Meeting.hasMany(MeetingTime, { foreignKey: "meeting_id", as: "times" });
MeetingTime.belongsTo(Meeting, { foreignKey: "meeting_id", as: "meeting" });

ReserveMeeting.belongsTo(Meeting, { foreignKey: "meeting_id", as: "meeting" });
Meeting.hasMany(ReserveMeeting, { foreignKey: "meeting_id", as: "meeting_reservations" });

ReserveMeeting.belongsTo(MeetingTime, { foreignKey: "meeting_time_id", as: "meetingTime" });
MeetingTime.hasMany(ReserveMeeting, { foreignKey: "meeting_time_id", as: "meetingTime_reservations" });

ReserveMeeting.belongsTo(Sale, { foreignKey: "sale_id", as: "sale" });
Sale.hasMany(ReserveMeeting, { foreignKey: "sale_id", as: "sale_reservations" });

ReserveMeeting.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(ReserveMeeting, { foreignKey: "user_id", as: "user_reservations" });

// Meeting belongsTo User
Meeting.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' }); // ou autre nom selon ta logique
User.hasMany(Meeting, { foreignKey: 'teacher_id' });

// Sales
User.hasMany(Sale, { foreignKey: "buyer_id", as: "purchases" });
User.hasMany(Sale, { foreignKey: "seller_id", as: "sales" });
Sale.belongsTo(User, { foreignKey: "buyer_id", as: "buyer" });
Sale.belongsTo(User, { foreignKey: "seller_id", as: "seller" });

Webinar.hasMany(Sale, { foreignKey: "webinar_id", as: "webinarSales" });
Sale.belongsTo(Webinar, { foreignKey: "webinar_id", as: "webinar" });

// ✅ Webinar Translations
Webinar.hasMany(WebinarTranslation, { foreignKey: "webinar_id", as: "translations" });
WebinarTranslation.belongsTo(Webinar, { foreignKey: "webinar_id", as: "webinar" });

Meeting.hasMany(Sale, { foreignKey: "meeting_id", as: "meetingSales" });
Sale.belongsTo(Meeting, { foreignKey: "meeting_id", as: "meeting" });

// Matières secondaires
Material.hasMany(Submaterial, { foreignKey: "material_id", as: "submaterials" });
Submaterial.belongsTo(Material, { foreignKey: "material_id", as: "material" });

MeetingTime.belongsTo(Material, { as: "material", foreignKey: "matiere_id" });
MeetingTime.belongsTo(Submaterial, { as: "submaterial", foreignKey: "submaterial_id" });
Material.hasMany(MeetingTime, { as: "times", foreignKey: "matiere_id" });
Submaterial.hasMany(MeetingTime, { as: "times", foreignKey: "submaterial_id" });

// ✅ Follow
User.hasMany(Follow, { foreignKey: "user_id", as: "followers" });
Follow.belongsTo(User, { foreignKey: "user_id", as: "teacher" });
Follow.belongsTo(User, { foreignKey: "follower", as: "follower_user" });
User.hasMany(Follow, { foreignKey: "follower", as: "followings" });

Like.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Like, { foreignKey: "user_id", as: "likes" });

Like.belongsTo(Video, { foreignKey: "video_id", as: "video" });
Video.hasMany(Like, { foreignKey: "video_id", as: "video_likes" });

// ✅ Orders & Payments
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// PaymentProof.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
// Order.hasMany(PaymentProof, { foreignKey: 'order_id', as: 'payment_proofs' });

// Un UserMinWatched appartient à un User
UserMinWatched.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(UserMinWatched, { foreignKey: "user_id", as: "min_watched_stats" });

// Une vue appartient à un utilisateur
UserView.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(UserView, { foreignKey: "user_id", as: "video_views" });

// Une vue est liée à une vidéo
UserView.belongsTo(Video, { foreignKey: "video_id", as: "video" });
Video.hasMany(UserView, { foreignKey: "video_id", as: "user_views" });

Manuel.hasMany(Document, { foreignKey: "manuel_id", as: "documents" });
Document.belongsTo(Manuel, { foreignKey: "manuel_id", as: "manuel" });

// ✅ Cart
User.hasMany(Cart, { foreignKey: "creator_id", as: "cart_items" });
Cart.belongsTo(User, { foreignKey: "creator_id", as: "creator" });
Cart.belongsTo(Webinar, { foreignKey: 'webinar_id', as: 'webinar' });
Cart.belongsTo(Meeting, { foreignKey: 'reserve_meeting_id', as: 'meeting' });

// PaymentProof.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
// Order.hasMany(PaymentProof, { foreignKey: 'order_id', as: 'payment_proofs' });

// ✅ QUIZ Relations
Quiz.hasMany(QuizTranslation, { foreignKey: 'quiz_id', as: 'translations' });
Quiz.hasMany(QuizQuestion, { foreignKey: 'quiz_id', as: 'questions' });
Quiz.hasMany(QuizResult, { foreignKey: 'quiz_id', as: 'results' });

QuizQuestion.hasMany(QuizQuestionTranslation, { foreignKey: 'quizzes_question_id', as: 'translations' });
QuizQuestion.hasMany(QuizAnswer, { foreignKey: 'question_id', as: 'answers' });

QuizAnswer.hasMany(QuizAnswerTranslation, { foreignKey: 'quizzes_questions_answer_id', as: 'translations' });

QuizResult.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
QuizResult.belongsTo(Quiz, { foreignKey: 'quiz_id', as: 'quiz' });

// ✅ Teacher Levels & Matiere (Books)
User.hasMany(UserLevel, { foreignKey: "teacher_id", as: "levels" });
User.hasMany(UserMatiere, { foreignKey: "teacher_id", as: "matieres" });

UserMatiere.belongsTo(User, { foreignKey: "teacher_id", as: "teacher" });
UserMatiere.belongsTo(Manuel, { foreignKey: "matiere_id", as: "manuel" });
Manuel.hasMany(UserMatiere, { foreignKey: "matiere_id", as: "matiere_links" });

// ✅ Wallet <-> User
User.hasOne(Wallet, { foreignKey: "user_id", as: "wallet" });
Wallet.belongsTo(User, { foreignKey: "user_id", as: "user" });

// childActivity -> User
User.hasMany(ChildActivity, { foreignKey: 'child_id', as: 'activities' });
ChildActivity.belongsTo(User, { foreignKey: 'child_id', as: 'child' });



// 🔹 Exports finaux
const db = {
  sequelize,
  Sequelize,
  User,
  Webinar,
  WebinarChapter,
  File,
  FileTranslation,
  Manuel,
  Material,
  SchoolLevel,
  Notification,
  NotificationStatus,
  Video,
  Favorite,
  Meeting,
  MeetingFile,
  MeetingTime,
  ReserveMeeting,
  Sale,
  Submaterial,
  Follow,
  Like,
  UserView,
  UserMinWatched,
  UserLevel,
  Document,
  WebinarTranslation,
  Order,
  OrderItem,
  Cart,
  CardReservation,
  PaymentProof,
  Subscribe,
  Quiz,
  QuizTranslation,
  QuizQuestion,
  QuizQuestionTranslation,
  QuizAnswer,
  QuizAnswerTranslation,
  QuizResult,
  UserLevel,
  UserMatiere,
  Wallet,
  ChildActivity,
  // Chatbot-specific models
  ChatbotInteraction,
  ChatbotRecommendation,
  ChatbotTrainingData,
  RecommendationHistory,
};

// Synchroniser les tables du chatbot
ChatbotRecommendation.sync({ force: true })
  .then(() => {
    console.log('✅ Table chatbot_recommendations synchronisée avec succès');
  })
  .catch(err => {
    console.error('❌ Erreur lors de la synchronisation de la table chatbot_recommendations:', err);
  });

RecommendationHistory.sync({ force: true })
  .then(() => {
    console.log('✅ Table recommendation_history synchronisée avec succès');
  })
  .catch(err => {
    console.error('❌ Erreur lors de la synchronisation de la table recommendation_history:', err);
  });

module.exports = db;
