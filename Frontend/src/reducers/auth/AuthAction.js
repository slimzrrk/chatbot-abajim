import AsyncStorage from "@react-native-async-storage/async-storage";
export const API_URL = 'https://311a-2a09-bac1-71c0-00-3b6-45.ngrok-free.app/api'; 
import { Alert } from "react-native";
import axios from 'axios';


export const register = (fullName, mobile, password, role_id, navigation) => {
  return async (dispatch) => {
    dispatch({ type: "AUTH_LOADING" });

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName, 
          mobile,
          password,
          confirm_password: password,
          role_id, 
        }),
      });

      const text = await response.text(); // 🔥 Toujours lire d'abord en texte

      let resData;
      try {
        resData = JSON.parse(text); // ✅ Essayer de parser en JSON
      } catch (err) {
        throw new Error("La réponse du serveur n'est pas au format JSON : " + text);
      }

      if (!response.ok) {
        console.error("❌ Erreur HTTP:", response.status, resData);
        throw new Error(resData.error || `HTTP Error: ${response.status}`);
      }

      if (!resData.token) {
        throw new Error("Aucun token reçu. Vérifie le backend.");
      }
      Alert.alert("Succès", "Inscription réussie !");
      await AsyncStorage.setItem("token", resData.token);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: resData.token, 
      });
      const childrenResponse = await fetch(`${API_URL}/enfants`, {
        headers: {
          Authorization: `Bearer ${resData.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "GET",
      });

      const childrenText = await childrenResponse.text();
      let childrenData;

      try {
        childrenData = JSON.parse(childrenText);
      } catch (err) {
        throw new Error("Impossible de lire les enfants : " + childrenText);
      }

      dispatch({
        type: "FETCH_CHILDREN_SUCCESS",
        payload: childrenData,
      });

      if (childrenData.length === 0) {
        navigation.reset({
          index: 0,
          routes: [{ name: "AddKids" }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "Books" }],
        });
      }

    } catch (error) {
      console.error("❌ Erreur d'inscription:", error.message);
      dispatch({ type: "LOGIN_FAIL", error: error.message });
      Alert.alert("Erreur", error.message);
    }
  };
};

// 🔹 Login Action
export const login = (mobile, password, navigation) => {
  return async (dispatch) => {
    dispatch({ type: "AUTH_LOADING" });

    try {
      
      const response = await fetch(`${API_URL}/users/login`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ mobile, password }),
      });

      const resData = await response.json();

      if (!resData.token) {
        throw new Error("Identifiants incorrects.");
      }

      await AsyncStorage.setItem("token", resData.token);

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: resData.token,
      });

      // ✅ Fetch children immediately after login
      const childrenResponse = await fetch(`${API_URL}/enfants`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${resData.token}`,
          "Content-Type": "application/json",
        },
      });

      const childrenData = await childrenResponse.json();

      dispatch({
        type: "FETCH_CHILDREN_SUCCESS",
        payload: childrenData,
      });

      // ✅ Navigate based on child count
      if (childrenData.length > 0) {
        navigation.reset({ index: 0, routes: [{ name: "Books" }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "AddKids" }] });
      }

    } catch (error) {
      console.error("❌ Erreur de connexion :", error.message);
      dispatch({ type: "LOGIN_FAIL", error: error.message });
      Alert.alert("Erreur", error.message);
    }
  };
};
// Actions pour la réinitialisation du mot de passe
export const SEND_OTP_REQUEST = "SEND_OTP_REQUEST";
export const SEND_OTP_SUCCESS = "SEND_OTP_SUCCESS";
export const SEND_OTP_FAILURE = "SEND_OTP_FAILURE";

export const VERIFY_OTP_REQUEST = "VERIFY_OTP_REQUEST";
export const VERIFY_OTP_SUCCESS = "VERIFY_OTP_SUCCESS";
export const VERIFY_OTP_FAILURE = "VERIFY_OTP_FAILURE";

export const RESET_PASSWORD_REQUEST = "RESET_PASSWORD_REQUEST";
export const RESET_PASSWORD_SUCCESS = "RESET_PASSWORD_SUCCESS";
export const RESET_PASSWORD_FAILURE = "RESET_PASSWORD_FAILURE";

// ✅ Envoi OTP
export const sendOtp = (mobile, navigation) => async (dispatch) => {
  dispatch({ type: SEND_OTP_REQUEST });

  try {
    const response = await fetch(`${API_URL}/users/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile }),
    });

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.message || "Échec de l’envoi de l’OTP.");
    }

    dispatch({ type: SEND_OTP_SUCCESS });
    Alert.alert("نجاح", "تم إرسال رمز التحقق إلى هاتفك.");
    navigation.navigate("VerificationScreen", { phone: mobile });
  } catch (error) {
    dispatch({ type: SEND_OTP_FAILURE, payload: error.message });
    Alert.alert("Erreur", error.message);
  }
};

// ✅ Vérification OTP
export const verifyOtp = (mobile, otp, navigation) => async (dispatch) => {
  dispatch({ type: VERIFY_OTP_REQUEST });

  try {
    const response = await fetch(`${API_URL}/users/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, otp }),
    });

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.message || "OTP invalide.");
    }

    dispatch({ type: VERIFY_OTP_SUCCESS });
    Alert.alert("Succès", "OTP validé avec succès.");
    navigation.navigate("ResetPasswordScreen", { phone: mobile });
  } catch (error) {
    dispatch({ type: VERIFY_OTP_FAILURE, payload: error.message });
    Alert.alert("Erreur", error.message);
  }
};

