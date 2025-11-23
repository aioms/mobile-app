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
import { Redirect as RouterRedirect, Route as RouterRoute } from "react-router-dom";

// Type assertion to fix React Router v5 compatibility with React 18
const Route = RouterRoute as any;
const Redirect = RouterRedirect as any;

/* Screens */
import MenuLayout from "../Layout/MenuLayout";
import NotFound from "@/pages/Error/NotFound";

import HomeScreen from "@/pages/Home/Home";
import ProductListScreen from "@/pages/Product/ProductList";
import ProductDetailScreen from "@/pages/Product/ProductDetail";
import ProductCreateScreen from "@/pages/Product/ProductCreate";

import InventoryScreen from "@/pages/Inventory/Inventory";

import ReceiptImportCreateScreen from "@/pages/Receipt/ReceiptImport/ReceiptImportCreate";
import ReceiptImportDetailScreen from "@/pages/Receipt/ReceiptImport/ReceiptImportDetail";

import ReceiptCheckDetailScreen from "@/pages/Receipt/ReceiptCheck/ReceiptCheckDetail";

import ReceiptDebtCreateScreen from "@/pages/Receipt/ReceiptDebt/ReceiptDebtCreate";
import ReceiptDebtDetailScreen from "@/pages/Receipt/ReceiptDebt/ReceiptDebtDetail";
import ReceiptDebtUpdateScreen from "@/pages/Receipt/ReceiptDebt/ReceiptDebtUpdate";
import ReceiptDebtPeriodScreen from "@/pages/Receipt/ReceiptDebt/ReceiptDebtPeriod";

import OrderCreateScreen from "@/pages/Order/OrderCreate";
import OrderDetailScreen from "@/pages/Order/OrderDetail";
import OrderUpdateScreen from "@/pages/Order/OrderUpdate";
import OrderPage from "@/pages/Order";

import "./TabBar.css";

const tabs = [
  { icon: home, label: "Trang chủ", path: "/tabs/home" },
  { icon: cartOutline, label: "Đơn hàng", path: "/tabs/orders" },
  { icon: cubeOutline, label: "Quản lý kho", path: "/tabs/inventory" },
  { icon: bagHandleOutline, label: "Sản phẩm", path: "/tabs/products" },
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

        {/* Receipt import Screens */}
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

        {/* Receipt check Screens */}
        <Route
          exact
          path="/tabs/receipt-check/:id"
          component={ReceiptCheckDetailScreen}
        />

        {/* Receipt debt Screens */}
        <Route
          exact
          path="/tabs/debt/create"
          component={ReceiptDebtCreateScreen}
        />
        <Route
          exact
          path="/tabs/debt/detail/:id"
          component={ReceiptDebtDetailScreen}
        />
        <Route
          exact
          path="/tabs/debt/update/:id"
          component={ReceiptDebtUpdateScreen}
        />
        <Route
          exact
          path="/tabs/debt/period/:id"
          component={ReceiptDebtPeriodScreen}
        />

        {/* Product Screens */}
        <Route exact path="/tabs/products" component={ProductListScreen} />
        <Route
          exact
          path="/tabs/products/create"
          component={ProductCreateScreen}
        />
        <Route
          exact
          path="/tabs/products/detail/:id"
          component={ProductDetailScreen}
        />

        {/* Order Screens */}
        <Route exact path="/tabs/orders" component={OrderPage} />
        <Route exact path="/tabs/orders/create" component={OrderCreateScreen} />
        <Route
          exact
          path="/tabs/orders/detail/:id"
          component={OrderDetailScreen}
        />
        <Route
          exact
          path="/tabs/orders/update/:id"
          component={OrderUpdateScreen}
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
