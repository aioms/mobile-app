import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonAvatar,
} from "@ionic/react";
import {
  personCircle,
  notificationsOutline,
  settingsOutline,
  cubeOutline,
  logOutOutline,
} from "ionicons/icons";
import { useAuth } from "../../hooks";
import { useHistory } from "react-router";

import "./MenuBar.css";

const routes = [
  {
    title: "Quản lý tài khoản",
    path: "/tabs/user",
    icon: personCircle,
  },
  {
    title: "Thông báo",
    path: "/tabs/notification",
    icon: notificationsOutline,
  },
  {
    title: "Cài đặt",
    path: "/tabs/setting",
    icon: settingsOutline,
  },
];

// Default avatar for fallback
const defaultAvatar =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

const MenuBar: React.FC = () => {
  const history = useHistory();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    history.replace("/login");
  };

  // Get user data with fallbacks
  const displayName = user?.fullname || user?.username || "Người dùng";
  const displayEmail = user?.username || "user@aios.com";
  const displayAvatar = defaultAvatar; // You can add user.avatar if available in the User type

  return (
    <IonMenu type="push" contentId="main-content">
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>
            <IonItem lines="none" className="menu-logo">
              <div className="flex items-center justify-center w-full py-4">
                <IonIcon
                  icon={cubeOutline}
                  className="text-primary w-12 h-12"
                />
                <span className="text-xl font-bold ml-2 text-primary">
                  AIOM
                </span>
              </div>
            </IonItem>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList>
          <IonItem lines="none" className="menu-avatar">
            <div className="flex items-center w-full p-4 bg-primary-50">
              <IonAvatar className="w-16 h-16">
                <img src={displayAvatar} alt="Avatar" />
              </IonAvatar>
              <div className="ml-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {displayName}
                </h2>
                <p className="text-sm text-gray-500">{displayEmail}</p>
              </div>
            </div>
          </IonItem>

          {routes.map((route, index) => (
            <IonMenuToggle key={index} autoHide={false}>
              <IonItem
                className={location.pathname === route.path ? "selected" : ""}
                routerLink={route.path}
                routerDirection="none"
                lines="none"
                detail={false}
              >
                <IonIcon slot="start" icon={route.icon} />
                <IonLabel>{route.title}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
          <IonMenuToggle autoHide={false}>
            <IonItem onClick={handleLogout} lines="none">
              <IonIcon slot="start" color="danger" icon={logOutOutline} />
              <IonLabel color="danger">Đăng xuất</IonLabel>
            </IonItem>
          </IonMenuToggle>
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default MenuBar;