// ✅ Réinitialisation du mot de passe
export const resetPassword = (mobile, newPassword, navigation) => async (dispatch) => {
  dispatch({ type: RESET_PASSWORD_REQUEST });

  try {
    const response = await fetch(`${API_URL}/users/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile, newPassword }),
    });

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.message || "Échec de la réinitialisation du mot de passe.");
    }

    dispatch({ type: RESET_PASSWORD_SUCCESS });
    Alert.alert("✅ تم إعادة تعيين كلمة المرور بنجاح!");

    navigation.navigate("SignIn");
  } catch (error) {
    dispatch({ type: RESET_PASSWORD_FAILURE, payload: error.message });
    Alert.alert("❌ فشل إعادة تعيين كلمة المرور، حاول مرة أخرى.");
  }
};



  // 🔹 Logout Action
  export const Logout = () => {
    return async (dispatch) => {
      await AsyncStorage.removeItem("token");
  
      dispatch({
        type: "LOGOUT",
      });
  
      Alert.alert("✅ Déconnexion réussie");
    };
  }; 

// export const Init = () => {
//   return async (dispatch) => {
//       try {
//           const token = await AsyncStorage.getItem("token");

//           if (!token) {
//               console.warn("⚠️ No token found, skipping initialization.");
//               return;
//           }

//           dispatch({ type: "LOGIN_SUCCESS", payload: token });

//           const childrenData = await AsyncStorage.getItem("children");
//           const children = childrenData ? JSON.parse(childrenData) : [];
//           const childString = await AsyncStorage.getItem("firstChild");
//             const child = childString ? JSON.parse(childString) : null;
//       console.log("child test",child)
//         dispatch(setActiveChild(child));


//           // Charger les enfants depuis AsyncStorage directement
//           dispatch({ type: "FETCH_CHILDREN_SUCCESS", payload: children });

//           const activeChildData = await AsyncStorage.getItem("activeChild");

//           if (activeChildData) {
//               dispatch({ type: "SET_ACTIVE_CHILD", payload: JSON.parse(activeChildData) });
//           } else if (children.length > 0) {
//               // Si pas encore d'activeChild mais des enfants, prendre le premier
//               dispatch({ type: "SET_ACTIVE_CHILD", payload: children[0] });
//               await AsyncStorage.setItem("activeChild", JSON.stringify(children[0]));
//           }

//       } catch (error) {
//           console.error("❌ Error in Init function:", error.message);
//       }
//   };
// };
export const Init = () => {
  return async (dispatch) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        console.warn("⚠️ No token found, skipping initialization.");
        return;
      }

      // Authentifier le parent
      dispatch({ type: "LOGIN_SUCCESS", payload: token });

      // Charger les enfants
      const childrenData = await AsyncStorage.getItem("children");
      const children = childrenData ? JSON.parse(childrenData) : [];
      dispatch({ type: "FETCH_CHILDREN_SUCCESS", payload: children });

      // 🚨 Ne pas utiliser l'ancien activeChild stocké → toujours prendre le premier enfant si c'est une nouvelle session
      let firstChild = null;

      if (children.length > 0) {
        firstChild = children[0];

        // Sauvegarder dans AsyncStorage le nouveau enfant actif
        await AsyncStorage.setItem("activeChild", JSON.stringify(firstChild));

        // Définir le activeChild dans Redux
        dispatch({ type: "SET_ACTIVE_CHILD", payload: firstChild });
      }

      // Charger le token de l'enfant actif
      const tokenChild = await AsyncStorage.getItem("tokenChild");

      if (tokenChild && firstChild) {
        dispatch(fetchNotifications(tokenChild));
        dispatch(fetchFavorites(tokenChild));
        dispatch(fetchCart(tokenChild));
      }

    } catch (error) {
      console.error("❌ Error in Init function:", error.message);
    }
  };
};


export const setActiveChild = (child) => {
    return async (dispatch) => {
  
      // ✅ Save the new token and active child

      await AsyncStorage.setItem("tokenChild", child.token);

      dispatch({ type: "FETCH_ACTIVE_CHILD_SUCCESS", payload: child });
      dispatch({
        type: "SWITCH_ACTIVE_CHILD",
        payload: { 
          child: child, 
          token: child.token, 
        },
      });

         await AsyncStorage.setItem("activeChild", JSON.stringify(child));

         dispatch({ type: "SET_ACTIVE_CHILD", payload: child });
    };
};


// 🔹 Add Child Action
export const addChild = (childData, navigation) => async (dispatch, getState) => {
  try {
    const parentToken = await AsyncStorage.getItem("token");
    if (!parentToken) throw new Error("User is not authenticated.");

    dispatch({ type: "AUTH_LOADING" });

    const response = await fetch(`${API_URL}/enfants/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${parentToken}`,
      },
      body: JSON.stringify(childData),
    });

    const contentType = response.headers.get("content-type");
    let resData = null;

    // ✅ Vérifier si la réponse est JSON avant de parser
    if (contentType && contentType.includes("application/json")) {
      resData = await response.json();
    } else {
      const text = await response.text();
      throw new Error(text);  // 🚨 Provoquer une erreur avec le texte brut si ce n'est pas du JSON
    }

    if (response.ok) {
      dispatch({ type: "ADD_CHILD_SUCCESS", payload: resData.enfant });
      await AsyncStorage.setItem("tokenChild", resData.token);
      navigation.navigate("Books");
    } else {
      console.error("❌ Failed to add child:", resData.error);
      dispatch({ type: "ADD_CHILD_FAILURE", error: resData.error });
    }
  } catch (error) {
    console.error("❌ Error adding child:", error.message);
    dispatch({ type: "ADD_CHILD_FAILURE", error: error.message });
  }
};

// ✅ **Update Child Action**
export const updateChild = (childData, callback) => async (dispatch) => {
  dispatch({ type: "UPDATE_CHILD_REQUEST" });

  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      throw new Error("User is not authenticated.");
    }

    const response = await fetch(`${API_URL}/enfants/update/${childData.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nom: childData.nom, // ✅ Ensure it matches the API expected key
        level_id: childData.level_id,
        sexe: childData.sexe,
      }),
    });

    const resData = await response.json();

    if (!response.ok) {
      throw new Error(resData.error || "Failed to update child.");
    }
    dispatch({
      type: "UPDATE_CHILD_SUCCESS",
      payload: resData.enfant, // ✅ Ensure correct response data
    });

    dispatch(fetchChildren()); // ✅ Refresh children list after update

    if (callback) callback(true); // ✅ Execute callback after success
  } catch (error) {
    console.error("❌ Error updating child:", error.message);
    dispatch({
      type: "UPDATE_CHILD_FAILURE",
      payload: error.message,
    });

    if (callback) callback(false); // ✅ Execute callback with failure
  }
};

