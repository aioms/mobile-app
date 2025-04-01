import React from "react";
import {
  IonTabs,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from "@ionic/react";
import {
  home,
  cashOutline,
  cubeOutline,
  bagHandleOutline,
} from "ionicons/icons";
import { Redirect, Route } from "react-router-dom";

/* Screens */
import MenuLayout from "../Layout/MenuLayout";

import HomeScreen from "@/pages/Home/Home";
import InventoryScreen from "@/pages/Inventory/Inventory";
import ProductListScreen from "@/pages/Product/ProductList/ProductList";
import ProductDetailScreen from "@/pages/Product/ProductDetail/ProductDetail";
import TransactionScreen from "@/pages/Transaction/TransactionList";
import ReceiptImportCreateScreen from "@/pages/Receipt/ReceiptImport/ReceiptImportCreate";
import ReceiptCheckDetailScreen from "@/pages/Receipt/ReceiptCheck/ReceiptCheckDetail";

/* Hooks */
// import { useAuth } from "../../hooks";

import "./TabBar.css";
import NotFound from "@/pages/Error/NotFound";

const tabs = [
  { icon: home, label: "Trang chủ", path: "/tabs/home" },
  { icon: cashOutline, label: "Giao dịch", path: "/tabs/transaction" },
  { icon: cubeOutline, label: "Quản lý kho", path: "/tabs/inventory" },
  { icon: bagHandleOutline, label: "Sản phẩm", path: "/tabs/product" },
  // { icon: statsChartOutline, label: "Báo cáo", path: "/tabs/report" },
];

const TabBar: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route
          exact
          path="/tabs/home"
          children={
            <MenuLayout
              component={<HomeScreen />}
              isHeaderDefault
              title="Trang chủ"
            />
          }
        />

        {/* Transaction Screens */}
        <Route
          exact
          path="/tabs/transaction"
          children={
            <MenuLayout
              component={<TransactionScreen />}
              isHeaderDefault
              title="Giao dịch"
            />
          }
        />

        {/* Inventory Screens */}
        <Route
          exact
          path="/tabs/inventory"
          children={<MenuLayout component={<InventoryScreen />} />}
        />

        {/* Receipt Screens */}
        <Route
          exact
          path="/tabs/receipt-import/create"
          children={<MenuLayout component={<ReceiptImportCreateScreen />} />}
        />
        <Route
          exact
          path="/tabs/receipt-check/:id"
          component={ReceiptCheckDetailScreen}
        />

        {/* Product Screens */}
        <Route
          exact
          path="/tabs/product"
          children={
            <MenuLayout
              component={<ProductListScreen />}
              isHeaderDefault
              title="Danh sách sản phẩm"
            />
          }
        />
        <Route exact path="/tabs/product/:id" component={ProductDetailScreen} />

        <Route component={NotFound} />

        <Route exact path="/tabs">
          <Redirect to="/tabs/home" />
        </Route>
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="custom-tab-bar">
        {tabs.map((tab, index) => (
          <IonTabButton key={index} tab={`tab${index + 1}`} href={tab.path}>
            <IonIcon icon={tab.icon} />
            <IonLabel>{tab.label}</IonLabel>
          </IonTabButton>
        ))}
      </IonTabBar>
    </IonTabs>
  );
};

export default TabBar;
