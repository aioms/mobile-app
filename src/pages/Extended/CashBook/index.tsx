import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  RefresherEventDetail,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { Toast } from "@capacitor/toast";
import dayjs from "dayjs";
import { useHistory } from "react-router";

import { UserRole } from "@/common/enums/user";
import { formatCurrencyWithoutSymbol, parseCurrencyInput } from "@/helpers/formatters";
import { useAuth } from "@/hooks";
import useCashbook from "@/hooks/apis/useCashbook";
import { Refresher } from "@/components/Refresher/Refresher";

import CashBalanceCard from "./components/CashBalanceCard";
import OverviewCard from "./components/OverviewCard";
import { DetailSource, ReportRange } from "./types";
import {
  formatActualCashInputValue,
  formatCashForDayInputValue,
  getBalanceState,
  getPreviousActualCash,
  getSelectedCashBook,
  getEmptyOverview,
} from "./utils";

const CashBookPage: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();
  const { getOverview, getDailyBalance, updateActualCash, updateCashForDay } =
    useCashbook();
  const defaultDate = dayjs().format("YYYY-MM-DD");
  const [reportRange, setReportRange] = useState<ReportRange>("day");
  const [detailSource, setDetailSource] = useState<DetailSource>("orders");
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [overview, setOverview] = useState(() =>
    getEmptyOverview("day", defaultDate),
  );
  const [selectedCashBook, setSelectedCashBook] = useState(() =>
    getSelectedCashBook(defaultDate),
  );
  const [cashForDayInput, setCashForDayInput] = useState("");
  const [actualCashInput, setActualCashInput] = useState("");
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const [isSavingCashForDay, setIsSavingCashForDay] = useState(false);
  const [isSavingActualCash, setIsSavingActualCash] = useState(false);
  const [hasLoadedOverview, setHasLoadedOverview] = useState(false);
  const [hasLoadedBalance, setHasLoadedBalance] = useState(false);
  const overviewRequestRef = useRef(0);
  const balanceRequestRef = useRef(0);

  const canViewCashBook = useMemo(() => {
    return (
      user?.role === UserRole.ADMIN ||
      user?.role === UserRole.MANAGER
    );
  }, [user?.role]);

  const previousActualCash = useMemo(
    () => getPreviousActualCash(selectedCashBook),
    [selectedCashBook],
  );
  const cashRevenue = selectedCashBook.cashRevenue;
  const returnsCash = selectedCashBook.returnsCash;
  const computedCash = selectedCashBook.computedCash;
  const balanceState = useMemo(
    () => getBalanceState(selectedCashBook.balanceStatus, selectedCashBook.difference),
    [selectedCashBook.balanceStatus, selectedCashBook.difference],
  );
  const isInitialLoading =
    (isOverviewLoading || isBalanceLoading) &&
    (!hasLoadedOverview || !hasLoadedBalance);

  const showErrorToast = async (message: string) => {
    await Toast.show({
      text: message,
      duration: "short",
      position: "top",
    });
  };

  useEffect(() => {
    if (!canViewCashBook && user) {
      history.replace("/tabs/extended");
    }
  }, [canViewCashBook, history, user]);

  const loadOverview = useCallback(async () => {
    if (!canViewCashBook) {
      return;
    }

    const currentRequestId = ++overviewRequestRef.current;
    setIsOverviewLoading(true);

    try {
      const response = await getOverview({
        range: reportRange,
        date: selectedDate,
      });

      if (overviewRequestRef.current !== currentRequestId) {
        return;
      }

      setOverview(response);
    } catch (error) {
      if (overviewRequestRef.current !== currentRequestId) {
        return;
      }

      await showErrorToast(
        (error as Error).message || "Không thể tải báo cáo tổng quan",
      );
    } finally {
      if (overviewRequestRef.current === currentRequestId) {
        setIsOverviewLoading(false);
        setHasLoadedOverview(true);
      }
    }
  }, [canViewCashBook, getOverview, reportRange, selectedDate]);

  const loadDailyBalance = useCallback(async () => {
    if (!canViewCashBook) {
      return;
    }

    const currentRequestId = ++balanceRequestRef.current;
    setIsBalanceLoading(true);

    try {
      const response = await getDailyBalance({
        date: selectedDate,
      });

      if (balanceRequestRef.current !== currentRequestId) {
        return;
      }

      setSelectedCashBook(response);
      setCashForDayInput(
        formatCashForDayInputValue(response.cashForDay, response.hasCashForDay),
      );
      setActualCashInput(formatActualCashInputValue(response.actualCash));
    } catch (error) {
      if (balanceRequestRef.current !== currentRequestId) {
        return;
      }

      setSelectedCashBook(getSelectedCashBook(selectedDate));
      setCashForDayInput("");
      setActualCashInput("");
      await showErrorToast((error as Error).message || "Không thể tải quỹ tiền mặt");
    } finally {
      if (balanceRequestRef.current === currentRequestId) {
        setIsBalanceLoading(false);
        setHasLoadedBalance(true);
      }
    }
  }, [canViewCashBook, getDailyBalance, selectedDate]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadDailyBalance();
  }, [loadDailyBalance]);

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    Promise.all([loadOverview(), loadDailyBalance()]).finally(() => {
      event.detail.complete();
    });
  };

  const handleCashForDayChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setCashForDayInput(
      digitsOnly ? formatCurrencyWithoutSymbol(Number(digitsOnly)) : "",
    );
  };

  const handleCashForDayBlur = async () => {
    if (isBalanceLoading || isSavingCashForDay || !selectedDate) {
      return;
    }

    if (!cashForDayInput.trim()) {
      setCashForDayInput(
        formatCashForDayInputValue(
          selectedCashBook.cashForDay,
          selectedCashBook.hasCashForDay,
        ),
      );
      return;
    }

    const parsedCashForDay = parseCurrencyInput(cashForDayInput);

    if (
      selectedCashBook.hasCashForDay &&
      selectedCashBook.cashForDay === parsedCashForDay
    ) {
      setCashForDayInput(
        formatCashForDayInputValue(
          selectedCashBook.cashForDay,
          selectedCashBook.hasCashForDay,
        ),
      );
      return;
    }

    try {
      setIsSavingCashForDay(true);
      const response = await updateCashForDay({
        date: selectedDate,
        cashForDay: parsedCashForDay,
      });

      setSelectedCashBook((previous) => ({
        ...previous,
        cashForDay: response.cashForDay,
        hasCashForDay: response.hasCashForDay,
        actualCash: response.actualCash,
        computedCash: response.computedCash,
        hasActualCash: response.hasActualCash,
        difference: response.difference,
        balanceStatus: response.balanceStatus,
      }));
      setCashForDayInput(
        formatCashForDayInputValue(response.cashForDay, response.hasCashForDay),
      );
      setActualCashInput(formatActualCashInputValue(response.actualCash));
      await Toast.show({
        text: "Đã cập nhật tiền đầu ngày",
        duration: "short",
        position: "top",
      });
    } catch (error) {
      setCashForDayInput(
        formatCashForDayInputValue(
          selectedCashBook.cashForDay,
          selectedCashBook.hasCashForDay,
        ),
      );
      await showErrorToast(
        (error as Error).message || "Không thể cập nhật tiền đầu ngày",
      );
    } finally {
      setIsSavingCashForDay(false);
    }
  };

  const handleActualCashChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setActualCashInput(
      digitsOnly ? formatCurrencyWithoutSymbol(Number(digitsOnly)) : "",
    );
  };

  const handleActualCashBlur = async () => {
    if (isBalanceLoading || isSavingActualCash || !selectedDate) {
      return;
    }

    if (!actualCashInput.trim()) {
      setActualCashInput(formatActualCashInputValue(selectedCashBook.actualCash));
      return;
    }

    const parsedActualCash = parseCurrencyInput(actualCashInput);

    if (selectedCashBook.actualCash === parsedActualCash) {
      setActualCashInput(formatActualCashInputValue(selectedCashBook.actualCash));
      return;
    }

    try {
      setIsSavingActualCash(true);
      const response = await updateActualCash({
        date: selectedDate,
        actualCash: parsedActualCash,
      });

      setSelectedCashBook((previous) => ({
        ...previous,
        cashForDay: response.cashForDay,
        hasCashForDay: response.hasCashForDay,
        actualCash: response.actualCash,
        computedCash: response.computedCash,
        hasActualCash: response.hasActualCash,
        difference: response.difference,
        balanceStatus: response.balanceStatus,
      }));
      setCashForDayInput(
        formatCashForDayInputValue(response.cashForDay, response.hasCashForDay),
      );
      setActualCashInput(formatActualCashInputValue(response.actualCash));
      await Toast.show({
        text: "Đã cập nhật tiền mặt thực tế",
        duration: "short",
        position: "top",
      });
    } catch (error) {
      setActualCashInput(formatActualCashInputValue(selectedCashBook.actualCash));
      await showErrorToast(
        (error as Error).message || "Không thể cập nhật tiền mặt thực tế",
      );
    } finally {
      setIsSavingActualCash(false);
    }
  };

  if (!canViewCashBook) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/extended" color="dark" />
          </IonButtons>
          <div className="pointer-events-none absolute inset-0 flex w-full flex-1 items-center justify-center">
            <IonTitle className="text-center text-[17px] font-bold text-gray-900">
              Sổ thu chi
            </IonTitle>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <Refresher onRefresh={handleRefresh} />
        {isInitialLoading ? (
          <div className="flex min-h-[50vh] items-center justify-center px-4 py-10">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <IonSpinner name="crescent" color="primary" />
              Đang tải dữ liệu sổ thu chi...
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-4 py-4">
            <OverviewCard
              reportRange={reportRange}
              overview={overview}
              detailSource={detailSource}
              onChangeRange={setReportRange}
              onChangeDetailSource={setDetailSource}
            />

            <CashBalanceCard
              selectedDate={selectedDate}
              selectedCashBook={selectedCashBook}
              returnsCash={returnsCash}
              previousActualCash={previousActualCash}
              cashRevenue={cashRevenue}
              computedCash={computedCash}
              cashForDayInput={cashForDayInput}
              actualCashInput={actualCashInput}
              balanceState={balanceState}
              isInputDisabled={
                isBalanceLoading || isSavingCashForDay || isSavingActualCash
              }
              onDateChange={setSelectedDate}
              onCashForDayChange={handleCashForDayChange}
              onCashForDayBlur={handleCashForDayBlur}
              onActualCashChange={handleActualCashChange}
              onActualCashBlur={handleActualCashBlur}
            />
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

export default CashBookPage;