// 🔹 Supprimer un enfant
export const deleteChild = (childId) => async (dispatch, getState) => {
  try {
    const token = await AsyncStorage.getItem("token"); // ✅ Récupérer le token du parent

    if (!token) {
      throw new Error("Utilisateur non authentifié.");
    }

    dispatch({ type: "AUTH_LOADING" });

    const response = await fetch(`${API_URL}/enfants/delete/${childId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const resData = await response.json();

    if (response.ok) {
      dispatch({ type: "DELETE_CHILD_SUCCESS", payload: childId });

      dispatch(fetchChildren()); // ✅ Rafraîchir la liste des enfants après suppression

      Alert.alert("✅ تم حذف الطفل", "تم حذف الطفل بنجاح.");
    } else {
      console.error("❌ فشل في حذف الطفل :", resData.error);
      dispatch({ type: "DELETE_CHILD_FAILURE", error: resData.error });
      Alert.alert("❌ Erreur", resData.error || "Échec de la suppression de l'enfant.");
    }
  } catch (error) {
    console.error("❌ حدث خطأ أثناء حذف الطفل", error.message);
    dispatch({ type: "DELETE_CHILD_FAILURE", error: error.message });
    Alert.alert("❌ خطأ",  "حدث خطأ أثناء الحذف.");
  }
};

// ✅ Fetch Children (Updated to use the new `users` table)
export const fetchChildren = () => async (dispatch, getState) => {
  try {
      const parentToken = await AsyncStorage.getItem("token"); // ✅ Ensure we use the parent's token

      if (!parentToken) {
          console.error("❌ Token missing.");
          return;
      }

      dispatch({ type: "AUTH_LOADING" });

      const response = await fetch(`${API_URL}/enfants`, {
          method: "GET",
          headers: {
              Authorization: `Bearer ${parentToken}`,
              "Content-Type": "application/json"
          }
      });

      const data = await response.json();
      if (response.ok) {
          console.log("✅ Children fetched:", data);

          await AsyncStorage.setItem("children", JSON.stringify(data)); // ✅ Store updated children list
          dispatch({ type: "FETCH_CHILDREN_SUCCESS", payload: data });
      } else {
          console.error("❌ Failed to fetch children:", data.error);
          dispatch({ type: "FETCH_CHILDREN_FAILURE", error: data.error });
      }
  } catch (error) {
      console.error("❌ Error fetching children:", error);
      dispatch({ type: "FETCH_CHILDREN_FAILURE", error: "Failed to fetch children" });
  }
};
// ✅ Fetch Children (Updated to use the new `users` table)
export const fetchChild = () => async (dispatch) => {
  try {
    const parentToken = await AsyncStorage.getItem("token");

    if (!parentToken) {
      console.error("❌ Token missing.");
      dispatch({ type: "FETCH_CHILD_ERROR", error: "Token missing" });
      return;
    }

    // ✅ Obtenir le parentId via l'API
    const meResponse = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${parentToken}`,
        "Content-Type": "application/json"
      }
    });

    const meData = await meResponse.json();
    const parentId = meData?.id;

    if (!meResponse.ok || !parentId) {
      throw new Error("Impossible de récupérer l'utilisateur.");
    }

    dispatch({ type: "FETCH_CHILD_LOADING" });

    const response = await fetch(`${API_URL}/enfants/first-child/${parentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${parentToken}`,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Child fetched:", data);
      await AsyncStorage.setItem("firstChild", JSON.stringify(data));

      dispatch({ type: "FETCH_CHILD_SUCCESS", payload: data });
    } else {
      console.error("❌ Failed to fetch child:", data.error);
      dispatch({ type: "FETCH_CHILD_ERROR", error: data.error || "Failed to fetch child" });
    }

  } catch (error) {
    console.error("❌ Error fetching child:", error.message);
    dispatch({ type: "FETCH_CHILD_ERROR", error: error.message || "Unexpected error" });
  }
};


// fetching documents by manuel_id 
export const fetchDocumentByManuelId = (manuelId) => {
  return async (dispatch) => {
    dispatch({ type: "DOCUMENT_LOADING" });

    try {

      const response = await fetch(`${API_URL}/documents/manuel/${manuelId}`);
      const data = await response.json();

      if (response.ok && data.length > 0) {
        dispatch({ type: "DOCUMENT_SUCCESS", payload: data[0] });
      } else {
        console.error("❌ No documents found for manuel_id:", manuelId);
        dispatch({ type: "DOCUMENT_FAIL", error: "No documents found" });
      }
    } catch (error) {
      console.error("❌ Error fetching document:", error);
      dispatch({ type: "DOCUMENT_FAIL", error: "Failed to fetch document" });
    }
  };
};
// switching betweeen kids accounts
export const switchChild = (child) => {
  return async (dispatch) => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("User is not authenticated.");
      }

      const response = await fetch(`${API_URL}/users/switch-child`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ childId: child.id }),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to switch child.");
      }

      // Save new activeChild and tokenChild
      await AsyncStorage.setItem("activeChild", JSON.stringify(resData.child));
      await AsyncStorage.setItem("tokenChild", resData.token);

      // Update Redux
      dispatch({
        type: "SET_ACTIVE_CHILD",
        payload: resData.child,
      });

      // Fetch updated children
      const response2 = await fetch(`${API_URL}/enfants`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const resData2 = await response2.json();

      if (resData2) {
        await AsyncStorage.setItem("children", JSON.stringify(resData2));
        dispatch({
          type: "FETCH_CHILDREN_SUCCESS",
          payload: resData2
        });
      }
    } catch (error) {
      console.error("❌ Error switching child:", error.message);
    }
  };
};

export const FETCH_CORRECTION_VIDEO_REQUEST = "FETCH_CORRECTION_VIDEO_REQUEST";
export const FETCH_CORRECTION_VIDEO_SUCCESS = "FETCH_CORRECTION_VIDEO_SUCCESS";
export const FETCH_CORRECTION_VIDEO_FAILURE = "FETCH_CORRECTION_VIDEO_FAILURE";
// ✅ Fetch Correction Video with Authentication
export const fetchCorrectionVideoUrl = (manuelId, icon, page, childId) => async (dispatch) => {
  dispatch({ type: "FETCH_CORRECTION_VIDEO_REQUEST" });

  try {
    const token = await AsyncStorage.getItem("tokenChild");

    const response = await fetch(`${API_URL}/documents/correction-video`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        manuel_id: manuelId,
        icon,
        page,
        childId, // ✅ on ajoute childId ici
      }),
    });

    const data = await response.json();

    if (response.ok && data.videoUrl) {
      dispatch({
        type: "FETCH_CORRECTION_VIDEO_SUCCESS",
        payload: data,
      });

      // ✅ retourne childId dans la méta si tu en as besoin
      return {
        payload: data,
        meta: { childId },
      };
    } else {
      dispatch({
        type: "FETCH_CORRECTION_VIDEO_FAILURE",
        payload: "Vidéo introuvable",
      });
      return { payload: null };
    }
  } catch (error) {
    dispatch({
      type: "FETCH_CORRECTION_VIDEO_FAILURE",
      payload: error.message,
    });
    return { payload: null };
  }
};
    
 //fetch parent who logged in  informations 

 // 🔹 Fetch Parent Information
