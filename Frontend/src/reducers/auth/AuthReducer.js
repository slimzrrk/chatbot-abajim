const initialState = {
    authToken: null,
    userInfo: null,
    isLoading: false,
    error: null,
    children: [],
    userHasKids: false,  
    documentData: null, 
    activeChild: null, 
    correctionVideoUrl: null, 
    parentInfo: null,
    webinars: [], 
    otpVerified: false,
    teacherProfile: {},
    isFollowing: false,
    followersCount: 0,
    notifications: [],
    manuals: [],
    videoCounts: {},
    meeting: null,
    meetings: [], 
    loading: false, 
    loadingMeetings: false,
    reservations: [],
    reservationSuccess: false,
    updatedReservation: null,
    reservationError: null,
    cancelLoading: false,
    cancelError: null,
    cancelSuccess: false,
    sale: null,
    saleError: null,
    orderSuccess: false,
    cartItems: [],
    child: null,
    token: null,
    isInitialized: false,
    loadingSubscription: false,
  subscriptionInfo: null, 
  subscriptionError: null,
  walletBalance: 0,
  dashboardKpi: null,
  videoLikes: {},

  



};

const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case "AUTH_LOADING":
        case "DOCUMENT_LOADING":
        case "FETCH_CORRECTION_VIDEO_REQUEST":
            return {
                ...state,
                isLoading: true,
                correctionVideoUrl: null,
                error: null,
            };
        case "FETCH_WEBINARS_REQUEST": // ✅ Added webinars loading state
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        case "SEND_OTP_REQUEST":
        case "VERIFY_OTP_REQUEST":
        case "RESET_PASSWORD_REQUEST":
            return {
                ...state,
                isLoading: true,
                error: null,
            };
        
        case "SEND_OTP_SUCCESS":
            return {
                ...state,
                isLoading: false,
                error: null,
            };
        
        case "VERIFY_OTP_SUCCESS":
            return {
                ...state,
                otpVerified: true,
                isLoading: false,
                error: null,
            };
        
        case "RESET_PASSWORD_SUCCESS":
            return {
                ...state,
                otpVerified: false, // Réinitialiser après changement du mot de passe
                isLoading: false,
                error: null,
                };
        
        case "SEND_OTP_FAILURE":
        case "VERIFY_OTP_FAILURE":
        case "RESET_PASSWORD_FAILURE":
            return {
                ...state,
                isLoading: false,
                error: action.payload,
                };
        
        case "LOGIN_SUCCESS":
            return {
                ...state,
                authToken: action.payload,
                isLoading: false,
                error: null,
            };

        case "FETCH_CHILDREN_SUCCESS":
            return {
                ...state,
                isLoading: false,
                children: action.payload, 
                userHasKids: action.payload.length > 0,  // ✅ Ensure `userHasKids` updates
            };

        case "LOGIN_FAIL":
        case "DOCUMENT_FAIL":
        case "ADD_CHILD_FAIL":
        case "FETCH_CHILDREN_FAILURE":
        case "FETCH_WEBINARS_FAILURE": // ✅ Handle webinars fetch failure
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            };

        case "DOCUMENT_SUCCESS":
            return {
                ...state,
                documentData: action.payload,
                isLoading: false,
                error: null,
            };

        case "FETCH_CORRECTION_VIDEO_SUCCESS":
            return {
                ...state,
                isLoading: false,
                correctionVideoUrl: action.payload, // ✅ URL de la vidéo
                error: null,
            };
        case "FETCH_CORRECTION_VIDEO_FAILURE":
            return {
                ...state,
                isLoading: false,
                correctionVideoUrl: null,
                error: action.payload, // ✅ message d’erreur
            };
        case "FETCH_WEBINARS_SUCCESS": // ✅ Handle webinars success
            return {
                ...state,
                webinars: action.payload, // ✅ Store fetched webinars
                isLoading: false,
                error: null,
            };

        case "LOGOUT":
            return {
                ...initialState, 
            };

        case "ADD_CHILD_SUCCESS":
            const updatedChildren = [...state.children, action.payload];
            return {
                ...state,
                children: updatedChildren,
                userHasKids: true, 
                isLoading: false,
                error: null,
                activeChild: state.activeChild || action.payload, // ✅ If first child, auto-set
            };

        case "SWITCH_ACTIVE_CHILD":
            return {
                ...state,
                activeChild: action.payload.child, // ✅ Update active child
                authToken: action.payload.token, // ✅ Update token
                children: action.payload.children || state.children, // ✅ Ensure children persist
            }; 
            case "FETCH_ACTIVE_CHILD_SUCCESS":
                return {
                    ...state,
                    activeChild: action.payload,
                };
    
            case "FETCH_ACTIVE_CHILD_FAILURE":
                return {
                    ...state,
                    activeChild: null,
                };
    
            case "SET_ACTIVE_CHILD":
                return {
                    ...state,
                    activeChild: action.payload,
                };
    
        case "UPDATE_CHILD_REQUEST":
            return {
                ...state,
                isLoading: true,
                error: null,
            };
              
        case "UPDATE_CHILD_SUCCESS":
            return {
                ...state,
                children: state.children.map((child) =>
                    child.id === action.payload.id ? action.payload : child
                ),
                isLoading: false,
                error: null,
            };
              
        case "UPDATE_CHILD_FAILURE":
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            };

        case "FETCH_PARENT_INFO_REQUEST":
            return {
                ...state,
                isLoading: true,
                error: null,
            };

            case "FETCH_PARENT_INFO_SUCCESS":
                return {
                  ...state,
                  parentInfo: action.payload,
                  isLoading: false,
                  error: null,
                };
              

        case "FETCH_PARENT_INFO_FAILURE":
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            }; 
            case "UPDATE_AVATAR_SUCCESS":
                return {
                  ...state,
                  parentInfo: {
                    ...state.parentInfo,
                    avatar: action.payload,
                  },
                  isLoading: false,
                  error: null,
                };
        case "FETCH_TEACHER_REQUEST":
            return {
                ...state,
                isLoading: true,
                error: null,
            };
              
        case "FETCH_TEACHER_SUCCESS":
            return {
                ...state,
                isLoading: false,
                teacherProfile: action.payload,
                error: null,
            };
              
        case "FETCH_TEACHER_FAILURE":
            return {
                ...state,
                isLoading: false,
                error: action.payload,
            };
        case "SET_IS_FOLLOWING":
            return {
                ...state,
                isFollowing: action.payload,
            };
              
        case "SET_FOLLOWERS_COUNT":
            return {
                ...state,
                followersCount: action.payload,
            };
        case "FETCH_NOTIFICATIONS_REQUEST":
            return { ...state, isLoading: true };
              
        case "FETCH_NOTIFICATIONS_SUCCESS":
            return { ...state, notifications: action.payload, isLoading: false };
              
        case "FETCH_NOTIFICATIONS_FAILURE":
            return { ...state, isLoading: false, error: action.payload };
            case "MARK_NOTIFICATION_AS_SEEN":
                return {
                  ...state,
                  notifications: state.notifications.map((notif) =>
                    notif.id === action.payload
                      ? { ...notif, statuses: [{ seen_at: Date.now() }] }
                      : notif
                  )
                };
        case "FETCH_MANUELS_SUCCESS":
            return {
                ...state,
                manuals: action.payload,
                isLoading: false,
            };
              
        case "FETCH_VIDEO_COUNTS_SUCCESS":
            return {
                 ...state,
                videoCounts: action.payload,
                isLoading: false,
            };
        case "TOGGLE_FAVORITE_SUCCESS":
            return {
                ...state,
                webinars: state.webinars.map((webinar) =>
                webinar.id === action.payload.webinarId
                    ? { ...webinar, isFavorite: action.payload.isFavorite }
                    : webinar
                ),
            };
              
        case "FETCH_FAVORITES_SUCCESS":
            return {
                ...state,
                favorites: action.payload,
                webinars: state.webinars.map((webinar) => ({
                ...webinar,
                isFavorite: action.payload.includes(webinar.id),
                })),
            };
            case "FETCH_MEETINGS_REQUEST":
            return { ...state, loadingMeetings: true };

        case "FETCH_MEETINGS_SUCCESS":
            return { ...state, meetings: action.payload, loadingMeetings: false };

        case "FETCH_MEETINGS_FAILURE":
            return { ...state, loadingMeetings: false, error: action.payload };
        case "FETCH_RESERVATIONS_REQUEST":
        case "UPDATE_RESERVATION_REQUEST":
            return { ...state, isLoading: true, error: null };
        
        case "FETCH_RESERVATIONS_SUCCESS":
            return { ...state, reservations: action.payload, isLoading: false };
        
        case "FETCH_RESERVATIONS_FAILURE":
            return { ...state, error: action.payload, isLoading: false };
        
        case "UPDATE_RESERVATION_SUCCESS":
            return { 
                    ...state,
                    updatedReservation: action.payload,
                    isLoading: false,
                    reservations: state.reservations.map(res => 
                        res.id === action.payload.id ? action.payload : res
                    )
                };
                
        case "UPDATE_RESERVATION_FAILURE":
            return { ...state, error: action.payload, isLoading: false };          
        case "FETCH_MEETING_BY_ID_REQUEST":
            return { ...state, loading: true, error: null };
                
            case "FETCH_MEETING_BY_ID_SUCCESS":
                return { ...state, loading: false, meeting: action.payload };
                
        case "FETCH_MEETING_BY_ID_FAILURE":
            return { ...state, loading: false, error: action.payload };              
        case "RESERVE_MEETING_REQUEST":
            return { 
                ...state, 
                loading: true, 
                reservationSuccess: false, 
                error: null 
            };
        case "RESERVE_MEETING_SUCCESS":
            return { 
                    ...state, 
                    loading: false, 
                    reservationSuccess: true,
                    reservations: [...state.reservations, action.payload] 
            };
        case "RESET_RESERVATION_SUCCESS": // Add this case to reset the flag
            return { 
                    ...state, 
                    reservationSuccess: false 
            };
        case "RESERVE_MEETING_FAILURE":
            return { 
                ...state, 
                loading: false, 
                reservationSuccess: false, 
                error: action.payload 
            };
        case "CANCEL_RESERVATION_REQUEST":
            return {
                    ...state,
                    cancelLoading: true,
                    cancelError: null,
                    cancelSuccess: false
                };
            case "CANCEL_RESERVATION_SUCCESS":
                return {
                        ...state,
                        cancelLoading: false,
                        cancelSuccess: true,
                        currentMeeting: state.currentMeeting ? {
                            ...state.currentMeeting,
                            isReserved: false,
                            reservationId: null,
                            status: "available"
                        } : null,
                        meetings: state.meetings.map(meeting => 
                            meeting.id === action.payload.meeting_id 
                                ? { 
                                    ...meeting, 
                                    isReserved: false, 
                                    reservationId: null,
                                    status: "available"
                                } 
                                : meeting
                        )
                };
        case "CANCEL_RESERVATION_FAILURE":
            return {
                    ...state,
                    cancelLoading: false,
                    cancelError: action.payload,
                    cancelSuccess: false
                };
                case "CHECKOUT_REQUEST":
                    return {
                      ...state,
                      isLoading: true,
                      orderSuccess: false,
                      error: null,
                    };
                  
                  case "CHECKOUT_SUCCESS":
                    return {
                      ...state,
                      isLoading: false,
                      orderSuccess: true,
                      error: null,
                      cartItems: [], // facultatif si tu veux vider le panier
                    };
                  
                  case "CHECKOUT_FAILURE":
                    return {
                      ...state,
                      isLoading: false,
                      orderSuccess: false,
                      error: action.payload,
                    };                  
        case "SET_CART_ITEMS":
            return {
                      ...state,
                      cartItems: action.payload
                };
        case "FETCH_CART_SUCCESS":
            return { ...state, cartItems: action.payload, isLoading: false };
                  
        case "ADD_TO_CART_SUCCESS":
            return { ...state, cartItems: [action.payload, ...state.cartItems] };
                  
        case "REMOVE_FROM_CART_SUCCESS":
            return {
                      ...state,
                      cartItems: state.cartItems.filter((item) => item.id !== action.payload),
                };
                  
        case "CART_FAILURE":
            return { ...state, isLoading: false, error: action.payload };
                  
        case "SUBSCRIBE_REQUEST":
            return { ...state, isLoading: true, error: null };
                  
        case "SUBSCRIBE_SUCCESS":
            return { ...state, isLoading: false, error: null };
                  
        case "SUBSCRIBE_FAILURE":
            return { ...state, isLoading: false, error: action.payload };
        case "FETCH_CHILD_LOADING":
            return {
                  ...state,
                  loading: true,
                  error: null,
            };
          
        case "FETCH_CHILD_SUCCESS":
            return {
                  ...state,
                  loading: false,
                  child: action.payload,
                  error: null,
            };
          
        case "FETCH_CHILD_ERROR":
            return {
                  ...state,
                  loading: false,
                  child: null,
                  error: action.error,
            };                            
            case "INIT_DONE":
                return { ...state, isInitialized: true };       
                case "CHECK_SUBSCRIPTION_REQUEST":
                    return {
                      ...state,
                      loadingSubscription: true,
                      subscriptionError: null,
                    };
              
                  case "CHECK_SUBSCRIPTION_SUCCESS":
                    return {
                      ...state,
                      loadingSubscription: false,
                      subscriptionInfo: action.payload, // 👈 Contient child_id, subscription_active, etc.
                    };
              
                  case "CHECK_SUBSCRIPTION_FAILURE":
                    return {
                      ...state,
                      loadingSubscription: false,
                      subscriptionError: action.payload,
                    }; 
                    case "SET_WALLET_BALANCE":
                        return { ...state, walletBalance: action.payload };
                      
                      case "RECHARGE_WALLET_SUCCESS":
                        return { ...state, walletBalance: action.payload };
                      
                      case "RECHARGE_WALLET_FAILURE":
                        return { ...state, error: action.payload };
            case "FETCH_DASHBOARD_SUCCESS":
            return {
                ...state,
                dashboardKpi: action.payload,
            }; 
            case "TOGGLE_VIDEO_LIKE":
  return {
    ...state,
    videoLikes: {
      ...state.videoLikes,
      [action.payload.videoId]: action.payload.liked,
    },
  };
                   
        default:
            return state;
    }
};

export default authReducer;
