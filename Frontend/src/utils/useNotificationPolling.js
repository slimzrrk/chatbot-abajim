import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { fetchNotifications } from "../reducers/auth/AuthAction";

const useNotificationPolling = () => {
  const dispatch = useDispatch();
  const activeChild = useSelector((state) => state.auth.activeChild);

  useEffect(() => {
    if (!activeChild?.id) return;

    const interval = setInterval(() => {
      dispatch(fetchNotifications(activeChild.id));
    }, 15000); // toutes les 15 secondes

    return () => clearInterval(interval); // nettoyage propre
  }, [dispatch, activeChild]);
};
export default useNotificationPolling; 