export const fetchParentInfo = () => async (dispatch) => {
  dispatch({ type: "FETCH_PARENT_INFO_REQUEST" });

  try {
    const token = await AsyncStorage.getItem("token");

    if (!token) {
      console.error("❌ No auth token found");
      dispatch({ type: "FETCH_PARENT_INFO_FAILURE", payload: "Unauthorized access (No token)" });
      return;
    }

    const response = await fetch(`${API_URL}/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // ✅ Send authentication token
      },
    });

    const data = await response.json();
    if (response.ok) {
      dispatch({ type: "FETCH_PARENT_INFO_SUCCESS", payload: data });
    } else {
      console.error("❌ API Error:", data);
      dispatch({ type: "FETCH_PARENT_INFO_FAILURE", payload: data.error || "Failed to fetch parent info" });
    }
  } catch (error) {
    console.error("❌ Error fetching parent info:", error);
    dispatch({ type: "FETCH_PARENT_INFO_FAILURE", payload: error.message });
  }
};
 ////////////////////////////fetching webinars by level_id

 // Action Types
export const FETCH_WEBINARS_REQUEST = "FETCH_WEBINARS_REQUEST";
export const FETCH_WEBINARS_SUCCESS = "FETCH_WEBINARS_SUCCESS";
export const FETCH_WEBINARS_FAILURE = "FETCH_WEBINARS_FAILURE";

// Fetch webinars by level_id
export const fetchWebinarsByLevel = (levelId) => async (dispatch) => {
  dispatch({ type: "FETCH_WEBINARS_REQUEST" });

  try {

      const response = await fetch(`${API_URL}/webinars/level/${levelId}`);
      const data = await response.json();

      if (response.ok) {
          dispatch({ type: "FETCH_WEBINARS_SUCCESS", payload: data || [] });
      } else {
          console.error("❌ API Error fetching webinars:", data.error);
          dispatch({ type: "FETCH_WEBINARS_FAILURE", payload: data.error });
      }
  } catch (error) {
      console.error("❌ Network error fetching webinars:", error);
      dispatch({ type: "FETCH_WEBINARS_FAILURE", payload: "Failed to fetch webinars" });
  }
};
// fetching teacher informations
// fetching teacher informations
export const FETCH_TEACHER_REQUEST = "FETCH_TEACHER_REQUEST";
export const FETCH_TEACHER_SUCCESS = "FETCH_TEACHER_SUCCESS";
export const FETCH_TEACHER_FAILURE = "FETCH_TEACHER_FAILURE";
export const SET_IS_FOLLOWING = "SET_IS_FOLLOWING";
export const SET_FOLLOWERS_COUNT = "SET_FOLLOWERS_COUNT";

// Fetch teacher profile and follow info
export const fetchTeacherById = (id) => async (dispatch) => {
  dispatch({ type: FETCH_TEACHER_REQUEST });

  try {
    const response = await fetch(`${API_URL}/teachers/${id}`);
    const text = await response.text();

    const data = JSON.parse(text);

    if (!response.ok) throw new Error(data.error || "Failed to fetch teacher");

    dispatch({ type: FETCH_TEACHER_SUCCESS, payload: data });

    const activeChildString = await AsyncStorage.getItem("activeChild");
const activeChild = activeChildString ? JSON.parse(activeChildString) : null;

// Vérifier si l'enfant est dans la liste des followers
const isFollowing = data.followers?.some(f => f.follower_user?.id === activeChild?.id);

dispatch({ type: SET_IS_FOLLOWING, payload: isFollowing });
dispatch({ type: SET_FOLLOWERS_COUNT, payload: data.followers?.length || 0 });


  } catch (error) {
    console.error("❌ Error fetching teacher:", error.message);
    dispatch({ type: FETCH_TEACHER_FAILURE, payload: error.message });
  }
};

// Toggle follow/unfollow status
export const toggleFollow = (teacherId) => async (dispatch, getState) => {
  try {
    // 1️⃣ Obtenir l'enfant actif
    const activeChildString = await AsyncStorage.getItem("activeChild");

    if (!activeChildString) {
      console.warn("⚠️ Aucun enfant sélectionné");
      return;
    }

    const activeChild = JSON.parse(activeChildString);
    const follower = activeChild.id;

    // 2️⃣ Vérifier si l'enfant suit déjà l'enseignant
    const isFollowingRes = await fetch(`${API_URL}/follows/is-following/${follower}/${teacherId}`);
    const { isFollowing } = await isFollowingRes.json();

    // 3️⃣ Déterminer l'action → follow ou unfollow
    const url = `${API_URL}/follows/${isFollowing ? "unsubscribe" : "subscribe"}`;
    const method = isFollowing ? "DELETE" : "POST";

    const followRes = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ follower, user_id: teacherId }),
    });

    const followData = await followRes.json();

    if (!followRes.ok) {
      console.warn("❌ Erreur lors du follow/unfollow :", followData?.error || "Erreur inconnue");
      return;
    }

    // 4️⃣ Récupérer l'état actuel
    const currentFollowersCount = getState().auth.followersCount;
    const currentTeacherProfile = getState().auth.teacherProfile;

    // 5️⃣ Calculer la nouvelle liste des followers
    let updatedFollowers = [...(currentTeacherProfile.followers || [])];

    if (!isFollowing) {
      // Suivi → Ajouter l'enfant dans la liste localement
      updatedFollowers.push({
        id: Math.random(), // ID temporaire
        follower_user: {
          id: follower,
          full_name: activeChild.full_name,
          avatar: activeChild.avatar || null,
        }
      });
    } else {
      // Désuivi → Retirer l'enfant de la liste
      updatedFollowers = updatedFollowers.filter(
        (f) => f.follower_user?.id !== follower
      );
    }

    // 6️⃣ Mettre à jour Redux → teacherProfile + followersCount + isFollowing
    dispatch({
      type: "FETCH_TEACHER_SUCCESS",
      payload: {
        ...currentTeacherProfile,
        followers: updatedFollowers,
      },
    });

    dispatch({
      type: "SET_FOLLOWERS_COUNT",
      payload: updatedFollowers.length,
    });

    dispatch({
      type: "SET_IS_FOLLOWING",
      payload: !isFollowing,
    });

    // ✅ FIN → tout est à jour localement, pas besoin de fetch global

  } catch (error) {
    console.error("❌ Follow/unfollow error:", error);
  }
};

// notifications

export const FETCH_NOTIFICATIONS_REQUEST = "FETCH_NOTIFICATIONS_REQUEST";
export const FETCH_NOTIFICATIONS_SUCCESS = "FETCH_NOTIFICATIONS_SUCCESS";
export const FETCH_NOTIFICATIONS_FAILURE = "FETCH_NOTIFICATIONS_FAILURE";

export const fetchNotifications = (childId) => async (dispatch) => {
  dispatch({ type: FETCH_NOTIFICATIONS_REQUEST });

  try {
    const response = await fetch(`${API_URL}/notifications/child/${childId}`);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Échec récupération notifications");

    dispatch({ type: FETCH_NOTIFICATIONS_SUCCESS, payload: data });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error.message);
    dispatch({ type: FETCH_NOTIFICATIONS_FAILURE, payload: error.message });
  }
};
// notification as seen
export const markNotificationAsSeen = (userId, notificationId) => async (dispatch) => {
  try {
    await fetch(`${API_URL}/notifications/child/seen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, notification_id: notificationId })
    });

    // ✅ Refetch les notifications après changement de statut
    dispatch(fetchNotifications(userId));
  } catch (error) {
    console.error("❌ Erreur lors du marquage comme lu :", error.message);
  }
};
// delete notifications 
export const deleteNotification = (userId, notificationId) => async (dispatch) => {
  try {
    await axios.delete(`${API_URL}/notifications/child/${userId}/${notificationId}`);
    dispatch(fetchNotifications(userId)); // Refresh après suppression
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification :", error);
  }
};

