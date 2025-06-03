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
  cubeOutline,
  bagHandleOutline,
  cartOutline,
} from "ionicons/icons";
import { Redirect, Route } from "react-router-dom";

/* Screens */
import MenuLayout from "../Layout/MenuLayout";
import NotFound from "@/pages/Error/NotFound";

import HomeScreen from "@/pages/Home/Home";
import ProductListScreen from "@/pages/Product/ProductList/ProductList";
import ProductDetailScreen from "@/pages/Product/ProductDetail/ProductDetail";

import InventoryScreen from "@/pages/Inventory/Inventory";
// import TransactionScreen from "@/pages/Transaction/TransactionList";

import ReceiptImportCreateScreen from "@/pages/Receipt/ReceiptImport/ReceiptImportCreate";
import ReceiptImportDetailScreen from "@/pages/Receipt/ReceiptImport/ReceiptImportDetail";
import ReceiptCheckDetailScreen from "@/pages/Receipt/ReceiptCheck/ReceiptCheckDetail";

import OrderCreateScreen from "@/pages/Order/OrderCreate";
import OrderListScreen from "@/pages/Order/OrderList";

import "./TabBar.css";

const tabs = [
  { icon: home, label: "Trang chủ", path: "/tabs/home" },
  { icon: cartOutline, label: "Đơn hàng", path: "/tabs/orders" },
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
          path="/tabs/receipt-import/detail/:id"
          component={ReceiptImportDetailScreen}
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

        {/* Order Screens */}
        <Route
          exact
          path="/tabs/order/create"
          component={OrderCreateScreen}
        />
        <Route
          exact
          path="/tabs/orders"
          component={OrderListScreen}
        />

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
