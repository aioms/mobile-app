import React, { useCallback, useRef, useState } from "react";
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  IonFab,
  IonFabButton,
  IonList,
} from "@ionic/react";
import {
  scanOutline,
  searchOutline,
  trashOutline,
  arrowDownOutline,
} from "ionicons/icons";
import { OrderItemsSectionProps } from "./orderUpdate.d";

/**
 * @deprecated TODO: Remove this in future
 * OrderItemsSection component manages the order items list with functionality for:
 * - Barcode scanning
 * - Product search
 * - Item quantity and price editing
 * - Item removal
 * - Scroll behavior with down arrow indicator
 * 
 * @param orderItems - Array of order items
 * @param showDownArrow - Whether to show the down arrow indicator
 * @param onScanBarcode - Callback for barcode scanning
 * @param onSearchProduct - Callback for product search
 * @param onItemChange - Callback for item changes (quantity, price)
 * @param onRemoveItem - Callback for item removal
 */
const OrderItemsSection: React.FC<OrderItemsSectionProps> = React.memo(({
  orderItems,
  showDownArrow,
  onScanBarcode,
  onSearchProduct,
  onItemChange,
  onRemoveItem,
}) => {
  const orderItemsRef = useRef<HTMLIonListElement>(null);
  const [quantityInputValues, setQuantityInputValues] = useState<Record<number, string>>({});
  const [quantityErrors, setQuantityErrors] = useState<Record<number, string>>({});
  const [shipNowStates, setShipNowStates] = useState<Record<number, boolean>>({});

  const minQuantity = 1;
  const defaultMaxQuantity = 9999;

  const validateQuantity = (value: number, maxQuantity: number = defaultMaxQuantity): { isValid: boolean; error?: string } => {
    if (isNaN(value)) {
      return { isValid: false, error: "Vui lòng nhập số hợp lệ" };
    }
    if (value < minQuantity) {
      return { isValid: false, error: `Số lượng tối thiểu là ${minQuantity}` };
    }
    if (value > maxQuantity) {
      return { isValid: false, error: `Số lượng tối đa là ${maxQuantity}` };
    }
    return { isValid: true };
  };

  const getMaxQuantity = (index: number) => {
    const item = orderItems[index];
    const isShipNow = shipNowStates[index] || false;
    return isShipNow ? defaultMaxQuantity : (item.inventory ?? defaultMaxQuantity);
  };

  const handleQuantityInputChange = (index: number, value: string) => {
    setQuantityInputValues(prev => ({ ...prev, [index]: value }));
    const numericValue = parseInt(value, 10);
    
    if (value === "" || isNaN(numericValue)) {
      setQuantityErrors(prev => ({ ...prev, [index]: "Vui lòng nhập số hợp lệ" }));
      return;
    }
    
    const item = orderItems[index];
    const isShipNow = shipNowStates[index] || false;
    const maxQuantity = isShipNow ? defaultMaxQuantity : (item.inventory ?? defaultMaxQuantity);
    const validation = validateQuantity(numericValue, maxQuantity);
    if (validation.isValid) {
      onItemChange(item.id, { quantity: numericValue });
      setQuantityErrors(prev => ({ ...prev, [index]: "" }));
    } else {
      setQuantityErrors(prev => ({ ...prev, [index]: validation.error || "" }));
    }
  };

  const handleShipNowChange = (index: number, checked: boolean) => {
    setShipNowStates(prev => ({ ...prev, [index]: checked }));
    const item = orderItems[index];
    
    // Revalidate quantity when shipNow changes
    if (!checked && item.inventory !== undefined && item.quantity > item.inventory) {
      const newQuantity = item.inventory;
      onItemChange(item.id, { quantity: newQuantity });
      setQuantityInputValues(prev => ({ ...prev, [index]: newQuantity.toString() }));
    }
  };

  const handleQuantityInputBlur = (index: number) => {
    const value = quantityInputValues[index];
    if (value === "" || isNaN(parseInt(value, 10))) {
      // Reset to current valid quantity
      const item = orderItems[index];
      setQuantityInputValues(prev => ({ ...prev, [index]: item.quantity.toString() }));
      setQuantityErrors(prev => ({ ...prev, [index]: "" }));
    }
  };

  const handleQuantityInputKeyPress = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = quantityInputValues[index];
      const numericValue = parseInt(value, 10);
      if (!isNaN(numericValue)) {
        const item = orderItems[index];
        onItemChange(item.id, { quantity: numericValue });
      }
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleQuantityChange = useCallback((index: number, quantity: string) => {
    const numQuantity = parseInt(quantity) || 0;
    const item = orderItems[index];
    const isShipNow = shipNowStates[index] || false;
    const maxQuantity = isShipNow ? defaultMaxQuantity : (item.inventory ?? defaultMaxQuantity);
    
    if (numQuantity >= 0) {
      const validation = validateQuantity(numQuantity, maxQuantity);
      if (validation.isValid) {
        onItemChange(item.id, { quantity: numQuantity });
        // Sync input value
        setQuantityInputValues(prev => ({ ...prev, [index]: numQuantity.toString() }));
        setQuantityErrors(prev => ({ ...prev, [index]: "" }));
      } else {
        setQuantityErrors(prev => ({ ...prev, [index]: validation.error || "" }));
      }
    }
  }, [orderItems, onItemChange, shipNowStates]);

  const handlePriceChange = useCallback((index: number, price: string) => {
    const numPrice = parseFloat(price) || 0;
    if (numPrice >= 0) {
      const item = orderItems[index];
      onItemChange(item.id, { sellingPrice: numPrice });
    }
  }, [orderItems, onItemChange]);

  const handleRemoveClick = useCallback((index: number) => {
    const item = orderItems[index];
    onRemoveItem(item.id);
  }, [orderItems, onRemoveItem]);

  return (
    <div className="mb-4">
      {/* Product Selection Section */}
      <div className="bg-card rounded-lg shadow-sm p-4 mb-4">
        <h3 className="text-lg font-semibold mb-3">Chọn sản phẩm</h3>
        <div className="flex gap-2">
          <IonButton
            fill="outline"
            expand="block"
            className="flex-1"
            onClick={onScanBarcode}
          >
            <IonIcon icon={scanOutline} slot="start" />
            Quét mã vạch
          </IonButton>
          <IonButton
            fill="outline"
            expand="block"
            className="flex-1"
            onClick={onSearchProduct}
          >
            <IonIcon icon={searchOutline} slot="start" />
            Tìm sản phẩm
          </IonButton>
        </div>
      </div>

      {/* Order Items List */}
      <div className="bg-card rounded-lg shadow-sm">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">
            Danh sách sản phẩm ({orderItems.length})
          </h3>
        </div>
        
        <div className="relative">
          <IonList ref={orderItemsRef} className="max-h-96 overflow-y-auto">
            {orderItems.length === 0 ? (
              <IonItem>
                <IonLabel>
                  <p className="text-center text-gray-500 py-4">
                    Chưa có sản phẩm nào được thêm
                  </p>
                </IonLabel>
              </IonItem>
            ) : (
              orderItems.map((item, index) => (
                <IonItem key={`${item.productId}-${index}`} className="border-b">
                  <div className="w-full py-2">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <IonText>
                          <h4 className="font-medium">{item.productName}</h4>
                        </IonText>
                        <IonText color="medium">
                          <p className="text-sm">Mã: {item.code}</p>
                        </IonText>
                      </div>
                      <IonButton
                        fill="clear"
                        color="danger"
                        size="small"
                        onClick={() => handleRemoveClick(index)}
                      >
                        <IonIcon icon={trashOutline} />
                      </IonButton>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <IonLabel>
                          <p className="text-sm font-medium mb-1">Số lượng</p>
                          {item.inventory !== undefined && (
                            <p className="text-xs text-gray-400">Tồn kho: {item.inventory}</p>
                          )}
                        </IonLabel>
                        <div className="flex items-center">
                          <button
                            type="button"
                            className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-sm text-teal-400 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              handleQuantityChange(
                                index,
                                Math.max(1, (parseInt(quantityInputValues[index] || item.quantity.toString()) || 1) - 1).toString()
                              )
                            }
                            disabled={(parseInt(quantityInputValues[index] || item.quantity.toString()) || 1) <= 1}
                            aria-label="Giảm số lượng"
                          >
                            –
                          </button>
                          <input
                            type="number"
                            value={quantityInputValues[index] ?? item.quantity.toString()}
                            onChange={(e) => handleQuantityInputChange(index, e.target.value)}
                            onBlur={() => handleQuantityInputBlur(index)}
                            onKeyDown={(e) => handleQuantityInputKeyPress(index, e)}
                            min="1"
                            max={getMaxQuantity(index)}
                            className={`quantity-input w-12 h-8 mx-1 text-center text-sm border rounded focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
                              quantityErrors[index] ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                            aria-label="Số lượng sản phẩm"
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-sm text-teal-400 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() =>
                              handleQuantityChange(
                                index,
                                ((parseInt(quantityInputValues[index] || item.quantity.toString()) || 1) + 1).toString()
                              )
                            }
                            disabled={(parseInt(quantityInputValues[index] || item.quantity.toString()) || 1) >= getMaxQuantity(index)}
                            aria-label="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>
                        {quantityErrors[index] && (
                          <div className="mt-1">
                            <span className="text-xs text-red-600">{quantityErrors[index]}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <IonLabel>
                          <p className="text-sm font-medium mb-1">Đơn giá</p>
                        </IonLabel>
                        <IonInput
                          type="number"
                          value={item.sellingPrice}
                          min="0"
                          step="0.01"
                          onIonInput={(e) =>
                            handlePriceChange(index, e.detail.value!)
                          }
                          className="border rounded px-2 py-1"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-2 flex justify-between items-center">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={shipNowStates[index] || false}
                          onChange={(e) => handleShipNowChange(index, e.target.checked)}
                          className="mr-2"
                        />
                        <span className={`text-sm ${shipNowStates[index] ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                          Giao ngay
                        </span>
                      </div>
                      <IonText color="primary">
                        <p className="font-semibold">
                          Thành tiền: {(item.quantity * item.sellingPrice).toLocaleString("vi-VN")} VND
                        </p>
                      </IonText>
                    </div>
                  </div>
                </IonItem>
              ))
            )}
          </IonList>
          
          {/* Down Arrow Indicator */}
          {showDownArrow && (
            <IonFab vertical="bottom" horizontal="center" className="mb-2">
              <IonFabButton size="small" color="primary">
                <IonIcon icon={arrowDownOutline} />
              </IonFabButton>
            </IonFab>
          )}
        </div>
      </div>
    </div>
  );
});

OrderItemsSection.displayName = "OrderItemsSection";

export default OrderItemsSection;