// fetch manuel by level and videos by mmanuel for BooksScreen 

export const FETCH_MANUELS_SUCCESS = "FETCH_MANUELS_SUCCESS";
export const FETCH_VIDEO_COUNTS_SUCCESS = "FETCH_VIDEO_COUNTS_SUCCESS";

// ✅ Fetch manuels par niveau
export const fetchManuelsByLevel = (levelId) => async (dispatch) => {
  dispatch({ type: "AUTH_LOADING" });
  try {
    const response = await fetch(`${API_URL}/manuels/level/${levelId}`);
    const data = await response.json();

    if (response.ok) {
      dispatch({ type: FETCH_MANUELS_SUCCESS, payload: data });
    } else {
      console.error("❌ Error fetching manuels:", data.error);
    }
  } catch (error) {
    console.error("❌ Error fetching manuels:", error);
  }
};

// ✅ Fetch nombre de vidéos par manuel
export const fetchVideoCounts = () => async (dispatch) => {
  try {
    const response = await fetch(`${API_URL}/videos/count-by-manuel`);
    const data = await response.json();

    if (response.ok) {
      const formatted = {};
      data.forEach((item) => {
        formatted[item.manuel_id] = item.totalVideos;
      });
      dispatch({ type: FETCH_VIDEO_COUNTS_SUCCESS, payload: formatted });
    } else {
      console.error("❌ Error fetching video counts:", data.error);
    }
  } catch (error) {
    console.error("❌ Error fetching video counts:", error);
  }
};
// ✅  rechercher des webinaires par mot clé et level_id
export const SEARCH_WEBINARS_REQUEST = "SEARCH_WEBINARS_REQUEST";
export const SEARCH_WEBINARS_SUCCESS = "SEARCH_WEBINARS_SUCCESS";
export const SEARCH_WEBINARS_FAILURE = "SEARCH_WEBINARS_FAILURE";

export const fetchWebinarsByKeyword = (levelId, keyword) => async (dispatch) => {
  dispatch({ type: "FETCH_WEBINARS_REQUEST" });

  try {
    const response = await fetch(`${API_URL}/webinars/search/${levelId}/${keyword}`);
    const data = await response.json();

    if (response.ok) {
      dispatch({ type: "FETCH_WEBINARS_SUCCESS", payload: data });
    } else {
      console.error("❌ Erreur API webinars/search :", data.error);
      dispatch({ type: "FETCH_WEBINARS_FAILURE", payload: data.error });
    }
  } catch (error) {
    console.error("❌ Erreur fetchWebinarsByKeyword :", error.message);
    dispatch({ type: "FETCH_WEBINARS_FAILURE", payload: error.message });
  }
};

// ✅ Ajouter un webinar comme favori
export const TOGGLE_FAVORITE_SUCCESS = "TOGGLE_FAVORITE_SUCCESS";
export const TOGGLE_FAVORITE_FAILURE = "TOGGLE_FAVORITE_FAILURE";
export const FETCH_FAVORITES_SUCCESS = "FETCH_FAVORITES_SUCCESS";

