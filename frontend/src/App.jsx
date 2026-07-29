import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { ActionButton } from "./components/ActionButton";
import { Layout } from "./components/Layout";
import { api, clearAccessToken, getAccessToken } from "./lib/api";
import { configureBackButton, downloadFileViaTelegram, getTelegramInitData, setupTelegramUi, triggerImpact, triggerNotification } from "./lib/telegram";
import { BuyNotesPage } from "./pages/BuyNotesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { WalletPage } from "./pages/WalletPage";

function mergeDashboardState(dashboard) {
  return {
    loading: false,
    error: "",
    user: dashboard.user,
    config: dashboard.config,
    transactions: dashboard.transactions || [],
    pendingPayment: dashboard.pendingPayment,
    paymentHistory: dashboard.paymentHistory || [],
    products: dashboard.products || [],
    purchases: dashboard.purchases || [],
    notifications: dashboard.notifications || []
  };
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const toastTimerRef = useRef(null);
  const [toast, setToast] = useState("");
  const [selectedDepositProductId, setSelectedDepositProductId] = useState("");
  const [state, setState] = useState({
    loading: true,
    error: "",
    user: null,
    config: null,
    transactions: [],
    pendingPayment: null,
    paymentHistory: [],
    products: [],
    purchases: [],
    notifications: []
  });

  async function loadApp() {
    const initData = getTelegramInitData();

    if (!initData) {
      setState((current) => ({
        ...current,
        loading: false,
        error: "Open EduStack from Telegram (Mini App). A signed session is required."
      }));
      return;
    }

    let dashboard;
    try {
      if (getAccessToken()) {
        dashboard = await api.getMe();
      } else {
        throw new Error("no token");
      }
    } catch {
      clearAccessToken();
      dashboard = await api.createSession(initData);
    }

    setState(mergeDashboardState(dashboard));
  }

  useEffect(() => {
    setupTelegramUi();
    loadApp().catch((error) => {
      triggerNotification("error");
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message || "Failed to load EduStack"
      }));
    });
  }, []);

  useEffect(() => {
    if (!state.products.length) {
      setSelectedDepositProductId("");
      return;
    }

    const ownedProductIds = new Set((state.purchases || []).map((purchase) => String(purchase.product?._id || purchase.product)));
    const preferredProduct =
      state.products.find((product) => String(product._id) === String(selectedDepositProductId)) ||
      state.products.find((product) => !ownedProductIds.has(String(product._id))) ||
      state.products[0] ||
      null;

    if (preferredProduct && String(preferredProduct._id) !== String(selectedDepositProductId)) {
      setSelectedDepositProductId(String(preferredProduct._id));
    }
  }, [selectedDepositProductId, state.products, state.purchases]);

  useEffect(() => {
    const hideBackButton = configureBackButton({
      isVisible: location.pathname !== "/",
      onClick: () => {
        if (location.pathname === "/") {
          return;
        }
        navigate("/");
      }
    });

    return hideBackButton;
  }, [location.pathname, navigate]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
  }, []);

  function showToast(message) {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setToast(""), 1800);
  }

  async function refresh() {
    try {
      const initData = getTelegramInitData();
      if (!initData) {
        throw new Error("Telegram session missing. Reopen from Telegram.");
      }
      let dashboard;
      try {
        dashboard = await api.getMe();
      } catch {
        clearAccessToken();
        dashboard = await api.createSession(initData);
      }
      setState(mergeDashboardState(dashboard));
    } catch (error) {
      triggerNotification("error");
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message || "Failed to refresh"
      }));
    }
  }

  async function handlePaymentUpload(file, productId, paymentRouteKey) {
    const formData = new FormData();
    formData.append("screenshot", file);
    if (productId) {
      formData.append("productId", productId);
    }
    if (paymentRouteKey) {
      formData.append("paymentRouteKey", paymentRouteKey);
    }
    await api.uploadPayment(formData);
    triggerNotification("success");
    showToast("Payment proof submitted");
    await refresh();
  }

  async function handleDownloadProduct(productId) {
    const { url } = await api.createProductDownloadLink(productId);
    if (!url) {
      throw new Error("Download link is not available right now.");
    }

    const filename = `edustack-ai-master-notes-351-pages-${Date.now()}.pdf`;
    const started = downloadFileViaTelegram({
      url,
      filename
    });

    if (!started) {
      throw new Error("Download could not be started right now.");
    }

    triggerImpact("light");
    showToast("Download started");
  }

  async function handleSendProductToChat(productId) {
    await api.sendProductToChat(productId);
    triggerNotification("success");
    showToast("PDF sent in Telegram chat");
  }

  function handleSelectDepositProduct(productId, { openWallet = false } = {}) {
    setSelectedDepositProductId(String(productId || ""));
    if (openWallet) {
      navigate("/wallet");
    }
  }

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app text-white">
        <div className="glass rounded-[28px] px-6 py-5 text-sm text-white/75">Loading EduStack...</div>
      </div>
    );
  }

  if (state.error || !state.user || !state.config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app px-4 text-white">
        <div className="glass max-w-sm rounded-[28px] p-6 text-center">
          <p className="text-lg font-semibold">Could not load EduStack</p>
          <p className="mt-2 text-sm text-white/60">{state.error || "Unknown error"}</p>
          <div className="mt-5">
            <ActionButton
              onClick={() => {
                setState((current) => ({ ...current, loading: true, error: "" }));
                loadApp().catch(() => {});
              }}
            >
              Retry
            </ActionButton>
          </div>
        </div>
      </div>
    );
  }

  const defaultHome = "/";

  return (
    <Layout user={{ ...state.user, companyName: state.config.companyName }} toast={toast}>
      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              user={state.user}
              config={state.config}
              transactions={state.transactions}
              notifications={state.notifications}
              paymentHistory={state.paymentHistory}
              purchases={state.purchases}
              products={state.products}
              onDepositSelect={handleSelectDepositProduct}
              onDownload={handleDownloadProduct}
              onSendToChat={handleSendProductToChat}
            />
          }
        />
        <Route
          path="/buy-notes"
          element={
            <BuyNotesPage
              user={state.user}
              config={state.config}
              pendingPayment={state.pendingPayment}
              paymentHistory={state.paymentHistory}
              products={state.products}
              purchases={state.purchases}
              selectedProductId={selectedDepositProductId}
              onDepositSelect={handleSelectDepositProduct}
              onDownload={handleDownloadProduct}
              onSendToChat={handleSendProductToChat}
            />
          }
        />
        <Route
          path="/wallet"
          element={
            <WalletPage
              user={state.user}
              config={state.config}
              transactions={state.transactions}
              pendingPayment={state.pendingPayment}
              paymentHistory={state.paymentHistory}
              products={state.products}
              purchases={state.purchases}
              selectedProductId={selectedDepositProductId}
              onDepositSelect={handleSelectDepositProduct}
              onUpload={handlePaymentUpload}
            />
          }
        />
        <Route path="*" element={<Navigate to={defaultHome} replace />} />
      </Routes>
    </Layout>
  );
}
