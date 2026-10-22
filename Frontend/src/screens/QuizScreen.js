import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import API_BASE_URL from "../utils/Config";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";

const QuizScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { quizId } = route.params || {};
  const tokenChild = useSelector((state) => state.auth.tokenChild);

  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingResult, setLoadingResult] = useState(true);
  const [result, setResult] = useState(null);

  // 🔹 Charger le quiz
  useEffect(() => {
    fetch(`${API_BASE_URL}/quizzes/${quizId}`)
      .then((res) => res.json())
      .then((data) => {
        setQuiz(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Erreur lors du chargement du quiz", err);
        setLoading(false);
      });
  }, [quizId]);

  // 🔹 Vérifier si l’enfant a déjà passé le quiz
  useEffect(() => {
    if (!tokenChild) {
      setLoadingResult(false); // ✅ IMPORTANT -> pour éviter blocage si pas de token
      return;
    }

    fetch(`${API_BASE_URL}/quizzes/${quizId}/result`, {
      headers: {
        Authorization: `Bearer ${tokenChild}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Pas de résultat");
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.user_grade !== undefined) {
          setResult(data);
        }
      })
      .catch((err) => {
        console.log("Pas encore de résultat", err.message);
      })
      .finally(() => {
        // ✅ Toujours mettre loadingResult à false même si erreur
        setLoadingResult(false);
      });
}, [quizId, tokenChild]);



  const handleSelectAnswer = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < quiz.questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    let score = 0;
    quiz.questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.answers.find((ans) => ans.correct === true);

      if (correctAnswer?.translations?.[0]?.title === userAnswer) {
        score++;
      }
    });

    const userGrade = score;
    const status = userGrade >= quiz.pass_mark ? "passed" : "failed";

    Alert.alert("تأكيد", "هل أنت متأكد من أنك تريد إرسال إجاباتك؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "إرسال",
        onPress: () => {
            fetch(`${API_BASE_URL}/quizzes/${quizId}/result`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${tokenChild}`,
                },
                body: JSON.stringify({
                  results: answers,
                  user_grade: userGrade,
                  status: status,
                }),
            })
            .then((res) => res.json())
            .then(() => {
                Alert.alert("تم", "تم إرسال إجاباتك بنجاح!");
                navigation.goBack();
            })
            .catch(() => {
                Alert.alert("خطأ", "حدث خطأ أثناء إرسال الإجابات.");
            });            
        },
      },
    ]);
  };

  if (loading || loadingResult) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097A7" />
        <Text style={styles.loadingText}>جارٍ تحميل الاختبار...</Text>
      </View>
    );
  }

  if (!quiz) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>❌ لا يوجد اختبار متاح.</Text>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.resultContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{quiz.translations?.[0]?.title || quiz.title}</Text>
        </View>

        <Text style={styles.resultTitle}>✅ لقد قمت بإجراء هذا الاختبار بالفعل</Text>
        <Text style={styles.resultText}>📊 النتيجة : {result.user_grade} / {quiz.total_mark}</Text>
        <Text style={styles.resultText}>
          🏅 الحالة : {result.status === "passed" ? "ناجح ✅" : "راسب ❌"}
        </Text>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{quiz.translations?.[0]?.title || quiz.title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.translations?.[0]?.title || "سؤال بدون عنوان"}</Text>

          {currentQuestion.answers.map((ans) => (
            <TouchableOpacity
              key={ans.id}
              onPress={() => handleSelectAnswer(currentQuestion.id, ans.translations?.[0]?.title)}
              style={[
                styles.answerOption,
                answers[currentQuestion.id] === ans.translations?.[0]?.title && styles.selectedAnswer,
              ]}
            >
              <Text style={styles.answerText}>{ans.translations?.[0]?.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
          <Text style={styles.nextButtonText}>
            {currentQuestionIndex + 1 === quiz.questions.length ? "إرسال الاختبار" : "السؤال التالي"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#888", fontSize: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0097A7",
    paddingVertical: 40,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  backButton: { position: "absolute", left: 15 },
  headerTitle: { fontSize: 20, color: "#fff", fontWeight: "bold", textAlign: "center", writingDirection: "rtl" },

  questionContainer: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    elevation: 2,
  },
  questionText: { fontSize: 20, color: "#333", marginBottom: 20, textAlign: "right", writingDirection: "rtl" },
  answerOption: { padding: 15, backgroundColor: "#E0E0E0", borderRadius: 10, marginBottom: 12 },
  selectedAnswer: { backgroundColor: "#0097A7" },
  answerText: { fontSize: 16, color: "#000", textAlign: "right", writingDirection: "rtl" },
  nextButton: { backgroundColor: "#0097A7", padding: 15, borderRadius: 10, alignItems: "center", marginTop: 20 },
  nextButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },

  resultContainer: { flex: 1, backgroundColor: "#F5F5F5", justifyContent: "center", alignItems: "center", padding: 20 },
  resultTitle: { fontSize: 22, color: "#1F3B64", marginBottom: 20, textAlign: "center", writingDirection: "rtl", fontWeight: "bold" },
  resultText: { fontSize: 18, color: "#444", marginBottom: 15, textAlign: "center", writingDirection: "rtl" },
});

export default QuizScreen;