export const toggleFavorite = (webinarId) => async (dispatch) => {
  try {
    const tokenChild = await AsyncStorage.getItem("tokenChild"); 
    if (!tokenChild) throw new Error("Token enfant manquant !");

    const response = await fetch(`${API_URL}/likes/favorite/${webinarId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenChild}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Erreur lors du toggle favori");

    dispatch({
      type: TOGGLE_FAVORITE_SUCCESS,
      payload: { webinarId, isFavorite: data.isFavorite }
    });

    dispatch(fetchFavorites());
  } catch (error) {
    console.error("❌ Erreur toggleFavorite:", error.message);
  }
};

export const fetchFavorites = () => async (dispatch) => {
  try {
    const tokenChild = await AsyncStorage.getItem("tokenChild"); 
    
    if (!tokenChild) throw new Error("Utilisateur non authentifié.");

    const response = await fetch(`${API_URL}/likes/favorites`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenChild}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error("Erreur lors de la récupération des favoris");

    const favoritesIds = data.map((w) => w.id);
    dispatch({ type: FETCH_FAVORITES_SUCCESS, payload: favoritesIds });
  } catch (error) {
    
    console.error("❌ Erreur fetchFavorites:", error.message);
  }
};


// live Sessions = meetings 

export const FETCH_MEETINGS_REQUEST = "FETCH_MEETINGS_REQUEST";
export const FETCH_MEETINGS_SUCCESS = "FETCH_MEETINGS_SUCCESS";
export const FETCH_MEETINGS_FAILURE = "FETCH_MEETINGS_FAILURE";

export const FETCH_RESERVATIONS_REQUEST = "FETCH_RESERVATIONS_REQUEST";
export const FETCH_RESERVATIONS_SUCCESS = "FETCH_RESERVATIONS_SUCCESS";
export const FETCH_RESERVATIONS_FAILURE = "FETCH_RESERVATIONS_FAILURE";

export const UPDATE_RESERVATION_REQUEST = "UPDATE_RESERVATION_REQUEST";
export const UPDATE_RESERVATION_SUCCESS = "UPDATE_RESERVATION_SUCCESS";
export const UPDATE_RESERVATION_FAILURE = "UPDATE_RESERVATION_FAILURE";

// 🔹 Fetch All Meetings
export const fetchMeetings = () => async (dispatch) => {
  dispatch({ type: FETCH_MEETINGS_REQUEST });

  try {
    const response = await fetch(`${API_URL}/meetings`);
    const data = await response.json();

    if (response.ok) {
      dispatch({ type: FETCH_MEETINGS_SUCCESS, payload: data });
    } else {
      dispatch({ type: FETCH_MEETINGS_FAILURE, payload: data.error });
    }
  } catch (error) {
    dispatch({ type: FETCH_MEETINGS_FAILURE, payload: error.message });
  }
};
// 🔹 Fetch Meetings by Level ID
export const fetchMeetingsByLevel = (levelId) => async (dispatch) => {
  dispatch({ type: FETCH_MEETINGS_REQUEST });

  try {
    const tokenChild = await AsyncStorage.getItem("tokenChild");  // 🔥 Utilisation du token de l'enfant
    if (!tokenChild) throw new Error("Token d'enfant manquant !");

    const response = await fetch(`${API_URL}/meetings/level/${levelId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenChild}`,  // ✅ Utilisation du token d'enfant ici
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok) {
      dispatch({ type: FETCH_MEETINGS_SUCCESS, payload: data });
    } else {
      console.error("❌ Erreur API meetings : ", data.message);
      dispatch({ type: FETCH_MEETINGS_FAILURE, payload: data.message || "Erreur lors de la récupération des meetings" });
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des meetings : ", error.message);
    dispatch({ type: FETCH_MEETINGS_FAILURE, payload: error.message });
  }
};

// 🔹 Fetch Reservations by User ID CORRIGÉ
export const fetchReservationsByUserId = (userId) => async (dispatch) => {
  dispatch({ type: FETCH_RESERVATIONS_REQUEST });

  try {
    const token = await AsyncStorage.getItem("tokenChild"); // ✅ CORRIGÉ ici

    const response = await fetch(`${API_URL}/meetings/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();
    console.log("📥 [Réservations récupérées] :", JSON.stringify(data, null, 2));

    if (response.ok) {
      // ✅ Assure-toi que `data` est bien directement un tableau
      dispatch({ type: FETCH_RESERVATIONS_SUCCESS, payload: Array.isArray(data) ? data : data.reservations });
    } else {
      dispatch({ type: FETCH_RESERVATIONS_FAILURE, payload: data.error || "Erreur lors de la récupération." });
    }
  } catch (error) {
    console.error("❌ [Erreur Fetch Reservations]:", error);
    dispatch({ type: FETCH_RESERVATIONS_FAILURE, payload: error.message || "Erreur réseau" });
  }
};
// 🔹 Update Reservation
export const updateReservation = (reservationId, updateData) => async (dispatch) => {
    dispatch({ type: UPDATE_RESERVATION_REQUEST });

    try {
        const token = await AsyncStorage.getItem("token");
        const response = await fetch(`${API_URL}/meetings/reserve/${reservationId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(updateData),
        });

        const data = await response.json();

        if (response.ok) {
            dispatch({ type: UPDATE_RESERVATION_SUCCESS, payload: data });
        } else {
            dispatch({ type: UPDATE_RESERVATION_FAILURE, payload: data.error });
        }
    } catch (error) {
        dispatch({ type: UPDATE_RESERVATION_FAILURE, payload: error.message });
    }
};
export const FETCH_MEETING_BY_ID_REQUEST = "FETCH_MEETING_BY_ID_REQUEST";
export const FETCH_MEETING_BY_ID_SUCCESS = "FETCH_MEETING_BY_ID_SUCCESS";
export const FETCH_MEETING_BY_ID_FAILURE = "FETCH_MEETING_BY_ID_FAILURE";

export const fetchMeetingById = (meetingId) => async (dispatch) => {
  dispatch({ type: FETCH_MEETING_BY_ID_REQUEST });

  try {
    
    const response = await fetch(`${API_URL}/meetings/${meetingId}`);
    const data = await response.json();

    if (response.ok) {
      // Check if data is an array and has at least one element
      if (Array.isArray(data) && data.length > 0) {
        dispatch({ type: FETCH_MEETING_BY_ID_SUCCESS, payload: data[0] });
      } else if (typeof data === 'object' && data !== null) {
        // If data is a single object
        dispatch({ type: FETCH_MEETING_BY_ID_SUCCESS, payload: data });
      } else {
        console.error("❌ No meeting data found in response");
        dispatch({ type: FETCH_MEETING_BY_ID_FAILURE, payload: "No meeting data found" });
      }
    } else {
      console.error("❌ API Error:", data.message || "Failed to fetch meeting");
      dispatch({ type: FETCH_MEETING_BY_ID_FAILURE, payload: data.message || "Failed to fetch meeting" });
    }
  } catch (error) {
    console.error("❌ Error fetching meeting:", error.message);
    dispatch({ type: FETCH_MEETING_BY_ID_FAILURE, payload: error.message });
  }
}; 

export const RESERVE_MEETING_REQUEST = 'RESERVE_MEETING_REQUEST';
export const RESERVE_MEETING_SUCCESS = 'RESERVE_MEETING_SUCCESS';
export const RESERVE_MEETING_FAILURE = 'RESERVE_MEETING_FAILURE';

// Réserver un meeting
export const reserveMeeting = (meetingData, token) => async (dispatch) => {
  dispatch({ type: "RESERVE_MEETING_REQUEST" });

  try {
    const meetingDataWithSale = {
      ...meetingData,
      sale_id: meetingData.sale_id || meetingData.meeting_id
    };

    const response = await fetch(`${API_URL}/meetings/reserve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(meetingDataWithSale)
    });

    const data = await response.json();

    if (response.ok) {
      dispatch({ 
        type: "RESERVE_MEETING_SUCCESS", 
        payload: data 
      });

      // 🔥 ici le plus important
      dispatch(fetchMeetingById(meetingData.meeting_id));

      setTimeout(() => {
        dispatch({ type: "RESET_RESERVATION_SUCCESS" });
      }, 1000);
    } else {
      const errorMessage = data.message || data.error || "Erreur inconnue";
      dispatch({ 
        type: "RESERVE_MEETING_FAILURE", 
        payload: errorMessage 
      });
    }
  } catch (error) {
    dispatch({ 
      type: "RESERVE_MEETING_FAILURE", 
      payload: error.message || "Erreur de connexion au serveur"
    });
  }
};

export const CANCEL_RESERVATION_REQUEST = "CANCEL_RESERVATION_REQUEST";
export const CANCEL_RESERVATION_SUCCESS = "CANCEL_RESERVATION_SUCCESS";
export const CANCEL_RESERVATION_FAILURE = "CANCEL_RESERVATION_FAILURE";
//cancel meeting
export const cancelReservation = (reservationId) => async (dispatch) => {
  dispatch({ type: CANCEL_RESERVATION_REQUEST });
  
  try {
      const token = await AsyncStorage.getItem('tokenChild');
      if (!token) {
          throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/meetings/cancel/${reservationId}`, {
          method: 'DELETE',
          headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
          }
      });

      const data = await response.json();
      
      if (!response.ok) {
          throw new Error(data.message || 'Failed to cancel reservation');
      }

      // Make sure we include the meeting_id in the payload
      const payload = {
          ...data,
          // Only try to split reservationId if it exists and is a string
          meeting_id: data.meeting_id || (typeof reservationId === 'string' ? reservationId.split('_')[0] : null)
      };

      dispatch({ type: CANCEL_RESERVATION_SUCCESS, payload });
      
      // Refresh the meetings list to ensure it's up to date
      if (data.level_id) {
          dispatch(fetchMeetingsByLevel(data.level_id));
      }
  } catch (error) {
      dispatch({ type: CANCEL_RESERVATION_FAILURE, payload: error.message });
  }
}; 

export const ADD_TO_CART_SUCCESS = "ADD_TO_CART_SUCCESS";
export const REMOVE_FROM_CART_SUCCESS = "REMOVE_FROM_CART_SUCCESS";
export const FETCH_CART_SUCCESS = "FETCH_CART_SUCCESS";
export const CART_FAILURE = "CART_FAILURE";

// ✅ Ajouter au panier (meetings ou webinars)
export const addToCart = (payload) => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem("token");

    if (!token) throw new Error("Token parent manquant");

    console.log("🎫 TOKEN (parent) :", token);
    console.log("📦 Payload envoyé au panier :", payload);

    const response = await fetch(`${API_URL}/cart/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Erreur lors de l'ajout au panier");
    }

    dispatch({ type: ADD_TO_CART_SUCCESS, payload: data });
  } catch (error) {
    console.error("❌ Erreur addToCart:", error.message);
    dispatch({ type: CART_FAILURE, payload: error.message });

    // Optionnel : Affichage d'alerte
    Alert.alert("Erreur", error.message || "Impossible d'ajouter au panier.");
  }
};

// ✅ Supprimer du panier
export const removeFromCart = (itemId) => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Token parent manquant");

    const response = await fetch(`${API_URL}/cart/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Erreur suppression panier");

    dispatch({ type: REMOVE_FROM_CART_SUCCESS, payload: itemId });
  } catch (error) {
    console.error("❌ Erreur removeFromCart:", error.message);
    dispatch({ type: CART_FAILURE, payload: error.message });
  }
};

// ✅ Récupérer le panier (webinars et meetings inclus)
export const fetchCart = () => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) throw new Error("Token parent manquant");

    const response = await fetch(`${API_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erreur récupération panier");

    dispatch({ type: FETCH_CART_SUCCESS, payload: data });
  } catch (error) {
    console.error("❌ Erreur fetchCart:", error.message);
    dispatch({ type: CART_FAILURE, payload: error.message });
  }
};

// adding personnal photo to the parent on parentInfo screen 
export const uploadParentAvatar = (formData) => async (dispatch, getState) => {
  try {
    const token = getState().auth.authToken;
    const response = await fetch(`${API_URL}/avatar/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Mettez à jour le store Redux (option 1 : refetch user)
      dispatch(fetchParentInfo());

      // ✅ ou option 2 : mettre à jour directement
      // dispatch({ type: "FETCH_PARENT_INFO_SUCCESS", payload: { ...getState().auth.parentInfo, avatar: data.avatar } });
    } else {
      console.error("Erreur upload avatar :", data.error);
    }
  } catch (error) {
    console.error("Erreur upload avatar :", error.message);
  }
};
// // adding personnal image to kid 
// export const uploadKidAvatar = (kidId, formData) => async (dispatch, getState) => {
//   const token = await AsyncStorage.getItem("token");
//   try {
//     const response = await fetch(`${API_URL}/enfants/avatar/${kidId}`, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//       body: formData,
//     });

//     const data = await response.json();
//     if (response.ok) {
//       dispatch(fetchChildren());
//     } else {
//       console.error("Erreur avatar enfant:", data.error);
//     }
//   } catch (error) {
//     console.error("Erreur uploadKidAvatar:", error);
//   }
// };
export const SUBSCRIBE_REQUEST = "SUBSCRIBE_REQUEST";
export const SUBSCRIBE_SUCCESS = "SUBSCRIBE_SUCCESS";
export const SUBSCRIBE_FAILURE = "SUBSCRIBE_FAILURE";

// ✅ Nouvelle action pour souscrire au pack الكرطابلة
export const subscribeToPack = (selectedPayment, phone, address, paymentProof, navigation) => {
  return async (dispatch, getState) => {
    dispatch({ type: SUBSCRIBE_REQUEST });

    try {
      const token = await AsyncStorage.getItem("token"); // ✅ Token parent
      const activeChild = await AsyncStorage.getItem("activeChild");
      
      if (!token || !activeChild) {
        throw new Error("Token ou enfant actif manquant.");
      }

      const enfant = JSON.parse(activeChild);

      const formData = new FormData();
      formData.append("subscribe_id", "3");
      formData.append("amount", "80");
      formData.append("tax", "0");
      formData.append("payment_method", selectedPayment);
      formData.append("enfant_id", enfant.id.toString());
      
      if (selectedPayment === "cash") {
        formData.append("phone", phone);
        formData.append("address", address);
      }
      
      if (selectedPayment === "bank" && paymentProof) {
        formData.append("proof_file", {
          uri: paymentProof.uri,
          type: paymentProof.mimeType || "image/jpeg", // ou "application/pdf"
          name: paymentProof.name || "preuve.jpg",
        });
      } 
     // if   
      const response = await fetch(`${API_URL}/subscription/subscribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // pas de Content-Type ici ! fetch gère les boundaries automatiquement
        },
        body: formData,
      });
      

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Erreur lors de la souscription.");
      }

      dispatch({ type: SUBSCRIBE_SUCCESS });

      Alert.alert("✅ نجاح", "تم تسجيل الإشتراك بنجاح.");
      navigation.navigate("Books"); 

    } catch (error) {
      console.error("❌ Erreur abonnement:", error.message);
      dispatch({ type: SUBSCRIBE_FAILURE, payload: error.message });
      Alert.alert("❌ خطأ", error.message);
    }
  };
};
export const CHECK_SUBSCRIPTION_REQUEST = "CHECK_SUBSCRIPTION_REQUEST";
export const CHECK_SUBSCRIPTION_SUCCESS = "CHECK_SUBSCRIPTION_SUCCESS";
export const CHECK_SUBSCRIPTION_FAILURE = "CHECK_SUBSCRIPTION_FAILURE";

export const checkChildSubscription = () => {
  return async (dispatch) => {
    dispatch({ type: CHECK_SUBSCRIPTION_REQUEST });

    try {
      const token = await AsyncStorage.getItem("token");
      const activeChild = await AsyncStorage.getItem("activeChild");

      if (!token || !activeChild) {
        throw new Error("Token ou enfant actif manquant.");
      }

      const enfant = JSON.parse(activeChild);

      const response = await fetch(`${API_URL}/subscription/check-child-subscription/${enfant.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || "Erreur lors de la vérification de l'abonnement.");
      }

      dispatch({
        type: CHECK_SUBSCRIPTION_SUCCESS,
        payload: resData, // 👈 contient child_id, subscription_active, card_ordered, etc.
      });
    } catch (error) {
      dispatch({
        type: CHECK_SUBSCRIPTION_FAILURE,
        payload: error.message,
      });
    }
  };
};
//wallet 
export const checkout = () => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/wallet/checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Erreur lors du paiement");

    dispatch({ type: "CHECKOUT_SUCCESS" });
    dispatch(fetchCart());
  } catch (error) {
    dispatch({ type: "CHECKOUT_FAILURE", payload: error.message });
  }
};
export const getWalletBalance = () => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/wallet/balance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    dispatch({
      type: "SET_WALLET_BALANCE",
      payload: parseFloat(data.balance) || 0,
    });
  } catch (error) {
    console.error("❌ Erreur getWalletBalance:", error.message);
  }
};

export const rechargeWallet = (amount) => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem("token");
    const response = await fetch(`${API_URL}/wallet/recharge`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message);

    dispatch({ type: "RECHARGE_WALLET_SUCCESS", payload: data.newBalance });
  } catch (error) {
    dispatch({ type: "RECHARGE_WALLET_FAILURE", payload: error.message });
  }
};

// parent dashboard for child actions 
export const FETCH_DASHBOARD_SUCCESS = 'FETCH_DASHBOARD_SUCCESS';

export const fetchDashboardKpi = (childId) => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem("token"); // 🔑 token parent
    if (!token) throw new Error("Token manquant");

    const response = await fetch(`${API_URL}/parent/dashboard/${childId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Dashboard API error:", data);
      throw new Error(data.error || "Erreur dashboard");
    }

    dispatch({
      type: FETCH_DASHBOARD_SUCCESS,
      payload: data
    });

  } catch (error) {
    console.error("Erreur fetchDashboardKpi:", error.message);
  }
};
// log child activities 
export const logChildActivity = async ({ action_type, screen_name = null, reference_id = null, duration = 0 }) => {
  try {
    const token = await AsyncStorage.getItem('token'); // parent token
    const childData = await AsyncStorage.getItem('activeChild');
    const child = JSON.parse(childData);

    if (!child?.id || !token) return;

    await fetch(`${API_URL}/parent/activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        child_id: child.id,
        action_type,
        screen_name,
        reference_id,
        duration
      })
    });
  } catch (error) {
    console.error('❌ logChildActivity error:', error.message);
  }
};
// like video manuels 
export const toggleLikeVideo = (videoId) => async (dispatch) => {
  try {
    const token = await AsyncStorage.getItem("tokenChild");

    if (!token) {
      console.warn("⚠️ Aucun token enfant trouvé !");
      return;
    }

    const response = await fetch(`${API_URL}/likes/toggle/${videoId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    const liked = data.message === "Like ajouté";

    dispatch({
      type: "TOGGLE_VIDEO_LIKE",
      payload: { videoId, liked },
    });

    return liked; // 👈 important
  } catch (error) {
    console.error("❌ [Redux] Erreur lors du like vidéo :", error);
  }
};

// follow teacher on video screen 
export const toggleFollowSimple = (teacherId) => async () => {
  try {
    const activeChildString = await AsyncStorage.getItem("activeChild");
    const token = await AsyncStorage.getItem("tokenChild");

    if (!activeChildString || !token) {
      console.warn("⚠️ Enfant ou token non trouvé");
      return;
    }

    const activeChild = JSON.parse(activeChildString);
    const follower = activeChild.id;

    const isFollowingRes = await fetch(`${API_URL}/follows/is-following/${follower}/${teacherId}`);
    const { isFollowing } = await isFollowingRes.json();

    const url = `${API_URL}/follows/${isFollowing ? "unsubscribe" : "subscribe"}`;
    const method = isFollowing ? "DELETE" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ Auth obligatoire
      },
      body: JSON.stringify({ follower, user_id: teacherId }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Erreur backend :", text);
    } else {
      console.log(`✅ ${isFollowing ? "Désabonné" : "Abonné"} avec succès`);
    }
  } catch (error) {
    console.error("❌ Erreur toggleFollowSimple :", error);
  }
};
